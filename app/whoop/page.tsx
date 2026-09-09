"use client";

import { useEffect, useState } from "react";

type Summary = {
  connected: boolean;
  recovery?: {
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  } | null;
  sleep?: {
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
  } | null;
  cycle?: {
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
  } | null;
  workouts?: Array<{
    sport_name?: string;
    start?: string;
    score?: { strain?: number; average_heart_rate?: number; max_heart_rate?: number };
  }>;
  profile?: Record<string, unknown>;
  body?: Record<string, unknown>;
  error?: string;
};

function hours(ms?: number) {
  if (!ms) return "—";
  const totalMinutes = Math.round(ms / 60000);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export default function WhoopPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/whoop/summary", { cache: "no-store" });
      const body = await response.json();
      setData(body);
    } catch {
      setData({ connected: false, error: "No se pudo cargar WHOOP." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function disconnect() {
    await fetch("/api/whoop/disconnect", { method: "POST" });
    setData({ connected: false });
  }

  if (loading) {
    return <main className="onboarding"><div className="logo-big">N</div><p className="muted">Cargando WHOOP…</p></main>;
  }

  if (!data?.connected) {
    return (
      <main className="onboarding">
        <div className="logo-big">N</div>
        <div className="kicker">WHOOP × NOURA</div>
        <h1>Conecta tu recuperación con tu nutrición.</h1>
        <p className="muted">NOURA leerá Recovery, Sleep, Strain y Workouts para adaptar tus recomendaciones. La conexión usa OAuth oficial de WHOOP.</p>
        {data?.error && <div className="notice">{data.error}</div>}
        <a className="btn btn-primary" href="/api/whoop/connect">Conectar WHOOP</a>
        <a className="btn" href="/">Volver a NOURA</a>
      </main>
    );
  }

  const recovery = data.recovery;
  const sleep = data.sleep;
  const cycle = data.cycle;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">N</div>NOURA</div>
        <a className="pill" href="/">Volver</a>
      </header>

      <section className="hero">
        <div className="eyebrow">WHOOP CONECTADO</div>
        <h1>{recovery?.recovery_score ?? "—"}% Recovery</h1>
        <p className="muted">Estos datos vienen directamente de tu cuenta WHOOP y se usan para contextualizar tus decisiones de nutrición.</p>
      </section>

      <section className="section macros">
        <div className="macro"><div className="eyebrow">HRV</div><div className="value">{recovery?.hrv_rmssd_milli ? Math.round(recovery.hrv_rmssd_milli) : "—"}</div><div className="row-sub">ms</div></div>
        <div className="macro"><div className="eyebrow">RHR</div><div className="value">{recovery?.resting_heart_rate ?? "—"}</div><div className="row-sub">bpm</div></div>
        <div className="macro"><div className="eyebrow">Strain</div><div className="value">{cycle?.strain?.toFixed?.(1) ?? cycle?.strain ?? "—"}</div><div className="row-sub">hoy</div></div>
      </section>

      <section className="section card">
        <div className="kicker">SUEÑO</div>
        <div className="grid-2">
          <div className="stat"><span className="muted">Performance</span><b>{sleep?.sleep_performance_percentage ?? "—"}%</b></div>
          <div className="stat"><span className="muted">Eficiencia</span><b>{sleep?.sleep_efficiency_percentage ? Math.round(sleep.sleep_efficiency_percentage) : "—"}%</b></div>
          <div className="stat"><span className="muted">En cama</span><b>{hours(sleep?.stage_summary?.total_in_bed_time_milli)}</b></div>
          <div className="stat"><span className="muted">Consistencia</span><b>{sleep?.sleep_consistency_percentage ?? "—"}%</b></div>
        </div>
      </section>

      <section className="section card">
        <div className="kicker">ÚLTIMOS WORKOUTS</div>
        <div className="list">
          {(data.workouts || []).slice(0, 3).map((w, i) => (
            <div className="row" key={`${w.start}-${i}`}>
              <div><div className="row-title">{w.sport_name || "Workout"}</div><div className="row-sub">{w.start ? new Date(w.start).toLocaleString("es-PA") : ""}</div></div>
              <div style={{textAlign:"right"}}><strong>Strain {w.score?.strain?.toFixed?.(1) ?? w.score?.strain ?? "—"}</strong><div className="row-sub">HR {w.score?.average_heart_rate ?? "—"}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section notice">
        <strong>Próximo paso de NOURA</strong><br />Usar Recovery, sueño y Strain junto con tus macros restantes para ajustar sugerencias de comidas y timing nutricional.
      </section>

      <div className="section" style={{display:"grid",gap:10}}>
        <button className="btn" onClick={load}>Actualizar datos</button>
        <button className="btn btn-danger" onClick={disconnect}>Desconectar WHOOP</button>
      </div>
    </main>
  );
}
