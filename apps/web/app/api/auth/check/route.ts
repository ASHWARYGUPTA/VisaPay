import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  return NextResponse.json({
    message: "This is Test",
    session, // This will be null if the user is not authenticated
  });
}
