import { NextRequest,NextResponse } from "next/server";
import { notificationStoreReady,saveActivity } from "@/lib/notification-store";

export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>({}));
  const date=typeof body?.date==="string"?body.date:"";
  const mealCount=Number.isFinite(Number(body?.mealCount))?Math.max(0,Math.min(20,Number(body.mealCount))):0;
  if(!date) return NextResponse.json({ok:false,error:"date_required"},{status:400});
  if(notificationStoreReady()) await saveActivity({date,mealCount,hasNutrition:mealCount>0,lastSeen:new Date().toISOString()});
  return NextResponse.json({ok:true,persisted:notificationStoreReady()});
}
