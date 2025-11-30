import prisma from "../prismaClientGenerator";

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

export interface SendMoneyInput {
  fromUserId: string;
  toUserIdentifier: string; // email or username
  amount: number;
  description?: string;
  currency?: string;
}

export interface TransactionResult {
  success: boolean;
  transaction?: any;
  error?: string;
  errorCode?: string;
}

export class TransactionService {
  /**
   * Send money from one user to another with retry logic
   */
  static async sendMoney(input: SendMoneyInput): Promise<TransactionResult> {
    try {
      // Validate input
      if (input.amount <= 0) {
        return {
          success: false,
          error: "Amount must be greater than 0",
          errorCode: "INVALID_AMOUNT",
        };
      }

      // Find recipient by email or username
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
          error: "Recipient not found",
          errorCode: "RECIPIENT_NOT_FOUND",
        };
      }

      if (recipient.id === input.fromUserId) {
        return {
          success: false,
          error: "Cannot send money to yourself",
          errorCode: "SELF_TRANSFER",
        };
      }

      // Check sender's balance
      const sender = await prisma.user.findUnique({
        where: { id: input.fromUserId },
        select: { currentBalance: true, name: true, email: true },
      });

      if (!sender) {
        return {
          success: false,
          error: "Sender not found",
          errorCode: "SENDER_NOT_FOUND",
        };
      }

      if (sender.currentBalance < input.amount) {
        return {
          success: false,
          error: "Insufficient balance",
          errorCode: "INSUFFICIENT_BALANCE",
        };
      }

      // Create transaction and attempt with retry logic
      return await this.executeTransactionWithRetry({
        fromUserId: input.fromUserId,
        toUserId: recipient.id,
        amount: input.amount,
        currency: input.currency || "INR",
        description: input.description,
        type: "SEND",
      });
    } catch (error) {
      console.error("Error in sendMoney:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Execute transaction with automatic retry logic
   */
  private static async executeTransactionWithRetry(
    transactionData: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      currency: string;
      description?: string;
      type: "SEND" | "REQUEST_PAYMENT" | "REFUND";
    },
    attemptNumber: number = 1
  ): Promise<TransactionResult> {
    try {
      // Create or get existing transaction
      let transaction = await prisma.transaction.findFirst({
        where: {
          fromUserId: transactionData.fromUserId,
          toUserId: transactionData.toUserId,
          amount: transactionData.amount,
          status: { in: ["PENDING", "PROCESSING"] },
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (!transaction) {
        // Create new transaction
        transaction = await prisma.transaction.create({
          data: {
            fromUserId: transactionData.fromUserId,
            toUserId: transactionData.toUserId,
            amount: transactionData.amount,
            currency: transactionData.currency,
            description: transactionData.description,
            type: transactionData.type,
            status: "PENDING",
          },
        });
      }

      // Execute the transaction
      const result = await this.processTransaction(
        transaction.id,
        attemptNumber
      );

      if (!result.success && attemptNumber < MAX_RETRY_ATTEMPTS) {
        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attemptNumber)
        );

        // Retry
        console.log(
          `Retrying transaction ${transaction.id}, attempt ${attemptNumber + 1}`
        );
        return await this.executeTransactionWithRetry(
          transactionData,
          attemptNumber + 1
        );
      }

      return result;
    } catch (error) {
      console.error(`Transaction attempt ${attemptNumber} failed:`, error);

      if (attemptNumber < MAX_RETRY_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attemptNumber)
        );
        return await this.executeTransactionWithRetry(
          transactionData,
          attemptNumber + 1
        );
      }

      return {
        success: false,
        error: "Transaction failed after multiple attempts",
        errorCode: "MAX_RETRIES_EXCEEDED",
      };
    }
  }

  /**
   * Process a single transaction attempt
   */
  private static async processTransaction(
    transactionId: string,
    attemptNumber: number
  ): Promise<TransactionResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get transaction details
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
          include: {
            fromUser: { select: { currentBalance: true, name: true } },
            toUser: { select: { currentBalance: true, name: true } },
          },
        });

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        // Create attempt record
        const attempt = await tx.transactionAttempt.create({
          data: {
            transactionId: transaction.id,
            attemptNumber,
            status: "PROCESSING",
          },
        });

        // Check balance again (defensive programming)
        if (transaction.fromUser.currentBalance < transaction.amount) {
          await tx.transactionAttempt.update({
            where: { id: attempt.id },
            data: {
              status: "FAILED",
              errorMessage: "Insufficient balance",
              errorCode: "INSUFFICIENT_BALANCE",
            },
          });

          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "FAILED",
              failureReason: "Insufficient balance",
            },
          });

          throw new Error("INSUFFICIENT_BALANCE");
        }

        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "PROCESSING" },
        });

        // Deduct from sender
        await tx.user.update({
          where: { id: transaction.fromUserId },
          data: {
            currentBalance: {
              decrement: transaction.amount,
            },
          },
        });

        // Add to recipient
        await tx.user.update({
          where: { id: transaction.toUserId },
          data: {
            currentBalance: {
              increment: transaction.amount,
            },
          },
        });

        // Mark transaction as completed
        const completedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
          include: {
            fromUser: { select: { name: true, email: true, username: true } },
            toUser: { select: { name: true, email: true, username: true } },
          },
        });

        // Mark attempt as completed
        await tx.transactionAttempt.update({
          where: { id: attempt.id },
          data: { status: "COMPLETED" },
        });

        return completedTransaction;
      });

      return {
        success: true,
        transaction: result,
      };
    } catch (error: any) {
      console.error(
        `Transaction processing failed (attempt ${attemptNumber}):`,
        error
      );

      // Record failed attempt
      try {
        await prisma.transactionAttempt.updateMany({
          where: {
            transactionId,
            attemptNumber,
          },
          data: {
            status: "FAILED",
            errorMessage: error.message,
            errorCode: error.message.includes("INSUFFICIENT_BALANCE")
              ? "INSUFFICIENT_BALANCE"
              : "PROCESSING_ERROR",
          },
        });
      } catch (e) {
        console.error("Failed to record attempt:", e);
      }

      return {
        success: false,
        error: error.message || "Transaction processing failed",
        errorCode: error.message.includes("INSUFFICIENT_BALANCE")
          ? "INSUFFICIENT_BALANCE"
          : "PROCESSING_ERROR",
      };
    }
  }

  /**
   * Manual retry for a failed transaction
   */
  static async retryTransaction(
    transactionId: string,
    userId: string
  ): Promise<TransactionResult> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          attempts: { orderBy: { attemptNumber: "desc" }, take: 1 },
        },
      });

      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found",
          errorCode: "NOT_FOUND",
        };
      }

      if (transaction.fromUserId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        };
      }

      if (transaction.status !== "FAILED") {
        return {
          success: false,
          error: "Only failed transactions can be retried",
          errorCode: "INVALID_STATUS",
        };
      }

      const lastAttemptNumber = transaction.attempts[0]?.attemptNumber || 0;

      if (lastAttemptNumber >= MAX_RETRY_ATTEMPTS) {
        return {
          success: false,
          error: "Maximum retry attempts exceeded",
          errorCode: "MAX_RETRIES_EXCEEDED",
        };
      }

      // Reset transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "PENDING" },
      });

      // Process with next attempt number
      return await this.processTransaction(
        transactionId,
        lastAttemptNumber + 1
      );
    } catch (error) {
      console.error("Error in retryTransaction:", error);
      return {
        success: false,
        error: "Failed to retry transaction",
        errorCode: "RETRY_ERROR",
      };
    }
  }

  /**
   * Get transaction history for a user
   */
  static async getTransactionHistory(userId: string, limit: number = 10) {
    return await prisma.transaction.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { name: true, email: true, username: true } },
        toUser: { select: { name: true, email: true, username: true } },
        attempts: { orderBy: { attemptNumber: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get transaction details
   */
  static async getTransactionDetails(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromUser: { select: { name: true, email: true, username: true } },
        toUser: { select: { name: true, email: true, username: true } },
        attempts: { orderBy: { attemptNumber: "asc" } },
      },
    });

    if (!transaction) {
      return null;
    }

    // Check authorization
    if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
      return null;
    }

    return transaction;
  }

  /**
   * Cancel a pending transaction
   */
  static async cancelTransaction(
    transactionId: string,
    userId: string
  ): Promise<TransactionResult> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found",
          errorCode: "NOT_FOUND",
        };
      }

      if (transaction.fromUserId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        };
      }

      if (transaction.status !== "PENDING") {
        return {
          success: false,
          error: "Only pending transactions can be cancelled",
          errorCode: "INVALID_STATUS",
        };
      }

      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "CANCELLED" },
      });

      return {
        success: true,
        transaction: updated,
      };
    } catch (error) {
      console.error("Error in cancelTransaction:", error);
      return {
        success: false,
        error: "Failed to cancel transaction",
        errorCode: "CANCEL_ERROR",
      };
    }
  }
}
