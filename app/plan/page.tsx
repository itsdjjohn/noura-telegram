"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./plan.css";

type Meal={id:string;date:string;title:string;items:string;calories:number;protein:number;carbs:number;fat:number};
type Profile={name:string;calories:number;protein:number;carbs:number;fat:number};
type Store={onboarded:boolean;profile:Profile;meals:Meal[];water:Record<string,number>};
type Whoop={connected:boolean;recovery?:{recovery_score?:number;hrv_rmssd_milli?:number;resting_heart_rate?:number}|null;sleep?:{sleep_performance_percentage?:number}|null;cycle?:{strain?:number}|null};
type Snapshot={date:string;calories:number;protein:number;water:number;recovery?:number;sleep?:number;strain?:number;score:number};
type LocalV06={checks:Record<string,Record<string,boolean>>;snapshots:Record<string,Snapshot>};

const STORE_KEY="noura-beta-v01";
const V06_KEY="noura-beta-v06-local";
const defaultV06:LocalV06={checks:{},snapshots:{}};
function dateKey(d=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Panama",year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
function pct(v:number,m:number){return m?Math.min(100,Math.max(0,Math.round(v/m*100))):0}
function daysAgo(n:number){const d=new Date();d.setDate(d.getDate()-n);return dateKey(d)}

export default function PlanPage(){
 const [store,setStore]=useState<Store|null>(null);const [whoop,setWhoop]=useState<Whoop|null>(null);const [local,setLocal]=useState<LocalV06>(defaultV06);const [ready,setReady]=useState(false);const fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{try{const raw=localStorage.getItem(STORE_KEY);if(raw)setStore(JSON.parse(raw));const v=localStorage.getItem(V06_KEY);if(v)setLocal(JSON.parse(v));}catch{}setReady(true);fetch("/api/whoop/summary",{cache:"no-store"}).then(r=>r.json()).then(setWhoop).catch(()=>setWhoop({connected:false}));},[]);
 useEffect(()=>{if(ready)localStorage.setItem(V06_KEY,JSON.stringify(local));},[local,ready]);
 const today=dateKey();const meals=useMemo(()=>store?.meals?.filter(m=>m.date===today)||[],[store,today]);
 const totals=useMemo(()=>meals.reduce((a,m)=>({calories:a.calories+m.calories,protein:a.protein+m.protein}),{calories:0,protein:0}),[meals]);
 const water=store?.water?.[today]||0;const proteinGoal=store?.profile?.protein||150;const calorieGoal=store?.profile?.calories||2300;const proteinLeft=Math.max(0,proteinGoal-totals.protein);const caloriesLeft=Math.max(0,calorieGoal-totals.calories);
 const recovery=whoop?.recovery?.recovery_score;const sleep=whoop?.sleep?.sleep_performance_percentage;const strain=whoop?.cycle?.strain;
 const plan=useMemo(()=>[
  {id:"hydrate",icon:"◒",title:water>=2000?"Hidratación encaminada":"Sube tu hidratación",detail:water>=2000?`${water} ml registrados hoy.`:`Lleva ${water} ml. Intenta llegar al menos a 2,000–2,500 ml.`,priority:water<1500?"high":"normal"},
  {id:"protein",icon:"P",title:proteinLeft<=25?"Proteína casi cerrada":"Cierra tu proteína",detail:proteinLeft<=25?`Solo faltan ${proteinLeft} g.`:`Te faltan ${proteinLeft} g. Prioriza una comida con proteína clara.`,priority:proteinLeft>50?"high":"normal"},
  {id:"recovery",icon:"R",title:(recovery??70)<34?"Día de recuperación":"Alinea esfuerzo con Recovery",detail:whoop?.connected?`Recovery ${recovery??"—"}% · Sleep ${sleep??"—"}% · Strain ${strain?.toFixed?.(1)??strain??"—"}.`:`Conecta WHOOP para adaptar este bloque.`,priority:(recovery??70)<34?"high":"normal"},
  {id:"energy",icon:"E",title:caloriesLeft<350?"Energía casi completa":"Planifica la siguiente comida",detail:`Te quedan ${caloriesLeft} kcal para hoy.`,priority:strain!=null&&strain>=14&&caloriesLeft>600?"high":"normal"}
 ],[water,proteinLeft,recovery,sleep,strain,whoop?.connected,caloriesLeft]);
 const checks=local.checks[today]||{};const done=plan.filter(x=>checks[x.id]).length;const completion=Math.round(done/plan.length*100);
 useEffect(()=>{if(!ready||!store)return;const score=Math.round((pct(totals.protein,proteinGoal)*.45+pct(water,2500)*.25+pct(totals.calories,calorieGoal)*.15+((recovery??70))*.15));const snap:Snapshot={date:today,calories:totals.calories,protein:totals.protein,water,recovery,sleep,strain,score};setLocal(prev=>{const old=prev.snapshots[today];if(old&&JSON.stringify(old)===JSON.stringify(snap))return prev;return {...prev,snapshots:{...prev.snapshots,[today]:snap}}});},[ready,store,today,totals.calories,totals.protein,water,recovery,sleep,strain,proteinGoal,calorieGoal]);
 const streak=useMemo(()=>{let s=0;for(let i=0;i<30;i++){const d=daysAgo(i);const c=local.checks[d]||{};if(Object.values(c).filter(Boolean).length>=3)s++;else if(i>0)break;else break}return s},[local.checks]);
 function toggle(id:string){setLocal(p=>({...p,checks:{...p.checks,[today]:{...(p.checks[today]||{}),[id]:!(p.checks[today]?.[id])}}}))}
 function exportData(){const payload={version:"0.6",exportedAt:new Date().toISOString(),[STORE_KEY]:store,[V06_KEY]:local};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`noura-backup-${today}.json`;a.click();URL.revokeObjectURL(url)}
 async function importData(file:File){try{const data=JSON.parse(await file.text());if(data[STORE_KEY]){localStorage.setItem(STORE_KEY,JSON.stringify(data[STORE_KEY]));setStore(data[STORE_KEY])}if(data[V06_KEY]){localStorage.setItem(V06_KEY,JSON.stringify(data[V06_KEY]));setLocal(data[V06_KEY])}}catch{alert("Este archivo no parece ser un backup válido de NOURA.")}}
 if(!ready)return <main className="splash"><div className="logo-orb">N</div><div className="loading-bar"><span/></div><p>Construyendo tu plan</p></main>;
 return <main className="app-shell plan-shell"><header className="topbar premium-topbar"><a className="brand" href="/"><div className="brand-mark">N</div><div><strong>NOURA</strong><small>Daily Plan · Beta 0.6</small></div></a><a className="status-chip" href="/">← Hoy</a></header>
 <section className="plan-hero"><div className="plan-hero-copy"><div className="kicker">DAILY INTELLIGENCE</div><h1>Tu plan para hoy.</h1><p>Cuatro acciones simples, adaptadas a lo que ya registraste y a cómo llega tu cuerpo.</p><div className="plan-meta"><span>{done}/{plan.length} completadas</span><span>{streak} días de racha</span><span>{whoop?.connected?"WHOOP activo":"Modo local"}</span></div></div><div className="completion-orb" style={{"--done":completion} as React.CSSProperties}><div><b>{completion}%</b><small>hecho</small></div></div></section>
 <section className="section-section"><div className="section-title"><div><span className="kicker">ACTION PLAN</span><h2>Lo que más importa hoy</h2></div></div><div className="plan-list">{plan.map((item,i)=><button key={item.id} className={`plan-item ${checks[item.id]?"done":""} ${item.priority==="high"?"priority":""}`} onClick={()=>toggle(item.id)} style={{"--delay":`${i*70}ms`} as React.CSSProperties}><span className="plan-icon">{checks[item.id]?"✓":item.icon}</span><span className="plan-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="plan-check">{checks[item.id]?"Hecho":"Marcar"}</span></button>)}</div></section>
 <section className="section-section"><div className="section-title"><div><span className="kicker">LOCAL SNAPSHOT</span><h2>Tu día en números</h2></div><a className="text-link" href="/insights">Ver tendencias →</a></div><div className="plan-stat-grid"><article><span>Calorías</span><strong>{totals.calories}</strong><small>de {calorieGoal}</small></article><article><span>Proteína</span><strong>{totals.protein}g</strong><small>de {proteinGoal}g</small></article><article><span>Agua</span><strong>{water}</strong><small>ml</small></article><article><span>Recovery</span><strong>{recovery!=null?`${Math.round(recovery)}%`:"—"}</strong><small>{whoop?.connected?"WHOOP":"sin conexión"}</small></article></div></section>
 <section className="section-section"><div className="local-card"><div><span className="kicker">LOCAL-FIRST</span><h2>Tus datos siguen en tu dispositivo.</h2><p>Beta 0.6 no usa base de datos para nutrición, hábitos ni snapshots. Puedes crear un backup manual e importarlo después.</p></div><div className="backup-actions"><button className="btn btn-secondary" onClick={exportData}>Exportar backup</button><button className="btn btn-primary" onClick={()=>fileRef.current?.click()}>Importar backup</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)importData(f)}}/></div></div></section>
 </main>;
}
