"use client";

import { useEffect,useState } from "react";
import { createInstallLink, exchangeInstallCode } from "@/lib/noura-data";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        openLink?: (url:string)=>void;
      };
    };
  }
}

export default function InstallPage(){
 const [status,setStatus]=useState("Preparando NOURA para este dispositivo…");
 const [installUrl,setInstallUrl]=useState("");
 const [insideTelegram,setInsideTelegram]=useState(false);

 useEffect(()=>{(async()=>{
   const code=new URLSearchParams(window.location.search).get("code")||"";
   if(code){
     try{
       await exchangeInstallCode(code);
       setStatus("Dispositivo vinculado ✓ Ya puedes instalar NOURA en este navegador.");
     }catch{
       setStatus("Este enlace expiró o ya fue utilizado. Genera uno nuevo desde Telegram.");
     }
     return;
   }

   if(window.Telegram?.WebApp?.initData){
     setInsideTelegram(true);
     try{
       setStatus("Cuenta vinculada. Ahora abre NOURA fuera de Telegram para instalarla.");
       const url=await createInstallLink();
       setInstallUrl(url);
     }catch{
       setStatus("No pude preparar el enlace. Abre primero NOURA desde /start y vuelve a intentarlo.");
     }
     return;
   }

   setStatus("Abre esta opción desde el bot de NOURA en Telegram para vincular tu cuenta.");
 })()},[]);

 function openExternal(){
   if(!installUrl)return;
   if(window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(installUrl);
   else window.location.href=installUrl;
 }

 const isIOS=typeof navigator!=="undefined"&&/iPhone|iPad|iPod/i.test(navigator.userAgent);

 return <main className="onboarding onboarding-premium">
   <div className="onboarding-glow"/>
   <div className="logo-orb">N</div>
   <div className="kicker">NOURA / INSTALL</div>
   <h1>Instala NOURA en tu Home Screen.</h1>
   <p className="muted lead">{status}</p>

   {insideTelegram&&installUrl&&<button className="btn btn-primary btn-large" style={{marginTop:18,maxWidth:420}} onClick={openExternal}>Abrir en navegador →</button>}

   <div className="card-premium" style={{marginTop:20,maxWidth:560}}>
     <strong>{isIOS?"En iPhone":"Instalación"}</strong>
     {isIOS?<p className="muted">1. Toca <b>Abrir en navegador</b>.<br/>2. En Safari toca el botón <b>Compartir</b>.<br/>3. Desliza y elige <b>Añadir a pantalla de inicio</b>.<br/>4. Confirma con <b>Añadir</b>.<br/><br/><b>Importante:</b> esa opción no aparece en el menú Compartir de Telegram.</p>:<p className="muted">Abre NOURA en tu navegador y acepta “Instalar app” o usa el menú del navegador → “Añadir a pantalla de inicio”.</p>}
   </div>
 </main>;
}
