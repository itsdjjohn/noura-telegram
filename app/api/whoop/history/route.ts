import { NextRequest, NextResponse } from "next/server";
import { openToken, refreshWhoopToken, sealToken, whoopApi, type WhoopToken } from "@/lib/whoop";

type Collection<T> = { records?: T[] };
type RecoveryRecord = { created_at?: string; start?: string; score_state?: string; score?: { recovery_score?: number; resting_heart_rate?: number; hrv_rmssd_milli?: number } };
type SleepRecord = { start?: string; end?: string; nap?: boolean; score_state?: string; score?: { sleep_performance_percentage?: number; sleep_efficiency_percentage?: number; stage_summary?: { total_in_bed_time_milli?: number } } };
type CycleRecord = { start?: string; end?: string; score_state?: string; score?: { strain?: number; average_heart_rate?: number; max_heart_rate?: number } };

function dayKey(value?: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch { return null; }
}

async function usableToken(request: NextRequest) {
  const raw = request.cookies.get("whoop_session")?.value;
  if (!raw) return null;
  let token: WhoopToken = openToken(raw);
  let refreshed = false;
  if (Date.now() > token.expires_at - 60_000) { token = await refreshWhoopToken(token); refreshed = true; }
  return { token, refreshed };
}

export async function GET(request: NextRequest) {
  try {
    const session = await usableToken(request);
    if (!session) return NextResponse.json({ connected: false, days: [] }, { status: 401 });

    const requested = Number(request.nextUrl.searchParams.get("days") || 30);
    const days = Math.min(30, Math.max(7, Number.isFinite(requested) ? requested : 30));
    const limit = Math.min(100, Math.max(30, days * 2));
    const access = session.token.access_token;

    const [recoveries, sleeps, cycles] = await Promise.all([
      whoopApi<Collection<RecoveryRecord>>(`/recovery?limit=${limit}`, access),
      whoopApi<Collection<SleepRecord>>(`/activity/sleep?limit=${limit}`, access),
      whoopApi<Collection<CycleRecord>>(`/cycle?limit=${limit}`, access),
    ]);

    const map = new Map<string, { date: string; recovery?: number; hrv?: number; rhr?: number; sleep?: number; sleepHours?: number; strain?: number }>();
    const ensure = (date: string) => { if (!map.has(date)) map.set(date, { date }); return map.get(date)!; };

    for (const r of recoveries.records || []) {
      if (r.score_state !== "SCORED") continue;
      const date = dayKey(r.start || r.created_at); if (!date) continue;
      const d = ensure(date); d.recovery = r.score?.recovery_score; d.hrv = r.score?.hrv_rmssd_milli; d.rhr = r.score?.resting_heart_rate;
    }
    for (const s of sleeps.records || []) {
      if (s.nap || s.score_state !== "SCORED") continue;
      const date = dayKey(s.end || s.start); if (!date) continue;
      const d = ensure(date); d.sleep = s.score?.sleep_performance_percentage;
      const ms = s.score?.stage_summary?.total_in_bed_time_milli; if (ms) d.sleepHours = Math.round((ms / 3600000) * 10) / 10;
    }
    for (const c of cycles.records || []) {
      if (c.score_state !== "SCORED") continue;
      const date = dayKey(c.start || c.end); if (!date) continue;
      const d = ensure(date); d.strain = c.score?.strain;
    }

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (days - 1));
    const result = Array.from(map.values()).filter(d => new Date(`${d.date}T12:00:00-05:00`) >= cutoff).sort((a,b) => a.date.localeCompare(b.date));

    const response = NextResponse.json({ connected: true, days: result, updatedAt: new Date().toISOString() });
    if (session.refreshed) response.cookies.set("whoop_session", sealToken(session.token), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ connected: false, days: [], error: error instanceof Error ? error.message : "WHOOP history failed" }, { status: 500 });
  }
}
