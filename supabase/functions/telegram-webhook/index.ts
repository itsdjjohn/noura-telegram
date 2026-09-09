import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number; first_name?: string; username?: string };
  };
};

const NOURA_WEBHOOK_URL = "https://noura-telegram.vercel.app/api/telegram/webhook";

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    return Response.json({ ok: true, service: "noura-supabase-telegram-webhook", version: "1.1" });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const telegramSecret = req.headers.get("x-telegram-bot-api-secret-token") || "";

  const upstream = await fetch(NOURA_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(telegramSecret ? { "x-telegram-bot-api-secret-token": telegramSecret } : {}),
    },
    body: rawBody,
  });

  const upstreamBody = await upstream.text();

  if (!upstream.ok) {
    console.error("NOURA upstream webhook rejected update", upstream.status, upstreamBody.slice(0, 400));
    return new Response(upstreamBody || "Webhook rejected", {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "text/plain" },
    });
  }

  try {
    const update = JSON.parse(rawBody) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const telegramUserId = update.message?.from?.id;

    if (chatId) {
      const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!secretKey) throw new Error("Supabase secret key unavailable in Edge Function");

      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: user, error } = await supabase
        .from("noura_users")
        .upsert(
          {
            telegram_chat_id: chatId,
            telegram_user_id: telegramUserId ?? null,
            first_name: update.message?.from?.first_name ?? null,
            username: update.message?.from?.username ?? null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "telegram_chat_id" },
        )
        .select("id")
        .single();

      if (error) throw error;

      if (user?.id) {
        const { error: prefsError } = await supabase
          .from("noura_notification_preferences")
          .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
        if (prefsError) throw prefsError;
      }
    }
  } catch (error) {
    console.error("NOURA Supabase Telegram sync failed", error);
  }

  return new Response(upstreamBody, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
});
