import { NextRequest, NextResponse } from "next/server";
import { exchangeWhoopCode, sealToken } from "@/lib/whoop";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("whoop_oauth_state")?.value;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!code || !state || !expected || state !== expected) {
    console.error("WHOOP OAuth callback rejected", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasExpectedState: Boolean(expected),
      stateMatches: Boolean(state && expected && state === expected),
    });
    return NextResponse.redirect(`${appUrl}/whoop?error=oauth_state`);
  }

  try {
    const token = await exchangeWhoopCode(code);
    const response = NextResponse.redirect(`${appUrl}/whoop?connected=1`);
    response.cookies.set("whoop_session", sealToken(token), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    response.cookies.delete("whoop_oauth_state");
    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "oauth_failed";
    console.error("WHOOP token exchange failed", { message: rawMessage });
    const message = encodeURIComponent(rawMessage);
    return NextResponse.redirect(`${appUrl}/whoop?error=${message}`);
  }
}
