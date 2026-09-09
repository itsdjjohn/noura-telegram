type NotificationProfile={chatId:number;firstName?:string;updatedAt:string};
type ActivityState={date:string;mealCount:number;hasNutrition:boolean;lastSeen:string};

const url=()=>process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||"";
const token=()=>process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||"";

async function command(parts:(string|number)[]){
  if(!url()||!token()) return null;
  const r=await fetch(url(),{method:"POST",headers:{Authorization:`Bearer ${token()}`,"Content-Type":"application/json"},body:JSON.stringify(parts),cache:"no-store"});
  if(!r.ok) throw new Error(`Notification store ${r.status}`);
  const body=await r.json();
  return body?.result ?? null;
}

export function notificationStoreReady(){return Boolean(url()&&token());}
export async function saveNotificationProfile(profile:NotificationProfile){await command(["SET","noura:telegram:profile",JSON.stringify(profile)]);}
export async function getNotificationProfile():Promise<NotificationProfile|null>{const raw=await command(["GET","noura:telegram:profile"]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
export async function saveActivity(state:ActivityState){await command(["SET","noura:activity",JSON.stringify(state)]);}
export async function getActivity():Promise<ActivityState|null>{const raw=await command(["GET","noura:activity"]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
export async function wasNotificationSent(key:string){return Boolean(await command(["GET",`noura:notification:${key}`]));}
export async function markNotificationSent(key:string){await command(["SET",`noura:notification:${key}`,"1","EX",172800]);}
