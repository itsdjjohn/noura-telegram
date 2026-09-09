import { NextResponse } from "next/server";

const SUPABASE_URL = "https://ydggnanoofeureprmaqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JIKFJwzOPagmpIFsy1094g_2R3kBKUJ";

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/noura_notification_status`, {
      method: "POST",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    const status = await response.json();
    if (!response.ok) throw new Error(status?.message || `Supabase ${response.status}`);
    return NextResponse.json({ ok: true, backend: "supabase", aiReady: Boolean(process.env.OPENAI_API_KEY), ...status });
  } catch (error) {
    console.error("NOURA notification status failed", error);
    return NextResponse.json({ ok: false, storeReady: false, telegramRegistered: false, aiReady: Boolean(process.env.OPENAI_API_KEY) }, { status: 500 });
  }
}
