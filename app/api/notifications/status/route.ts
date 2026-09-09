import { NextResponse } from "next/server";
import { getNotificationProfile,notificationStoreReady } from "@/lib/notification-store";

export async function GET(){
  const storeReady=notificationStoreReady();
  const profile=storeReady?await getNotificationProfile():null;
  return NextResponse.json({ok:true,storeReady,telegramRegistered:Boolean(profile?.chatId),firstName:profile?.firstName||null});
}
