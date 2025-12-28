import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../../lib/auth";
import { MoneyRequestService } from "../../../../../lib/services/money-request.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session!.user as any).id as string;
    const { id } = await params;

    const result = await MoneyRequestService.cancelRequest(id, userId);

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
      request: result.request,
    });
  } catch (error) {
    console.error("Cancel request API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
