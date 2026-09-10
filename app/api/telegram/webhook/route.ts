import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, telegramApi } from "@/lib/telegram-bot";
import { notificationStoreReady, saveNotificationProfile } from "@/lib/notification-store";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
    from?: { first_name?: string };
  };
};

function assistantUrl(text?: string) {
  const base = `${getAppUrl()}/assistant`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const received = request.headers.get("x-telegram-bot-api-secret-token");
    if (received !== expectedSecret) return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim() || "";
  if (!chatId) return NextResponse.json({ ok: true });

  if(notificationStoreReady()){
    try{await saveNotificationProfile({chatId,firstName:update.message?.from?.first_name,updatedAt:new Date().toISOString()});}catch(error){console.error("NOURA notification profile save failed",error);}
  }

  if (text.startsWith("/start")) {
    const firstName = update.message?.from?.first_name || "";
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `Hola${firstName ? `, ${firstName}` : ""} 👋\n\nNOURA ya sincroniza tu nutrición, hábitos y perfil en la nube. También puedes instalarla como app en tu pantalla de inicio.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Abrir NOURA", web_app: { url: getAppUrl() } }],
          [{ text: "＋ Instalar NOURA", web_app: { url: `${getAppUrl()}/install` } }],
          [{ text: "NOURA Coach", web_app: { url: `${getAppUrl()}/coach` } }],
          [{ text: "Registrar comida", web_app: { url: assistantUrl() } }],
          [{ text: "WHOOP × NOURA", web_app: { url: `${getAppUrl()}/whoop` } }],
        ],
      },
    });
  } else if (text === "/app" || text === "/today") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: text === "/today" ? "Abre tu resumen de hoy en NOURA:" : "Abre tu dashboard de NOURA:",
      reply_markup: { inline_keyboard: [[{ text: "Abrir dashboard", web_app: { url: getAppUrl() } }],[{ text: "Instalar NOURA", web_app: { url: `${getAppUrl()}/install` } }]] },
    });
  } else if (text === "/coach") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Abre NOURA Coach para recibir recomendaciones según tus datos de hoy y WHOOP:",
      reply_markup: { inline_keyboard: [[{ text: "Abrir NOURA Coach", web_app: { url: `${getAppUrl()}/coach` } }]] },
    });
  } else if (text === "/whoop") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Revisa Recovery, Sleep, HRV y Strain:",
      reply_markup: { inline_keyboard: [[{ text: "WHOOP × NOURA", web_app: { url: `${getAppUrl()}/whoop` } }]] },
    });
  } else if (text === "/log" || text === "/meal") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Escribe tu comida directamente aquí, o abre el Smart Log.",
      reply_markup: { inline_keyboard: [[{ text: "Abrir Smart Log", web_app: { url: assistantUrl() } }]] },
    });
  } else if (text === "/water") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Registra tu hidratación en NOURA. El dato se sincroniza con tu cuenta en Supabase.",
      reply_markup: { inline_keyboard: [[{ text: "Registrar agua", web_app: { url: getAppUrl() } }]] },
    });
  } else if (text.startsWith("/")) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "Comandos disponibles: /today, /coach, /log, /water, /whoop y /app.",
    });
  } else if (text.length >= 3) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `Entendí esto como una comida:\n\n“${text.slice(0, 220)}”\n\nAbre NOURA para estimar macros y confirmar el registro.`,
      reply_markup: { inline_keyboard: [[{ text: "Analizar comida →", web_app: { url: assistantUrl(text) } }]] },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "noura-telegram-webhook", version: "0.8" });
}
