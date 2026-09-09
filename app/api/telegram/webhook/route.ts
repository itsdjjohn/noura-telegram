import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
    from?: { first_name?: string };
  };
};

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const received = request.headers.get("x-telegram-bot-api-secret-token");
    if (received !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim() || "";

  if (!chatId) return NextResponse.json({ ok: true });

  if (text.startsWith("/start")) {
    const firstName = update.message?.from?.first_name || "";
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `Hola${firstName ? `, ${firstName}` : ""} 👋\n\nBienvenido a NOURA. Lleva tus comidas, macros, agua y conecta WHOOP desde Telegram.`,
      reply_markup: {
        inline_keyboard: [[
          { text: "Abrir NOURA", web_app: { url: getAppUrl() } },
        ], [
          { text: "Conectar WHOOP", web_app: { url: `${getAppUrl()}/whoop` } },
        ]],
      },
    });
  } else if (text === "/app") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Abre tu dashboard de NOURA:",
      reply_markup: {
        inline_keyboard: [[{ text: "Abrir NOURA", web_app: { url: getAppUrl() } }]],
      },
    });
  } else if (text === "/whoop") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Conecta o revisa tus datos de WHOOP:",
      reply_markup: {
        inline_keyboard: [[{ text: "WHOOP × NOURA", web_app: { url: `${getAppUrl()}/whoop` } }]],
      },
    });
  } else {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Usa /app para abrir NOURA o /whoop para conectar y revisar WHOOP.",
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "noura-telegram-webhook" });
}
