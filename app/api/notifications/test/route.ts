import { NextResponse } from "next/server";
import { getNotificationProfile,notificationStoreReady } from "@/lib/notification-store";
import { getAppUrl,telegramApi } from "@/lib/telegram-bot";

export async function POST(){
  if(!notificationStoreReady())return NextResponse.json({ok:false,error:"notification_store_not_configured"},{status:503});
  const profile=await getNotificationProfile();
  if(!profile?.chatId)return NextResponse.json({ok:false,error:"telegram_not_registered"},{status:404});
  await telegramApi("sendMessage",{chat_id:profile.chatId,text:"NOURA notifications activas ✓\n\nTe avisaré cuando falten registros importantes para que tus recomendaciones tengan mejor contexto.",reply_markup:{inline_keyboard:[[{text:"Abrir NOURA",web_app:{url:getAppUrl()}}]]}});
  return NextResponse.json({ok:true});
}
