"use client";

import { useEffect,useState } from "react";
import { createInstallLink, exchangeInstallCode } from "@/lib/noura-data";

export default function InstallPage(){
 const [status,setStatus]=useState("Preparando NOURA para este dispositivo…");
 useEffect(()=>{(async()=>{const code=new URLSearchParams(window.location.search).get("code")||"";if(code){try{await exchangeInstallCode(code);setStatus("Dispositivo vinculado ✓ Abriendo NOURA…");window.setTimeout(()=>window.location.replace("/"),700);}catch{setStatus("Este enlace expiró o ya fue utilizado. Genera uno nuevo desde Telegram.");}return;}if(window.Telegram?.WebApp?.initData){try{setStatus("Abriendo el navegador para instalar NOURA…");const url=await createInstallLink();if(window.Telegram.WebApp.openLink)window.Telegram.WebApp.openLink(url);else window.location.href=url;}catch{setStatus("No pude preparar el enlace. Abre primero NOURA desde /start y vuelve a intentarlo.");}return;}setStatus("Abre esta opción desde el bot de NOURA en Telegram para vincular tu cuenta.");})()},[]);
 return <main className="onboarding onboarding-premium"><div className="onboarding-glow"/><div className="logo-orb">N</div><div className="kicker">NOURA / INSTALL</div><h1>Tu app, fuera de Telegram.</h1><p className="muted lead">{status}</p><div className="card-premium" style={{marginTop:20,maxWidth:520}}><strong>Instalación</strong><p className="muted">Cuando se abra NOURA en tu navegador, toca “Instalar NOURA”. En iPhone usa Compartir → Añadir a pantalla de inicio. En Android acepta “Instalar app”.</p></div></main>;
}
