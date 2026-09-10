"use client";

import { useEffect,useState } from "react";
import { exchangeInstallCode } from "@/lib/noura-data";

export default function InstallPage(){
 const [status,setStatus]=useState("Vinculando NOURA con este dispositivo…");
 useEffect(()=>{const code=new URLSearchParams(window.location.search).get("code")||"";if(!code){setStatus("Falta el código de instalación. Vuelve al bot de NOURA y toca Instalar NOURA.");return;}exchangeInstallCode(code).then(()=>{setStatus("Dispositivo vinculado ✓");window.setTimeout(()=>window.location.replace("/"),700)}).catch(()=>setStatus("Este enlace expiró o ya fue utilizado. Genera uno nuevo desde Telegram."));},[]);
 return <main className="onboarding onboarding-premium"><div className="onboarding-glow"/><div className="logo-orb">N</div><div className="kicker">NOURA / INSTALL</div><h1>Tu app, fuera de Telegram.</h1><p className="muted lead">{status}</p><div className="card-premium" style={{marginTop:20,maxWidth:520}}><strong>Después de vincular</strong><p className="muted">Toca “Instalar NOURA”. En iPhone usa Compartir → Añadir a pantalla de inicio. En Android aparecerá la opción Instalar app.</p></div></main>;
}
