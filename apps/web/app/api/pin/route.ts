import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../lib/auth";
import { PinService } from "../../../lib/services/pin.service";

// Set or update PIN
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session!.user as any).id as string;
    const body = await req.json();
    const { pin, currentPin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const result = await PinService.setPin(userId, pin, currentPin);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Set PIN API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if user has PIN
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session!.user as any).id as string;
    const result = await PinService.hasPin(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check PIN API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
