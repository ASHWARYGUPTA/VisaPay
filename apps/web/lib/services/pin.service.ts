import prisma from "../prismaClientGenerator";
import { compare, hash } from "bcrypt";

const SALT_ROUNDS = 10;
const PIN_LENGTH_MIN = 4;
const PIN_LENGTH_MAX = 6;

export class PinService {
  /**
   * Set or update user's payment PIN
   */
  static async setPin(userId: string, pin: string, currentPin?: string) {
    try {
      // Validate PIN format
      if (!/^\d+$/.test(pin)) {
        return {
          success: false,
          error: "PIN must contain only numbers",
          errorCode: "INVALID_PIN_FORMAT",
        };
      }

      if (pin.length < PIN_LENGTH_MIN || pin.length > PIN_LENGTH_MAX) {
        return {
          success: false,
          error: `PIN must be ${PIN_LENGTH_MIN}-${PIN_LENGTH_MAX} digits`,
          errorCode: "INVALID_PIN_LENGTH",
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { paymentPin: true },
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
          errorCode: "USER_NOT_FOUND",
        };
      }

      // If user already has a PIN, verify current PIN
      if (user.paymentPin && currentPin) {
        const isValid = await compare(currentPin, user.paymentPin);
        if (!isValid) {
          return {
            success: false,
            error: "Current PIN is incorrect",
            errorCode: "INVALID_CURRENT_PIN",
          };
        }
      } else if (user.paymentPin && !currentPin) {
        return {
          success: false,
          error: "Current PIN is required to change PIN",
          errorCode: "CURRENT_PIN_REQUIRED",
        };
      }

      // Hash new PIN
      const hashedPin = await hash(pin, SALT_ROUNDS);

      // Update user's PIN
      await prisma.user.update({
        where: { id: userId },
        data: {
          paymentPin: hashedPin,
          pinSetAt: new Date(),
        },
      });

      return {
        success: true,
        message: user.paymentPin
          ? "PIN updated successfully"
          : "PIN set successfully",
      };
    } catch (error) {
      console.error("Error setting PIN:", error);
      return {
        success: false,
        error: "Failed to set PIN",
        errorCode: "SET_PIN_ERROR",
      };
    }
  }

  /**
   * Verify user's payment PIN
   */
  static async verifyPin(userId: string, pin: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { paymentPin: true },
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
          errorCode: "USER_NOT_FOUND",
        };
      }

      if (!user.paymentPin) {
        return {
          success: false,
          error: "PIN not set. Please set up your payment PIN first",
          errorCode: "PIN_NOT_SET",
        };
      }

      const isValid = await compare(pin, user.paymentPin);

      if (!isValid) {
        return {
          success: false,
          error: "Incorrect PIN",
          errorCode: "INVALID_PIN",
        };
      }

      return {
        success: true,
        message: "PIN verified successfully",
      };
    } catch (error) {
      console.error("Error verifying PIN:", error);
      return {
        success: false,
        error: "Failed to verify PIN",
        errorCode: "VERIFY_PIN_ERROR",
      };
    }
  }

  /**
   * Check if user has set up a PIN
   */
  static async hasPin(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { paymentPin: true, pinSetAt: true },
      });

      return {
        hasPin: !!user?.paymentPin,
        pinSetAt: user?.pinSetAt || null,
      };
    } catch (error) {
      console.error("Error checking PIN:", error);
      return {
        hasPin: false,
        pinSetAt: null,
      };
    }
  }

  /**
   * Create a payment session (temporary storage before PIN verification)
   */
  static async createPaymentSession(data: {
    userId: string;
    paymentType: "SEND_MONEY" | "REQUEST_MONEY";
    amount: number;
    toUserIdentifier: string;
    description?: string;
    metadata?: any;
  }) {
    try {
      // Generate unique session token
      const sessionToken = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Session expires in 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const session = await prisma.paymentSession.create({
        data: {
          userId: data.userId,
          sessionToken,
          paymentType: data.paymentType,
          amount: data.amount,
          toUserIdentifier: data.toUserIdentifier,
          description: data.description,
          metadata: data.metadata,
          expiresAt,
        },
      });

      return {
        success: true,
        session: {
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error("Error creating payment session:", error);
      return {
        success: false,
        error: "Failed to create payment session",
        errorCode: "CREATE_SESSION_ERROR",
      };
    }
  }

  /**
   * Get payment session details
   */
  static async getPaymentSession(sessionToken: string, userId: string) {
    try {
      const session = await prisma.paymentSession.findUnique({
        where: { sessionToken },
      });

      if (!session) {
        return {
          success: false,
          error: "Payment session not found",
          errorCode: "SESSION_NOT_FOUND",
        };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        };
      }

      if (session.expiresAt < new Date()) {
        await prisma.paymentSession.update({
          where: { sessionToken },
          data: { status: "EXPIRED" },
        });

        return {
          success: false,
          error: "Payment session has expired",
          errorCode: "SESSION_EXPIRED",
        };
      }

      if (session.status !== "PENDING") {
        return {
          success: false,
          error: "Payment session is not pending",
          errorCode: "INVALID_SESSION_STATUS",
        };
      }

      return {
        success: true,
        session,
      };
    } catch (error) {
      console.error("Error getting payment session:", error);
      return {
        success: false,
        error: "Failed to get payment session",
        errorCode: "GET_SESSION_ERROR",
      };
    }
  }

  /**
   * Complete payment session (mark as completed)
   */
  static async completePaymentSession(sessionToken: string) {
    try {
      await prisma.paymentSession.update({
        where: { sessionToken },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error completing payment session:", error);
      return {
        success: false,
        error: "Failed to complete payment session",
      };
    }
  }

  /**
   * Cancel payment session
   */
  static async cancelPaymentSession(sessionToken: string, userId: string) {
    try {
      const session = await prisma.paymentSession.findUnique({
        where: { sessionToken },
      });

      if (!session || session.userId !== userId) {
        return {
          success: false,
          error: "Payment session not found",
          errorCode: "SESSION_NOT_FOUND",
        };
      }

      await prisma.paymentSession.update({
        where: { sessionToken },
        data: { status: "CANCELLED" },
      });

      return { success: true };
    } catch (error) {
      console.error("Error cancelling payment session:", error);
      return {
        success: false,
        error: "Failed to cancel payment session",
      };
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions() {
    try {
      await prisma.paymentSession.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          status: "PENDING",
        },
        data: { status: "EXPIRED" },
      });

      return { success: true };
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      return { success: false };
    }
  }
}
