import { NextRequest, NextResponse } from "next/server";
import { openToken, refreshWhoopToken, sealToken, whoopApi, type WhoopToken } from "@/lib/whoop";

type Collection<T> = { records?: T[] };

type Recovery = {
  score_state?: string;
  score?: {
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
};

type Sleep = {
  nap?: boolean;
  score_state?: string;
  score?: {
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_awake_time_milli?: number;
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
    };
  };
};

type Cycle = {
  score_state?: string;
  score?: {
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
  };
};

type Workout = {
  sport_name?: string;
  start?: string;
  end?: string;
  score_state?: string;
  score?: {
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    percent_recorded?: number;
  };
};

async function usableToken(request: NextRequest) {
  const raw = request.cookies.get("whoop_session")?.value;
  if (!raw) return null;
  let token: WhoopToken = openToken(raw);
  let refreshed = false;
  if (Date.now() > token.expires_at - 60_000) {
    token = await refreshWhoopToken(token);
    refreshed = true;
  }
  return { token, refreshed };
}

export async function GET(request: NextRequest) {
  try {
    const session = await usableToken(request);
    if (!session) return NextResponse.json({ connected: false }, { status: 401 });

    const access = session.token.access_token;
    const [recoveries, sleeps, cycles, workouts, profile, body] = await Promise.all([
      whoopApi<Collection<Recovery>>("/recovery?limit=1", access),
      whoopApi<Collection<Sleep>>("/activity/sleep?limit=3", access),
      whoopApi<Collection<Cycle>>("/cycle?limit=1", access),
      whoopApi<Collection<Workout>>("/activity/workout?limit=5", access),
      whoopApi<Record<string, unknown>>("/user/profile/basic", access),
      whoopApi<Record<string, unknown>>("/user/measurement/body", access),
    ]);

    const recovery = recoveries.records?.[0] || null;
    const sleep = sleeps.records?.find(s => !s.nap) || sleeps.records?.[0] || null;
    const cycle = cycles.records?.[0] || null;

    const response = NextResponse.json({
      connected: true,
      recovery: recovery?.score_state === "SCORED" ? recovery.score : null,
      sleep: sleep?.score_state === "SCORED" ? sleep.score : null,
      cycle: cycle?.score_state === "SCORED" ? cycle.score : null,
      workouts: workouts.records || [],
      profile,
      body,
      updatedAt: new Date().toISOString(),
    });

    if (session.refreshed) {
      response.cookies.set("whoop_session", sealToken(session.token), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ connected: false, error: error instanceof Error ? error.message : "WHOOP request failed" }, { status: 500 });
  }
}
