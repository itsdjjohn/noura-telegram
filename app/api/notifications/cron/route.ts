import { NextRequest, NextResponse } from "next/server";
import { generateNouraText } from "@/lib/noura-ai";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";

const SUPABASE_URL = "https://ydggnanoofeureprmaqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JIKFJwzOPagmpIFsy1094g_2R3kBKUJ";
const WORKER_TOKEN_HASH = "12eb6267f198a42b1a3af5e544845d59f996c7a526d057989495b18a4f8507bf";

type Job = {
  delivery_id: string;
  user_id: string;
  telegram_chat_id: number;
  first_name?: string | null;
  notification_type: "breakfast" | "recovery" | "hydration" | "protein" | "night_summary";
  local_date: string;
  context: Record<string, any>;
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || payload?.hint || `Supabase ${response.status}`);
  return payload as T;
}

function skipReason(job: Job) {
  const today = job.context?.today || {};
  const targets = job.context?.targets || {};
  const whoop = job.context?.whoop || {};
  if (job.notification_type === "breakfast" && Number(today.mealCount || 0) > 0) return "breakfast_already_logged";
  if (job.notification_type === "hydration" && Number(today.water || 0) >= Number(targets.water || 2500) * 0.7) return "hydration_on_track";
  if (job.notification_type === "protein" && Number(today.protein || 0) >= Number(targets.protein || 150) * 0.85) return "protein_on_track";
  if (job.notification_type === "recovery" && whoop.recovery == null && whoop.sleepPerformance == null) return "whoop_context_missing";
  return null;
}

function fallback(job: Job) {
  const name = job.first_name ? `${job.first_name}, ` : "";
  const today = job.context?.today || {};
  const targets = job.context?.targets || {};
  const whoop = job.context?.whoop || {};
  const remainingProtein = Math.max(0, Number(targets.protein || 150) - Number(today.protein || 0));
  const remainingWater = Math.max(0, Number(targets.water || 2500) - Number(today.water || 0));

  switch (job.notification_type) {
    case "breakfast":
      return `${name}todavía no veo una comida registrada hoy. Registra lo que hayas comido y NOURA ajusta el resto del día con datos reales.`;
    case "recovery":
      return whoop.recovery != null
        ? `${name}tu Recovery está en ${Math.round(Number(whoop.recovery))}%. Úsalo como contexto: prioriza hidratación, comida suficiente y una carga de entrenamiento acorde a cómo te sientes.`
        : `${name}ya tengo contexto de WHOOP para ayudarte a ajustar el día. Abre NOURA para revisar recuperación, sueño y nutrición juntos.`;
    case "hydration":
      return `${name}te faltan aproximadamente ${Math.round(remainingWater)} ml para tu objetivo de agua. Súmalo de forma progresiva durante la tarde.`;
    case "protein":
      return `${name}todavía te faltan cerca de ${Math.round(remainingProtein)} g de proteína. Tu próxima comida puede ser una buena oportunidad para acercarte al objetivo sin forzarlo.`;
    default:
      return `${name}cierre del día: ${Number(today.mealCount || 0)} comidas registradas, ${Math.round(Number(today.water || 0))} ml de agua y ${Math.round(Number(today.protein || 0))} g de proteína. Abre NOURA para ver el contexto completo.`;
  }
}

async function generateMessage(job: Job) {
  const prompt = `Eres NOURA, un coach de bienestar y nutrición cotidiana. Escribe UNA notificación push para Telegram en español, natural y breve (máximo 380 caracteres). Debe sonar personalizada, útil y premium, no robótica. Usa solamente los datos proporcionados. No diagnostiques, no recomiendes medicamentos y no hagas afirmaciones clínicas. No uses markdown. Máximo un emoji si realmente aporta. Tipo de notificación: ${job.notification_type}. Nombre: ${job.first_name || "usuario"}. Contexto: ${JSON.stringify(job.context)}.`;
  try {
    const generated = await generateNouraText(prompt, 180);
    if (!generated) return { text: fallback(job), source: "local" };
    return {
      text: generated.text.trim().replace(/^['\"]|['\"]$/g, "").slice(0, 480),
      source: `${generated.provider}:${generated.model}`,
    };
  } catch (error) {
    console.error("NOURA notification AI fallback", error);
    return { text: fallback(job), source: "local" };
  }
}

async function finish(token: string, job: Job, status: string, extra: { messageId?: number; error?: string; text?: string; source?: string } = {}) {
  await rpc<boolean>("noura_finish_notification", {
    p_worker_token: token,
    p_delivery_id: job.delivery_id,
    p_status: status,
    p_telegram_message_id: extra.messageId ?? null,
    p_error_message: extra.error ?? null,
    p_message_text: extra.text ?? null,
    p_ai_source: extra.source ?? null,
  });
}

async function run(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || await sha256(token) !== WORKER_TOKEN_HASH) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const jobs = await rpc<Job[]>("noura_claim_due_notifications", { p_worker_token: token });
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
      const reason = skipReason(job);
      if (reason) {
        await finish(token, job, "skipped", { error: reason, source: "rule" });
        skipped++;
        continue;
      }

      try {
        const generated = await generateMessage(job);
        const telegram = await telegramApi("sendMessage", {
          chat_id: job.telegram_chat_id,
          text: generated.text,
          reply_markup: {
            inline_keyboard: [
              [{ text: "Abrir NOURA", web_app: { url: getAppUrl() } }],
              [{ text: "Registrar comida", web_app: { url: `${getAppUrl()}/assistant` } }],
            ],
          },
        }) as any;
        await finish(token, job, "sent", { messageId: telegram?.result?.message_id, text: generated.text, source: generated.source });
        sent++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown notification error";
        await finish(token, job, "failed", { error: message.slice(0, 500) });
        failed++;
      }
    }

    return NextResponse.json({ ok: true, claimed: jobs.length, sent, skipped, failed });
  } catch (error) {
    console.error("NOURA notification worker failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return run(request); }
export async function POST(request: NextRequest) { return run(request); }
