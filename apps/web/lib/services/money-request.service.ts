import prisma from "../prismaClientGenerator";

export interface CreateMoneyRequestInput {
  fromUserId: string; // Person requesting money
  toUserIdentifier: string; // email or username of person who should pay
  amount: number;
  description?: string;
  message?: string;
  currency?: string;
  expiresInHours?: number;
}

export interface RespondToRequestInput {
  requestId: string;
  userId: string;
  action: "accept" | "reject";
}

export class MoneyRequestService {
  /**
   * Create a money request
   */
  static async createRequest(input: CreateMoneyRequestInput) {
    try {
      // Validate input
      if (input.amount <= 0) {
        return {
          success: false,
          error: "Amount must be greater than 0",
          errorCode: "INVALID_AMOUNT",
        };
      }

      // Find recipient (person who should pay)
      const recipient = await prisma.user.findFirst({
        where: {
          OR: [
            { email: input.toUserIdentifier },
            { username: input.toUserIdentifier },
          ],
        },
      });

      if (!recipient) {
        return {
          success: false,
          error: "User not found",
          errorCode: "USER_NOT_FOUND",
        };
      }

      if (recipient.id === input.fromUserId) {
        return {
          success: false,
          error: "Cannot request money from yourself",
          errorCode: "SELF_REQUEST",
        };
      }

      // Calculate expiration
      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      // Create money request
      const request = await prisma.moneyRequest.create({
        data: {
          fromUserId: input.fromUserId,
          toUserId: recipient.id,
          amount: input.amount,
          currency: input.currency || "INR",
          description: input.description,
          message: input.message,
          expiresAt,
        },
        include: {
          fromUser: { select: { name: true, email: true, username: true } },
          toUser: { select: { name: true, email: true, username: true } },
        },
      });

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error("Error creating money request:", error);
      return {
        success: false,
        error: "Failed to create money request",
        errorCode: "CREATE_ERROR",
      };
    }
  }

  /**
   * Respond to a money request (accept or reject)
   */
  static async respondToRequest(input: RespondToRequestInput) {
    try {
      const request = await prisma.moneyRequest.findUnique({
        where: { id: input.requestId },
        include: {
          fromUser: true,
          toUser: true,
        },
      });

      if (!request) {
        return {
          success: false,
          error: "Request not found",
          errorCode: "NOT_FOUND",
        };
      }

      // Verify the user is the one who should respond
      if (request.toUserId !== input.userId) {
        return {
          success: false,
          error: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        };
      }

      // Check if request is still pending
      if (request.status !== "PENDING") {
        return {
          success: false,
          error: "Request has already been responded to",
          errorCode: "ALREADY_RESPONDED",
        };
      }

      // Check if expired
      if (request.expiresAt && request.expiresAt < new Date()) {
        await prisma.moneyRequest.update({
          where: { id: request.id },
          data: { status: "EXPIRED" },
        });

        return {
          success: false,
          error: "Request has expired",
          errorCode: "EXPIRED",
        };
      }

      if (input.action === "reject") {
        // Simply mark as rejected
        const updated = await prisma.moneyRequest.update({
          where: { id: request.id },
          data: {
            status: "REJECTED",
            respondedAt: new Date(),
          },
          include: {
            fromUser: { select: { name: true, email: true, username: true } },
            toUser: { select: { name: true, email: true, username: true } },
          },
        });

        return {
          success: true,
          request: updated,
        };
      }

      // Accept - create transaction using TransactionService
      const { TransactionService } = await import("./transaction.service");

      const transactionResult = await TransactionService.sendMoney({
        fromUserId: request.toUserId, // Person paying
        toUserIdentifier: request.fromUser.email || request.fromUser.username!,
        amount: request.amount,
        description:
          request.description || `Payment for request: ${request.id}`,
        currency: request.currency,
      });

      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
          errorCode: transactionResult.errorCode,
        };
      }

      // Update request status
      const updated = await prisma.moneyRequest.update({
        where: { id: request.id },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
          transactionId: transactionResult.transaction.id,
        },
        include: {
          fromUser: { select: { name: true, email: true, username: true } },
          toUser: { select: { name: true, email: true, username: true } },
        },
      });

      return {
        success: true,
        request: updated,
        transaction: transactionResult.transaction,
      };
    } catch (error) {
      console.error("Error responding to request:", error);
      return {
        success: false,
        error: "Failed to respond to request",
        errorCode: "RESPOND_ERROR",
      };
    }
  }

  /**
   * Cancel a money request
   */
  static async cancelRequest(requestId: string, userId: string) {
    try {
      const request = await prisma.moneyRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return {
          success: false,
          error: "Request not found",
          errorCode: "NOT_FOUND",
        };
      }

      // Only the requester can cancel
      if (request.fromUserId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        };
      }

      if (request.status !== "PENDING") {
        return {
          success: false,
          error: "Only pending requests can be cancelled",
          errorCode: "INVALID_STATUS",
        };
      }

      const updated = await prisma.moneyRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });

      return {
        success: true,
        request: updated,
      };
    } catch (error) {
      console.error("Error cancelling request:", error);
      return {
        success: false,
        error: "Failed to cancel request",
        errorCode: "CANCEL_ERROR",
      };
    }
  }

  /**
   * Get pending requests for a user (both sent and received)
   */
  static async getUserRequests(userId: string) {
    const [sentRequests, receivedRequests] = await Promise.all([
      prisma.moneyRequest.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: { select: { name: true, email: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.moneyRequest.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: { select: { name: true, email: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      sent: sentRequests,
      received: receivedRequests,
    };
  }

  /**
   * Get request details
   */
  static async getRequestDetails(requestId: string, userId: string) {
    const request = await prisma.moneyRequest.findUnique({
      where: { id: requestId },
      include: {
        fromUser: { select: { name: true, email: true, username: true } },
        toUser: { select: { name: true, email: true, username: true } },
      },
    });

    if (!request) {
      return null;
    }

    // Check authorization
    if (request.fromUserId !== userId && request.toUserId !== userId) {
      return null;
    }

    return request;
  }
}
