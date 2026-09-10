"use client";

export type Goal = "healthy" | "lose" | "maintain" | "gain" | "performance";
export type Profile = { name:string; age:number; height:number; weight:number; activity:"low"|"medium"|"high"; goal:Goal; calories:number; protein:number; carbs:number; fat:number; };
export type Meal = { id:string; date:string; title:string; items:string; calories:number; protein:number; carbs:number; fat:number; };
export type NouraState = { onboarded:boolean; profile:Profile; meals:Meal[]; water:Record<string,number>; waterTarget?:number };

const URL="https://ydggnanoofeureprmaqn.supabase.co/functions/v1/noura-data";
const KEY="sb_publishable_JIKFJwzOPagmpIFsy1094g_2R3kBKUJ";
const DEVICE_KEY="noura-device-token";
const LEGACY_KEY="noura-beta-v01";

declare global { interface Window { Telegram?: { WebApp?: { initData?:string; initDataUnsafe?:{user?:{first_name?:string}}; ready?:()=>void; expand?:()=>void; openLink?:(url:string)=>void } } } }

function deviceToken(){try{return localStorage.getItem(DEVICE_KEY)||""}catch{return""}}
function setDeviceToken(token:string){try{localStorage.setItem(DEVICE_KEY,token)}catch{}}
function legacyStore(){try{const raw=localStorage.getItem(LEGACY_KEY);return raw?JSON.parse(raw):null}catch{return null}}
function clearLegacy(){try{localStorage.removeItem(LEGACY_KEY)}catch{}}

async function call(action:string,body:Record<string,unknown>={},token=deviceToken()){
  const initData=typeof window!=="undefined"?window.Telegram?.WebApp?.initData||"":"";
  const r=await fetch(URL,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{ }),...(initData?{"x-telegram-init-data":initData}:{})},body:JSON.stringify({action,...body}),cache:"no-store"});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data?.error||`NOURA data ${r.status}`);
  return data;
}

export async function bootstrapNoura():Promise<NouraState>{
  const token=deviceToken();
  if(token){try{const r=await call("state",{},token);return r.state as NouraState}catch{}}
  const initData=window.Telegram?.WebApp?.initData||"";
  if(!initData)throw new Error("auth_required");
  const legacy=legacyStore();
  const r=await call("bootstrap",{initData,legacyStore:legacy},"");
  if(r.token)setDeviceToken(r.token);
  if(r.migrated)clearLegacy();
  return r.state as NouraState;
}

export async function saveProfile(profile:Profile,onboarded=true){const r=await call("profile",{profile,onboarded});return r.state as NouraState}
export async function addMeal(meal:Omit<Meal,"id">&{clientId?:string;source?:string}){const r=await call("meal",{meal});return r.state as NouraState}
export async function deleteMeal(id:string){const r=await call("delete_meal",{id});return r.state as NouraState}
export async function addWater(ml:number){const r=await call("water",{ml,clientId:crypto.randomUUID()});return r.state as NouraState}
export async function resetNoura(){const r=await call("reset");return r.state as NouraState}
export async function createInstallLink(){const r=await call("install_code");return String(r.url)}
export async function exchangeInstallCode(code:string){const r=await call("exchange_install_code",{code},"");if(r.token)setDeviceToken(r.token);return r.state as NouraState}
export function hasDeviceSession(){return Boolean(deviceToken())}
