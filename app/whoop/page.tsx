"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    end?: string;
    score?: { strain?: number; average_heart_rate?: number; max_heart_rate?: number; kilojoule?: number };
  }>;
  updatedAt?: string;
  error?: string;
};

function hours(ms?: number) {
  if (!ms) return "—";
  const totalMinutes = Math.round(ms / 60000);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function shortHours(ms?: number) {
  if (!ms) return "—";
  return `${(ms / 3600000).toFixed(1)}h`;
}

function friendlyOAuthError(value: string | null) {
  if (!value) return null;
  if (value === "oauth_state") return "La validación segura de WHOOP expiró. Intenta conectar nuevamente desde este mismo navegador.";
  if (/redirect/i.test(value)) return `WHOOP rechazó la Redirect URI: ${value}`;
  if (/client/i.test(value) || /credential/i.test(value)) return `WHOOP rechazó las credenciales de la aplicación: ${value}`;
  return `No se pudo completar la conexión con WHOOP: ${value}`;
}

function recoveryLabel(score?: number) {
  if (score == null) return "Sin score";
  if (score >= 67) return "Listo para rendir";
  if (score >= 34) return "Día moderado";
  return "Prioriza recuperación";
}

function recoveryClass(score?: number) {
  if (score == null) return "neutral";
  if (score >= 67) return "high";
  if (score >= 34) return "mid";
  return "low";
}

function insight(score?: number, sleep?: number, strain?: number) {
  if (score == null) return "WHOOP todavía está procesando tus datos. Vuelve a actualizar en unos minutos.";
  if (score < 34) return "Recovery bajo: mantén la hidratación alta, evita un déficit agresivo y prioriza proteína y carbohidratos fáciles de digerir.";
  if ((strain ?? 0) >= 14) return "Tu Strain está alto. Hoy conviene reponer energía y no quedarte corto con carbohidratos ni proteína.";
  if ((sleep ?? 100) < 70) return "Dormiste por debajo de lo ideal. Mantén el día simple: hidratación, proteína consistente y evita compensar con restricciones extremas.";
  if (score >= 67) return "Tu cuerpo está respondiendo bien. Es un buen día para entrenar, cumplir tus macros y aprovechar la recuperación disponible.";
  return "Tu estado es estable. Mantén una alimentación consistente, hidrátate y ajusta la intensidad según cómo te sientas.";
}

function WhoopContent() {
  const searchParams = useSearchParams();
  const callbackError = friendlyOAuthError(searchParams.get("error"));
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(manual = false) {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const response = await fetch("/api/whoop/summary", { cache: "no-store" });
      const body = await response.json();
      setData(body);
    } catch {
      setData({ connected: false, error: "No se pudo cargar WHOOP." });
    } finally {
      if (manual) setRefreshing(false); else setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function disconnect() {
    await fetch("/api/whoop/disconnect", { method: "POST" });
    setData({ connected: false });
  }

  const sleepBreakdown = useMemo(() => {
    const s = data?.sleep?.stage_summary;
    return [
      { name: "Light", value: s?.total_light_sleep_time_milli },
      { name: "Deep", value: s?.total_slow_wave_sleep_time_milli },
      { name: "REM", value: s?.total_rem_sleep_time_milli },
      { name: "Awake", value: s?.total_awake_time_milli },
    ];
  }, [data]);

  if (loading) {
    return <main className="whoop-shell"><div className="whoop-loading"><div className="logo-orb motion-pop">N</div><div className="pulse-line"/><p>Sincronizando tus señales de WHOOP…</p></div></main>;
  }

  if (!data?.connected) {
    return (
      <main className="whoop-shell whoop-connect-screen">
        <div className="whoop-connect-glow"/>
        <a href="/" className="whoop-back">← NOURA</a>
        <section className="whoop-connect-card motion-rise">
          <div className="whoop-connect-icon">W</div>
          <div className="kicker">WHOOP × NOURA</div>
          <h1>Convierte recuperación en decisiones útiles.</h1>
          <p>NOURA usa Recovery, Sleep, HRV, RHR, Strain y Workouts para añadir contexto a tu nutrición diaria.</p>
          {callbackError && <div className="whoop-error"><strong>Error de conexión</strong><span>{callbackError}</span></div>}
          {!callbackError && data?.error && <div className="whoop-error"><strong>No se pudo sincronizar</strong><span>{data.error}</span></div>}
          <a className="btn btn-primary btn-large whoop-connect-button" href="/api/whoop/connect">Conectar WHOOP <span>→</span></a>
          <small>OAuth seguro · tus credenciales nunca se guardan en el navegador.</small>
        </section>
      </main>
    );
  }

  const recovery = data.recovery;
  const sleep = data.sleep;
  const cycle = data.cycle;
  const score = recovery?.recovery_score;
  const sleepScore = sleep?.sleep_performance_percentage;
  const strain = cycle?.strain;

  return (
    <main className="app-shell premium-shell whoop-dashboard">
      <header className="topbar premium-topbar motion-fade">
        <a href="/" className="brand"><div className="brand-mark">N</div><div><strong>NOURA</strong><small>WHOOP intelligence</small></div></a>
        <div className="topbar-actions"><span className="sync-dot online"/><button className={`whoop-refresh ${refreshing ? "spinning" : ""}`} onClick={() => load(true)} aria-label="Actualizar WHOOP">↻</button></div>
      </header>

      <section className="whoop-hero motion-rise">
        <div className="whoop-hero-copy">
          <div className="kicker">RECOVERY TODAY</div>
          <h1>{recoveryLabel(score)}</h1>
          <p>{insight(score, sleepScore, strain)}</p>
          <div className="whoop-mini-meta"><span>WHOOP conectado</span>{data.updatedAt && <span>Actualizado {new Date(data.updatedAt).toLocaleTimeString("es-PA", { hour: "numeric", minute: "2-digit" })}</span>}</div>
        </div>
        <div className={`recovery-orbit ${recoveryClass(score)}`} style={{"--recovery": score ?? 0} as React.CSSProperties}>
          <div className="recovery-orbit-inner"><strong>{score != null ? Math.round(score) : "—"}</strong><span>%</span><small>Recovery</small></div>
        </div>
      </section>

      <section className="whoop-vitals motion-stagger">
        <article className="whoop-vital"><span>HRV</span><strong>{recovery?.hrv_rmssd_milli ? Math.round(recovery.hrv_rmssd_milli) : "—"}</strong><small>ms</small><i>Variabilidad</i></article>
        <article className="whoop-vital"><span>RHR</span><strong>{recovery?.resting_heart_rate ?? "—"}</strong><small>bpm</small><i>Reposo</i></article>
        <article className="whoop-vital"><span>SpO₂</span><strong>{recovery?.spo2_percentage ? recovery.spo2_percentage.toFixed(1) : "—"}</strong><small>%</small><i>Oxígeno</i></article>
        <article className="whoop-vital"><span>Strain</span><strong>{strain?.toFixed?.(1) ?? strain ?? "—"}</strong><small>/ 21</small><i>Carga diaria</i></article>
      </section>

      <section className="section-section motion-rise delay-1">
        <div className="section-title"><div><span className="kicker">SLEEP</span><h2>Cómo dormiste</h2></div><span className="whoop-section-score">{sleepScore != null ? `${Math.round(sleepScore)}%` : "—"}</span></div>
        <div className="whoop-sleep-card">
          <div className="sleep-summary">
            <div><span>En cama</span><strong>{hours(sleep?.stage_summary?.total_in_bed_time_milli)}</strong></div>
            <div><span>Eficiencia</span><strong>{sleep?.sleep_efficiency_percentage ? `${Math.round(sleep.sleep_efficiency_percentage)}%` : "—"}</strong></div>
            <div><span>Consistencia</span><strong>{sleep?.sleep_consistency_percentage != null ? `${Math.round(sleep.sleep_consistency_percentage)}%` : "—"}</strong></div>
            <div><span>Respiración</span><strong>{sleep?.respiratory_rate ? sleep.respiratory_rate.toFixed(1) : "—"}<small> rpm</small></strong></div>
          </div>
          <div className="sleep-stages">
            {sleepBreakdown.map((stage, index) => <div className="sleep-stage" key={stage.name}><div className="stage-label"><span><i className={`stage-dot stage-${index}`}/>{stage.name}</span><strong>{shortHours(stage.value)}</strong></div><div className="stage-track"><span className={`stage-fill stage-${index}`} style={{width: stage.value && sleep?.stage_summary?.total_in_bed_time_milli ? `${Math.min(100, stage.value / sleep.stage_summary.total_in_bed_time_milli * 100)}%` : "0%"}}/></div></div>)}
          </div>
        </div>
      </section>

      <section className="section-section motion-rise delay-2">
        <div className="section-title"><div><span className="kicker">STRAIN</span><h2>Carga de hoy</h2></div></div>
        <div className="strain-card">
          <div className="strain-number"><strong>{strain?.toFixed?.(1) ?? strain ?? "—"}</strong><span>/21</span></div>
          <div className="strain-copy"><strong>{(strain ?? 0) >= 14 ? "Día exigente" : (strain ?? 0) >= 8 ? "Carga moderada" : "Carga ligera"}</strong><p>Promedio HR {cycle?.average_heart_rate ?? "—"} bpm · Máx {cycle?.max_heart_rate ?? "—"} bpm</p></div>
          <div className="strain-meter"><span style={{width:`${Math.min(100, ((strain ?? 0) / 21) * 100)}%`}}/></div>
        </div>
      </section>

      <section className="section-section motion-rise delay-3">
        <div className="section-title"><div><span className="kicker">ACTIVITY</span><h2>Últimos workouts</h2></div><span className="status-chip">{data.workouts?.length ?? 0} recientes</span></div>
        <div className="whoop-workouts">
          {(data.workouts || []).slice(0, 5).map((w, i) => <article className="whoop-workout" key={`${w.start}-${i}`}><div className="workout-index">{String(i + 1).padStart(2, "0")}</div><div className="workout-main"><strong>{w.sport_name || "Workout"}</strong><span>{w.start ? new Date(w.start).toLocaleDateString("es-PA", { weekday: "short", day: "numeric", month: "short" }) : ""}</span></div><div className="workout-metrics"><div><strong>{w.score?.strain?.toFixed?.(1) ?? w.score?.strain ?? "—"}</strong><span>strain</span></div><div><strong>{w.score?.average_heart_rate ?? "—"}</strong><span>avg HR</span></div></div></article>)}
          {!data.workouts?.length && <div className="empty-premium"><strong>Sin workouts recientes</strong><small>WHOOP los mostrará aquí cuando estén disponibles.</small></div>}
        </div>
      </section>

      <section className="whoop-action-card motion-rise delay-4">
        <div><span className="kicker">NOURA CONTEXT</span><h3>Usar estos datos en tu nutrición</h3><p>Vuelve al Home para ver cómo Recovery, Sleep y Strain cambian la recomendación de tu día.</p></div><a href="/">Ver mi día →</a>
      </section>

      <div className="whoop-settings-row"><button className="btn btn-secondary" onClick={() => load(true)}>{refreshing ? "Actualizando…" : "Actualizar datos"}</button><button className="btn btn-danger" onClick={disconnect}>Desconectar WHOOP</button></div>
    </main>
  );
}

export default function WhoopPage() {
  return <Suspense fallback={<main className="whoop-shell"><div className="whoop-loading"><div className="logo-orb">N</div><p>Cargando WHOOP…</p></div></main>}><WhoopContent /></Suspense>;
}
