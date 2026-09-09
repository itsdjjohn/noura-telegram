import { NextResponse } from "next/server";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";

export const dynamic = "force-dynamic";

const WEBHOOK_URL =
  process.env.SUPABASE_TELEGRAM_WEBHOOK_URL ||
  "https://ydggnanoofeureprmaqn.supabase.co/functions/v1/telegram-webhook";

export async function POST() {
  try {
    const appUrl = getAppUrl();
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const webhookBody: Record<string, unknown> = {
      url: WEBHOOK_URL,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    };
    if (webhookSecret) webhookBody.secret_token = webhookSecret;

    const webhook = await telegramApi("setWebhook", webhookBody);
    const menu = await telegramApi("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Abrir NOURA", web_app: { url: appUrl } },
    });
    const commands = await telegramApi("setMyCommands", {
      commands: [
        { command: "start", description: "Abrir NOURA" },
        { command: "today", description: "Ver tu resumen de hoy" },
        { command: "coach", description: "Abrir recomendaciones de NOURA Coach" },
        { command: "log", description: "Registrar comida con Smart Log" },
        { command: "water", description: "Registrar hidratación" },
        { command: "whoop", description: "Ver WHOOP × NOURA" },
        { command: "app", description: "Abrir la Mini App" },
      ],
    });

    return NextResponse.json({ ok: true, webhookUrl: WEBHOOK_URL, telegram: { webhook, menu, commands } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
