import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";

export async function POST(request: NextRequest) {
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_SETUP_SECRET is not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const webhookBody: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  };
  if (webhookSecret) webhookBody.secret_token = webhookSecret;

  await telegramApi("setWebhook", webhookBody);
  await telegramApi("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Abrir NOURA",
      web_app: { url: appUrl },
    },
  });
  await telegramApi("setMyCommands", {
    commands: [
      { command: "start", description: "Abrir NOURA" },
      { command: "app", description: "Abrir la Mini App" },
    ],
  });

  return NextResponse.json({ ok: true, appUrl, webhookUrl });
}
