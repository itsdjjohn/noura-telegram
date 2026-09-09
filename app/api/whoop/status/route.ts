import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET);

  return NextResponse.json({
    configured,
    connected: false,
    message: configured
      ? "WHOOP credentials are configured. OAuth connection is the next step."
      : "Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET in Vercel before enabling WHOOP.",
  });
}
