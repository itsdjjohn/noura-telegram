"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseMealText, type ParsedMeal } from "@/lib/nutrition-parser";
import styles from "./assistant.module.css";

type Meal = { id:string; date:string; title:string; items:string; calories:number; protein:number; carbs:number; fat:number; };
type Profile = { calories:number; protein:number; carbs:number; fat:number; name?:string };
type Store = { onboarded:boolean; profile:Profile; meals:Meal[]; water:Record<string,number>; };
type WhoopSummary = { connected:boolean; recovery?:{recovery_score?:number}|null; sleep?:{sleep_performance_percentage?:number}|null; cycle?:{strain?:number}|null };

const STORAGE_KEY="noura-beta-v01";
function localDateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Panama",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}

function AssistantInner(){
  const params=useSearchParams();
  const [text,setText]=useState(params.get("text")||"");
  const [parsed,setParsed]=useState<ParsedMeal|null>(null);
  const [store,setStore]=useState<Store|null>(null);
  const [whoop,setWhoop]=useState<WhoopSummary|null>(null);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{const raw=localStorage.getItem(STORAGE_KEY);if(raw){try{setStore(JSON.parse(raw));}catch{setStore(null);}}fetch("/api/whoop/summary",{cache:"no-store"}).then(r=>r.json()).then(setWhoop).catch(()=>setWhoop({connected:false}));},[]);
  useEffect(()=>{if(text.trim())setParsed(parseMealText(text));},[]);

  const today=localDateKey();
  const todayTotals=useMemo(()=>{
    const meals=store?.meals?.filter(m=>m.date===today)||[];
    return meals.reduce((a,m)=>({calories:a.calories+m.calories,protein:a.protein+m.protein,carbs:a.carbs+m.carbs,fat:a.fat+m.fat}),{calories:0,protein:0,carbs:0,fat:0});
  },[store,today]);

  function analyze(){setParsed(parseMealText(text));setSaved(false);}
  function save(){
    if(!parsed||!store||parsed.calories<=0)return;
    const next:Store={...store,meals:[{id:crypto.randomUUID(),date:today,title:"Smart Log",items:parsed.items,calories:parsed.calories,protein:parsed.protein,carbs:parsed.carbs,fat:parsed.fat},...(store.meals||[])]};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setStore(next);setSaved(true);
  }

  const remainingProtein=Math.max(0,(store?.profile?.protein||0)-todayTotals.protein-(parsed?.protein||0));
  const recovery=whoop?.recovery?.recovery_score;
  const recommendation=()=>{
    if(!parsed)return "Escribe una comida y NOURA estimará sus macros antes de guardarla.";
    if(parsed.confidence==="low")return "No reconocí suficientes alimentos. Puedes usar frases como “2 huevos, 1 taza de arroz y pollo”.";
    if(recovery!=null&&recovery<34)return "Tu Recovery está bajo: esta comida puede encajar mejor si priorizas hidratación y una digestión sencilla.";
    if(remainingProtein>35)return `Después de esta comida todavía te faltarían aprox. ${remainingProtein} g de proteína para tu meta de hoy.`;
    return "Esta comida encaja razonablemente con tu día. Revisa las cantidades antes de confirmar porque es una estimación.";
  };

  return <main className={styles.shell}><div className={styles.wrap}>
    <header className={styles.top}><div className={styles.brand}><div className={styles.mark}>N</div><span>NOURA Assistant</span></div><a href="/" className={styles.back}>Volver</a></header>
    <section className={styles.hero}><div className={styles.kicker}>BETA 0.3 / SMART LOG</div><h1>Dime qué comiste. Yo hago el resto.</h1><p>Describe tu comida como hablarías normalmente. NOURA estima calorías y macros, te muestra qué reconoció y tú decides si guardarlo.</p>
      <div className={styles.composer}><textarea className={styles.textarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Ej: me comí 2 huevos, 2 tostadas, aguacate y café"/><button className={styles.primary} onClick={analyze}>Analizar comida →</button></div>
    </section>
    {!parsed?<div className={styles.empty}>Prueba con: “1 taza de arroz, pollo, aguacate y una banana”.</div>:<div className={styles.result}>
      <section className={styles.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div className={styles.kicker}>ESTIMACIÓN</div><h2 style={{margin:"6px 0 0"}}>Macros detectados</h2></div><span className={styles.confidence}>Confianza {parsed.confidence}</span></div>
        <div className={styles.summary}><div className={styles.metric}><span>Calorías</span><strong>{parsed.calories}</strong></div><div className={styles.metric}><span>Proteína</span><strong>{parsed.protein}g</strong></div><div className={styles.metric}><span>Carbs</span><strong>{parsed.carbs}g</strong></div><div className={styles.metric}><span>Grasas</span><strong>{parsed.fat}g</strong></div></div>
        <div className={styles.matchList}>{parsed.matches.map((m,i)=><div className={styles.match} key={`${m.name}-${i}`}><span>{m.name}</span><small>{m.quantity} × {m.unit}</small></div>)}</div>
      </section>
      <section className={styles.card}><div className={styles.whoop}><div><div className={styles.kicker}>NOURA CONTEXT</div><strong>{whoop?.connected&&recovery!=null?`${Math.round(recovery)}% Recovery`:"Nutrición primero"}</strong><div><small>{recommendation()}</small></div></div><span style={{fontSize:28}}>↗</span></div></section>
      <div className={styles.notice}>Las cifras son aproximadas y dependen de porciones, preparación y marcas. Ajusta manualmente si necesitas mayor precisión.</div>
      <div className={styles.actions}><button className={styles.secondary} onClick={()=>{setParsed(null);setSaved(false)}}>Editar texto</button><button className={styles.primary} onClick={save} disabled={parsed.calories<=0}>{saved?"Guardado ✓":"Guardar en hoy"}</button></div>
    </div>}
  </div></main>;
}

export default function AssistantPage(){return <Suspense fallback={<main className={styles.shell}><div className={styles.wrap}>Cargando NOURA Assistant…</div></main>}><AssistantInner/></Suspense>}
