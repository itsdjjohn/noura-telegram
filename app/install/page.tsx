"use client";

import { useEffect,useState } from "react";
import { createInstallLink, exchangeInstallCode } from "@/lib/noura-data";

type HomeScreenStatus="unsupported"|"unknown"|"added"|"missed";
type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      openLink?: (url:string)=>void;
      addToHomeScreen?: ()=>void;
      checkHomeScreenStatus?: (callback:(status:HomeScreenStatus)=>void)=>void;
    };
  };
};

export default function InstallPage(){
 const [status,setStatus]=useState("Preparando NOURA para este dispositivo…");
 const [installUrl,setInstallUrl]=useState("");
 const [insideTelegram,setInsideTelegram]=useState(false);
 const [homeStatus,setHomeStatus]=useState<HomeScreenStatus|null>(null);

 useEffect(()=>{(async()=>{
   const code=new URLSearchParams(window.location.search).get("code")||"";
   if(code){
     try{
       await exchangeInstallCode(code);
       setStatus("Dispositivo vinculado ✓ NOURA ya está conectada con tu cuenta.");
     }catch{
       setStatus("Este enlace expiró o ya fue utilizado. Genera uno nuevo desde Telegram.");
     }
     return;
   }

   const tgWindow=window as TelegramWindow;
   const webApp=tgWindow.Telegram?.WebApp;
   if(webApp?.initData){
     setInsideTelegram(true);
     setStatus("Puedes añadir NOURA al inicio directamente desde Telegram.");
     if(webApp.checkHomeScreenStatus){
       try{webApp.checkHomeScreenStatus((s)=>setHomeStatus(s));}catch{}
     }
     try{
       const url=await createInstallLink();
       setInstallUrl(url);
     }catch{}
     return;
   }

   setStatus("Abre esta opción desde el bot de NOURA en Telegram para vincular tu cuenta.");
 })()},[]);

 function addNativeShortcut(){
   const webApp=(window as TelegramWindow).Telegram?.WebApp;
   if(webApp?.addToHomeScreen){
     webApp.addToHomeScreen();
     setStatus("Telegram está preparando el acceso directo de NOURA…");
     window.setTimeout(()=>{
       try{webApp.checkHomeScreenStatus?.((s)=>{setHomeStatus(s);if(s==="added")setStatus("NOURA ya está en tu pantalla de inicio ✓");});}catch{}
     },1000);
     return;
   }
   setStatus("Tu versión de Telegram no expone la instalación nativa. Usa Abrir en navegador como alternativa.");
 }

 function openExternal(){
   if(!installUrl)return;
   const tgWindow=window as TelegramWindow;
   if(tgWindow.Telegram?.WebApp?.openLink) tgWindow.Telegram.WebApp.openLink(installUrl);
   else window.location.href=installUrl;
 }

 const nativeAvailable=insideTelegram&&typeof (window as TelegramWindow).Telegram?.WebApp?.addToHomeScreen==="function";
 const alreadyAdded=homeStatus==="added";

 return <main className="onboarding onboarding-premium">
   <div className="onboarding-glow"/>
   <div className="logo-orb">N</div>
   <div className="kicker">NOURA / HOME SCREEN</div>
   <h1>{alreadyAdded?"NOURA ya está instalada.":"Añade NOURA a tu Home Screen."}</h1>
   <p className="muted lead">{status}</p>

   {nativeAvailable&&!alreadyAdded&&<button className="btn btn-primary btn-large" style={{marginTop:18,maxWidth:420}} onClick={addNativeShortcut}>＋ Añadir NOURA al inicio</button>}
   {alreadyAdded&&<a className="btn btn-primary btn-large" style={{marginTop:18,maxWidth:420}} href="/">Abrir NOURA →</a>}
   {!nativeAvailable&&insideTelegram&&installUrl&&<button className="btn btn-primary btn-large" style={{marginTop:18,maxWidth:420}} onClick={openExternal}>Abrir en navegador →</button>}

   <div className="card-premium" style={{marginTop:20,maxWidth:560}}>
     <strong>Instalación nativa de Telegram</strong>
     <p className="muted">NOURA usa la función oficial de Telegram para crear un acceso directo con el icono del bot. No necesitas usar el menú Compartir de Safari cuando esta función está disponible.</p>
     <p className="muted" style={{marginTop:12}}>El menú de los tres puntos que muestras es parte de Telegram y no permite que una Mini App agregue opciones personalizadas. Por eso el botón de arriba abre directamente el diálogo nativo equivalente.</p>
   </div>
 </main>;
}
