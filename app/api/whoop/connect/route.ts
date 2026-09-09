import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getWhoopAuthorizeUrl } from "@/lib/whoop";

export async function GET() {
  try {
    const state = crypto.randomBytes(6).toString("hex").slice(0, 8);
    const response = NextResponse.redirect(getWhoopAuthorizeUrl(state));
    response.cookies.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "WHOOP configuration error" }, { status: 503 });
  }
}
