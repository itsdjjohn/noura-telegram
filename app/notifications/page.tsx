"use client";

import { useEffect, useState } from "react";
import "./notifications.css";

type Status = {
  storeReady: boolean;
  telegramRegistered: boolean;
  aiReady?: boolean;
  backend?: string;
  usersEnabled?: number;
  lastSentAt?: string | null;
};

const reminders = [
  ["08:30", "Desayuno", "Solo te escribe si todavía no hay una comida registrada."],
  ["08:45", "Recovery", "Cruza WHOOP con sueño, recuperación y contexto del día."],
  ["14:00", "Hidratación", "Se omite automáticamente si ya vas bien con agua."],
  ["18:30", "Proteína", "Calcula cuánto falta y evita recordarte si ya estás cerca."],
  ["22:30", "Cierre del día", "Resumen corto con nutrición, agua y contexto de rendimiento."],
];

export default function NotificationsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/status", { cache: "no-store" });
      setStatus(await response.json());
    } catch {
      setStatus({ storeReady: false, telegramRegistered: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <main className="notify-shell">
      <div className="notify-wrap">
        <header className="notify-top">
          <a href="/" className="coach-brand"><span>N</span><b>NOURA NOTIFY</b></a>
          <a href="/profile" className="coach-back">Volver</a>
        </header>

        <section className="notify-hero">
          <div className="kicker">CONTEXT ENGINE</div>
          <h1>Recordatorios que entienden tu día.</h1>
          <p>El motor revisa tus datos cada pocos minutos, pero solo te interrumpe cuando hay algo útil que decir. NOURA cruza tus registros, objetivos y WHOOP antes de decidir si envía una notificación.</p>
        </section>

        <section className="notify-card">
          <div className="notify-grid">
            <div className="notify-state"><span>Motor</span><strong>{loading ? "Revisando…" : status?.storeReady ? "Supabase · activo" : "Sin conexión"}</strong><i className={status?.storeReady ? "ok" : ""}/></div>
            <div className="notify-state"><span>Telegram</span><strong>{status?.telegramRegistered ? "Conectado" : "No registrado"}</strong><i className={status?.telegramRegistered ? "ok" : ""}/></div>
            <div className="notify-state"><span>Generación</span><strong>{status?.aiReady ? "IA contextual" : "Fallback inteligente"}</strong><i className={status?.aiReady ? "ok" : ""}/></div>
          </div>

          <div className="notify-schedule">
            {reminders.map(([time, title, detail]) => (
              <div className="notify-reminder" key={title}>
                <time>{time}</time>
                <div><strong>{title}</strong><span>{detail}</span></div>
              </div>
            ))}
          </div>

          <div className="notify-actions">
            <button onClick={() => void refresh()} disabled={loading}>{loading ? "Actualizando…" : "Actualizar estado"}</button>
            <a href="/">Abrir NOURA</a>
          </div>

          <small>Zona horaria: America/Panama · Horas silenciosas: 11:00 PM–7:00 AM · Cada tipo se envía como máximo una vez al día. Si tus datos ya van bien, NOURA omite el recordatorio.</small>
        </section>
      </div>
    </main>
  );
}
