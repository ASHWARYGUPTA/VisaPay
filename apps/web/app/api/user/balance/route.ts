import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../lib/auth";
import prisma from "../../../../lib/prismaClientGenerator";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session!.user as any).id as string;

    // Fetch user with balance and transaction stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentBalance: true,
        transactionsSent: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
        transactionsReceived: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
        moneyRequestsSent: {
          where: { status: "PENDING" },
        },
        moneyRequestsReceived: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total sent
    const totalSent = (user as any).transactionsSent.reduce(
      (sum: number, tx: { amount: number }) => sum + tx.amount,
      0
    );

    // Calculate total received
    const totalReceived = (user as any).transactionsReceived.reduce(
      (sum: number, tx: { amount: number }) => sum + tx.amount,
      0
    );

    // Count pending requests
    const pendingRequests = (user as any).moneyRequestsSent.length;
    const pendingIncoming = (user as any).moneyRequestsReceived.length;

    return NextResponse.json({
      success: true,
      balance: {
        currentBalance: user.currentBalance, // In paise
        stats: {
          totalSent,
          totalReceived,
          pendingRequests,
          pendingIncoming,
        },
      },
    });
  } catch (error) {
    console.error("Get balance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
