import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";

async function runSetup(request: NextRequest) {
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  if (!setupSecret) return NextResponse.json({ ok: false, error: "TELEGRAM_SETUP_SECRET is not configured" }, { status: 503 });

  const auth = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const authorized = auth === `Bearer ${setupSecret}` || querySecret === setupSecret;
  if (!authorized) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const appUrl = getAppUrl();
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const webhookBody: Record<string, unknown> = { url: webhookUrl, allowed_updates: ["message"], drop_pending_updates: true };
    if (webhookSecret) webhookBody.secret_token = webhookSecret;

    const webhook = await telegramApi("setWebhook", webhookBody);
    const menu = await telegramApi("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Abrir NOURA", web_app: { url: appUrl } },
    });
    const commands = await telegramApi("setMyCommands", {
      commands: [
        { command: "start", description: "Abrir NOURA" },
        { command: "today", description: "Ver tu resumen de hoy" },
        { command: "log", description: "Registrar comida con Smart Log" },
        { command: "water", description: "Registrar hidratación" },
        { command: "whoop", description: "Ver WHOOP × NOURA" },
        { command: "app", description: "Abrir la Mini App" },
      ],
    });

    return NextResponse.json({ ok: true, appUrl, webhookUrl, telegram: { webhook, menu, commands } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return runSetup(request); }
export async function POST(request: NextRequest) { return runSetup(request); }
