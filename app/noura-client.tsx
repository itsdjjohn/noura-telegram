"use client";

import { useEffect,useState } from "react";
import { createInstallLink, hasDeviceSession } from "@/lib/noura-data";

type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

export default function NouraClient(){
  const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
  const [showInstall,setShowInstall]=useState(false);
  const [iosHelp,setIosHelp]=useState(false);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
    const standalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
    if(standalone)return;
    const handler=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPromptEvent);setShowInstall(true)};
    window.addEventListener("beforeinstallprompt",handler);
    const inTelegram=Boolean(window.Telegram?.WebApp?.initData);
    if(inTelegram||hasDeviceSession())setShowInstall(true);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  async function install(){
    if(busy)return;
    setBusy(true);
    try{
      const inTelegram=Boolean(window.Telegram?.WebApp?.initData);
      if(inTelegram){
        const url=await createInstallLink();
        window.Telegram?.WebApp?.openLink?.(url);
        return;
      }
      if(prompt){await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==="accepted")setShowInstall(false);return;}
      const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
      if(isiOS){setIosHelp(true);return;}
      setIosHelp(true);
    }catch{setIosHelp(true)}finally{setBusy(false)}
  }

  if(!showInstall)return null;
  return <><button onClick={install} aria-label="Instalar NOURA" style={{position:"fixed",right:16,bottom:94,zIndex:60,border:"1px solid rgba(255,255,255,.12)",background:"rgba(12,15,17,.92)",backdropFilter:"blur(16px)",color:"#fff",padding:"11px 15px",borderRadius:16,fontSize:11,fontWeight:850,boxShadow:"0 14px 40px rgba(0,0,0,.28)"}}>{busy?"Preparando…":"＋ Instalar NOURA"}</button>{iosHelp&&<div onClick={()=>setIosHelp(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.72)",display:"grid",placeItems:"end center",padding:16}}><div onClick={e=>e.stopPropagation()} style={{width:"min(100%,520px)",background:"#111518",border:"1px solid rgba(255,255,255,.1)",borderRadius:26,padding:22,color:"#fff",boxShadow:"0 24px 80px rgba(0,0,0,.5)"}}><div style={{fontSize:10,letterSpacing:1.5,opacity:.55}}>INSTALAR NOURA</div><h2 style={{margin:"8px 0"}}>Añádela a tu pantalla de inicio.</h2><p style={{opacity:.72,fontSize:13,lineHeight:1.55}}>En iPhone: abre esta página en Safari, toca Compartir y elige “Añadir a pantalla de inicio”. En Android: abre el menú del navegador y toca “Instalar app” o “Añadir a pantalla principal”.</p><button onClick={()=>setIosHelp(false)} style={{width:"100%",border:0,borderRadius:14,padding:13,fontWeight:800}}>Entendido</button></div></div>}</>;
}
