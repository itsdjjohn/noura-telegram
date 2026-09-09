"use client";

import { useEffect } from "react";

const STORAGE_KEY="noura-beta-v01";
function localDateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Panama",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}

export default function NouraClient(){
  useEffect(()=>{
    let timer:number|undefined;
    const sync=()=>{
      try{
        const raw=localStorage.getItem(STORAGE_KEY);
        if(!raw)return;
        const store=JSON.parse(raw);
        const today=localDateKey();
        const mealCount=Array.isArray(store?.meals)?store.meals.filter((m:{date?:string})=>m?.date===today).length:0;
        fetch("/api/notifications/activity",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:today,mealCount}),keepalive:true}).catch(()=>{});
      }catch{}
    };
    sync();
    timer=window.setInterval(sync,5*60*1000);
    window.addEventListener("focus",sync);
    window.addEventListener("storage",sync);
    return()=>{if(timer)window.clearInterval(timer);window.removeEventListener("focus",sync);window.removeEventListener("storage",sync)};
  },[]);
  return null;
}
