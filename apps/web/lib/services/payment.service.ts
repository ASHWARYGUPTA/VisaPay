import prisma from "../prismaClientGenerator";

export interface CreatePaymentInput {
  userId: string;
  amount: number;
  currency?: string;
  description?: string;
}

export class PaymentService {
  static async createPayment(data: CreatePaymentInput) {
    return await prisma.$transaction(async (tx) => {
      // Get user's current balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { currentBalance: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Create the payment record
      const payment = await tx.payments.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          currency: data.currency || "INR",
          status: "pending",
          description: data.description,
        },
      });

      // Update user's balance
      await tx.user.update({
        where: { id: data.userId },
        data: {
          currentBalance: user.currentBalance + data.amount,
        },
      });

      return payment;
    });
  }
}
