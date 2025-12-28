import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../lib/auth";
import { PinService } from "../../../../lib/services/pin.service";
import { TransactionService } from "../../../../lib/services/transaction.service";
import { MoneyRequestService } from "../../../../lib/services/money-request.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionToken, pin } = body;

    if (!sessionToken || !pin) {
      return NextResponse.json(
        { error: "Session token and PIN are required" },
        { status: 400 }
      );
    }

    const userId = (session!.user as any).id as string;

    // Verify PIN
    const pinResult = await PinService.verifyPin(userId, pin);
    if (!pinResult.success) {
      return NextResponse.json(
        {
          error: pinResult.error,
          errorCode: pinResult.errorCode,
        },
        { status: 400 }
      );
    }

    // Get payment session
    const sessionResult = await PinService.getPaymentSession(
      sessionToken,
      userId
    );

    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        {
          error: sessionResult.error || "Payment session not found",
          errorCode: sessionResult.errorCode,
        },
        { status: 400 }
      );
    }

    const paymentSession = sessionResult.session;

    // Check if this is a request payment
    const metadata = paymentSession.metadata as any;
    const isRequestPayment = metadata?.isRequestPayment && metadata?.requestId;

    // Execute payment based on type
    let result;
    if (paymentSession.paymentType === "SEND_MONEY") {
      // If this is a request payment, accept the request
      if (isRequestPayment) {
        result = await MoneyRequestService.respondToRequest({
          requestId: metadata.requestId,
          userId,
          action: "accept",
        });
      } else {
        // Regular send money transaction
        result = await TransactionService.sendMoney({
          fromUserId: userId,
          toUserIdentifier: paymentSession.toUserIdentifier,
          amount: paymentSession.amount,
          description: paymentSession.description || undefined,
          currency: "INR",
        });
      }
    } else if (paymentSession.paymentType === "REQUEST_MONEY") {
      result = await MoneyRequestService.createRequest({
        fromUserId: userId,
        toUserIdentifier: paymentSession.toUserIdentifier,
        amount: paymentSession.amount,
        description: paymentSession.description || undefined,
        currency: "INR",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    // Mark session as completed
    await PinService.completePaymentSession(sessionToken);

    return NextResponse.json({
      success: true,
      transaction: (result as any).transaction || (result as any).request,
    });
  } catch (error) {
    console.error("Confirm payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
