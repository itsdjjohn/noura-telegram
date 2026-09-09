"use client";

import { useEffect,useMemo,useState } from "react";
import "./coach.css";

type Meal={date:string;calories:number;protein:number;carbs:number;fat:number};
type Store={profile:{goal:string;calories:number;protein:number;carbs:number;fat:number};meals:Meal[];water:Record<string,number>};
type Whoop={connected:boolean;recovery?:{recovery_score?:number;hrv_rmssd_milli?:number}|null;sleep?:{sleep_performance_percentage?:number}|null;cycle?:{strain?:number}|null};
type Recommendation={source:"ai"|"local";headline:string;summary:string;actions:string[];note:string};
const STORAGE_KEY="noura-beta-v01";
function todayKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Panama",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}

export default function CoachPage(){
  const [store,setStore]=useState<Store|null>(null);const [whoop,setWhoop]=useState<Whoop|null>(null);const [result,setResult]=useState<Recommendation|null>(null);const [loading,setLoading]=useState(false);
  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)setStore(JSON.parse(raw));}catch{}fetch("/api/whoop/summary",{cache:"no-store"}).then(r=>r.json()).then(setWhoop).catch(()=>setWhoop({connected:false}));},[]);
  const today=useMemo(()=>{const key=todayKey();const meals=store?.meals?.filter(m=>m.date===key)||[];return{mealCount:meals.length,calories:meals.reduce((s,m)=>s+(m.calories||0),0),protein:meals.reduce((s,m)=>s+(m.protein||0),0),carbs:meals.reduce((s,m)=>s+(m.carbs||0),0),fat:meals.reduce((s,m)=>s+(m.fat||0),0),water:store?.water?.[key]||0};},[store]);
  async function generate(){if(!store)return;setLoading(true);try{const r=await fetch("/api/ai/recommendations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile:store.profile,today,whoop:{connected:whoop?.connected||false,recovery:whoop?.recovery?.recovery_score??null,sleep:whoop?.sleep?.sleep_performance_percentage??null,strain:whoop?.cycle?.strain??null,hrv:whoop?.recovery?.hrv_rmssd_milli??null}})});setResult(await r.json());}finally{setLoading(false)}}
  return <main className="coach-shell"><div className="coach-wrap"><header className="coach-top"><a href="/" className="coach-brand"><span>N</span><b>NOURA COACH</b></a><a href="/" className="coach-back">Volver</a></header><section className="coach-hero"><div className="kicker">BETA 0.7 / ADAPTIVE COACH</div><h1>Recomendaciones que usan tu día real.</h1><p>NOURA combina lo que has registrado localmente con tu contexto de WHOOP. Tus datos solo se envían al modelo cuando tú presionas generar.</p><button className="coach-primary" onClick={generate} disabled={!store||loading}>{loading?"Pensando…":"Generar recomendación →"}</button></section><section className="coach-context"><article><span>Comidas</span><strong>{today.mealCount}</strong></article><article><span>Proteína</span><strong>{today.protein}g</strong></article><article><span>Agua</span><strong>{today.water}ml</strong></article><article><span>Recovery</span><strong>{whoop?.recovery?.recovery_score!=null?`${Math.round(whoop.recovery.recovery_score)}%`:"—"}</strong></article></section>{result&&<section className="coach-result"><div className="coach-source">{result.source==="ai"?"AI COACH":"LOCAL COACH"}</div><h2>{result.headline}</h2><p>{result.summary}</p><div className="coach-actions">{result.actions.map((a,i)=><article key={i}><span>0{i+1}</span><p>{a}</p></article>)}</div><small>{result.note}</small></section>}</div></main>;
}
