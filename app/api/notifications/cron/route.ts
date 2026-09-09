import { NextRequest,NextResponse } from "next/server";
import { getActivity,getNotificationProfile,markNotificationSent,notificationStoreReady,wasNotificationSent } from "@/lib/notification-store";
import { getAppUrl,telegramApi } from "@/lib/telegram-bot";

function panamaDate(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Panama",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}

export async function GET(request:NextRequest){
  const cronSecret=process.env.CRON_SECRET;
  if(cronSecret&&request.headers.get("authorization")!==`Bearer ${cronSecret}`) return NextResponse.json({ok:false},{status:401});
  if(!notificationStoreReady()) return NextResponse.json({ok:true,skipped:"notification_store_not_configured"});

  const [profile,activity]=await Promise.all([getNotificationProfile(),getActivity()]);
  if(!profile?.chatId) return NextResponse.json({ok:true,skipped:"telegram_chat_not_registered"});
  const today=panamaDate();
  const key=`${today}:evening-check`;
  if(await wasNotificationSent(key)) return NextResponse.json({ok:true,skipped:"already_sent"});

  const mealCount=activity?.date===today?activity.mealCount:0;
  let text="";
  if(mealCount===0){
    text=`${profile.firstName?`${profile.firstName}, `:""}veo que hoy todavía no has registrado comidas en NOURA. No tiene que ser perfecto: registra lo que recuerdes y seguimos desde ahí.`;
  }else if(mealCount<2){
    text=`Hoy solo veo ${mealCount} registro${mealCount===1?"":"s"} de comida. Si te falta algo, agrégalo ahora para que tus recomendaciones de mañana tengan mejor contexto.`;
  }
  if(!text) return NextResponse.json({ok:true,skipped:"enough_data"});

  await telegramApi("sendMessage",{chat_id:profile.chatId,text,reply_markup:{inline_keyboard:[[{text:"Registrar ahora",web_app:{url:`${getAppUrl()}/assistant`}}],[{text:"Ver mi día",web_app:{url:getAppUrl()}}]]}});
  await markNotificationSent(key);
  return NextResponse.json({ok:true,sent:true,mealCount});
}
