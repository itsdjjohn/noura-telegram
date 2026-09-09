"use client";

import { useEffect, useMemo, useState } from "react";
import "./insights.css";

type WhoopDay = { date:string; recovery?:number; hrv?:number; rhr?:number; sleep?:number; sleepHours?:number; strain?:number };
type NutritionDay = { date:string; calories:number; protein:number; water:number };
type Store = { profile?:{ calories?:number; protein?:number }; meals?:Array<{date:string;calories:number;protein:number}>; water?:Record<string,number> };

const STORAGE_KEY = "noura-beta-v01";
function avg(values:number[]){ return values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0; }
function fmt(v:number,d=0){ return Number.isFinite(v) ? v.toFixed(d) : "—"; }
function dateLabel(date:string){ return new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-PA",{day:"numeric",month:"short"}); }
function linePath(values:(number|undefined)[], width=600, height=180){
  const clean = values.map((v,i)=>({v,i})).filter(x=>x.v!=null) as {v:number;i:number}[];
  if(clean.length<2) return "";
  const min=Math.min(...clean.map(x=>x.v)), max=Math.max(...clean.map(x=>x.v)); const range=max-min||1;
  return clean.map((x,j)=>`${j?"L":"M"} ${(x.i/(values.length-1))*width} ${height-((x.v-min)/range)*(height-24)-12}`).join(" ");
}
function corr(xs:number[], ys:number[]){
  const n=Math.min(xs.length,ys.length); if(n<3)return 0; const ax=avg(xs.slice(0,n)), ay=avg(ys.slice(0,n));
  let num=0,dx=0,dy=0; for(let i=0;i<n;i++){const a=xs[i]-ax,b=ys[i]-ay;num+=a*b;dx+=a*a;dy+=b*b;} return dx&&dy?num/Math.sqrt(dx*dy):0;
}

export default function InsightsPage(){
  const [range,setRange]=useState<7|30>(7); const [loading,setLoading]=useState(true); const [whoop,setWhoop]=useState<WhoopDay[]>([]); const [nutrition,setNutrition]=useState<NutritionDay[]>([]); const [connected,setConnected]=useState(false); const [targets,setTargets]=useState({protein:150,calories:2300});
  useEffect(()=>{const raw=localStorage.getItem(STORAGE_KEY);if(raw){try{const s:Store=JSON.parse(raw);setTargets({protein:s.profile?.protein||150,calories:s.profile?.calories||2300});const map=new Map<string,NutritionDay>();for(const m of s.meals||[]){const d=map.get(m.date)||{date:m.date,calories:0,protein:0,water:0};d.calories+=Number(m.calories)||0;d.protein+=Number(m.protein)||0;map.set(m.date,d);}for(const [date,water] of Object.entries(s.water||{})){const d=map.get(date)||{date,calories:0,protein:0,water:0};d.water=Number(water)||0;map.set(date,d);}setNutrition(Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)));}catch{}}},[]);
  useEffect(()=>{let cancelled=false;(async()=>{setLoading(true);try{const r=await fetch(`/api/whoop/history?days=${range}`,{cache:"no-store"});const b=await r.json();if(!cancelled){setConnected(Boolean(b.connected));setWhoop(b.days||[]);}}catch{if(!cancelled){setConnected(false);setWhoop([]);}}finally{if(!cancelled)setLoading(false);}})();return()=>{cancelled=true};},[range]);

  const days=useMemo(()=>whoop.slice(-range),[whoop,range]); const latest=days[days.length-1];
  const recAvg=avg(days.map(d=>d.recovery).filter((v):v is number=>v!=null)); const sleepAvg=avg(days.map(d=>d.sleep).filter((v):v is number=>v!=null)); const strainAvg=avg(days.map(d=>d.strain).filter((v):v is number=>v!=null)); const hrvAvg=avg(days.map(d=>d.hrv).filter((v):v is number=>v!=null));
  const paired=days.filter(d=>d.sleepHours!=null&&d.recovery!=null); const sleepRecCorr=corr(paired.map(d=>d.sleepHours!),paired.map(d=>d.recovery!));
  const nutritionRecent=nutrition.slice(-range); const proteinAdherence=nutritionRecent.length?avg(nutritionRecent.map(d=>Math.min(100,(d.protein/targets.protein)*100))):0; const waterAvg=nutritionRecent.length?avg(nutritionRecent.map(d=>d.water)):0; const calorieAdherence=nutritionRecent.length?avg(nutritionRecent.map(d=>Math.min(100,(d.calories/targets.calories)*100))):0;
  const insight = !connected ? "Conecta WHOOP para empezar a detectar patrones reales entre recuperación, sueño y nutrición." : paired.length<3 ? "Necesitamos algunos días más de datos para detectar relaciones confiables." : sleepRecCorr>0.35 ? `Tu Recovery tiende a mejorar cuando duermes más. La relación observada es ${Math.round(sleepRecCorr*100)}% positiva.` : sleepRecCorr<-0.35 ? "Tu patrón reciente es atípico: más horas de sueño no están coincidiendo con mejor Recovery. Conviene mirar calidad y consistencia." : "En este periodo no hay una relación fuerte entre horas de sueño y Recovery; otros factores parecen estar pesando más.";

  return <main className="app-shell premium-shell insights-shell">
    <header className="premium-topbar"><a className="brand" href="/"><div className="brand-mark">N</div><div><strong>NOURA</strong><small>Trends & insights</small></div></a><a href="/" className="status-chip">← Inicio</a></header>
    <section className="insights-hero motion-rise"><div><div className="kicker">BETA 0.5 / TRENDS</div><h1>Tu cuerpo tiene patrones. Ahora NOURA los encuentra.</h1><p>Recovery, sueño, Strain, hidratación y nutrición en una sola lectura.</p></div><div className="range-switch"><button className={range===7?"active":""} onClick={()=>setRange(7)}>7D</button><button className={range===30?"active":""} onClick={()=>setRange(30)}>30D</button></div></section>
    <section className="insight-callout motion-rise delay-1"><span className="kicker">NOURA INSIGHT</span><h2>{insight}</h2><div className="insight-meta"><span>{days.length} días WHOOP</span><span>{nutritionRecent.length} días nutrición</span></div></section>
    {loading?<div className="sensor-grid skeleton-grid section-section"><div/><div/><div/><div/></div>:<>
      <section className="trend-stat-grid section-section motion-rise delay-2">
        {[{n:"Recovery promedio",v:`${fmt(recAvg)}%`,s:latest?.recovery!=null?`Hoy ${Math.round(latest.recovery)}%`:"Sin dato hoy"},{n:"Sleep performance",v:`${fmt(sleepAvg)}%`,s:latest?.sleepHours?`${latest.sleepHours}h en cama`:"WHOOP"},{n:"Strain promedio",v:fmt(strainAvg,1),s:latest?.strain!=null?`Hoy ${fmt(latest.strain,1)}`:"Carga diaria"},{n:"HRV promedio",v:fmt(hrvAvg),s:"ms"}].map(x=><article className="trend-stat" key={x.n}><span>{x.n}</span><strong>{x.v}</strong><small>{x.s}</small></article>)}
      </section>
      <section className="trend-panel section-section motion-rise delay-3"><div className="section-title"><div><span className="kicker">RECOVERY TREND</span><h2>Cómo vienes respondiendo</h2></div><span className="trend-average">Avg {fmt(recAvg)}%</span></div><div className="chart-wrap"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".28"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d={`${linePath(days.map(d=>d.recovery))} L 600 180 L 0 180 Z`}/><path className="chart-line" d={linePath(days.map(d=>d.recovery))}/></svg></div><div className="chart-labels">{days.filter((_,i)=>i===0||i===days.length-1||i===Math.floor(days.length/2)).map(d=><span key={d.date}>{dateLabel(d.date)}</span>)}</div></section>
      <section className="dual-grid section-section motion-rise delay-4"><article className="trend-panel compact"><span className="kicker">SLEEP → RECOVERY</span><h2>{paired.length>=3?`${Math.round(sleepRecCorr*100)}% relación`:"Aún aprendiendo"}</h2><p>Relación estadística simple entre tus horas de sueño y Recovery del periodo.</p><div className="mini-meter"><span style={{width:`${Math.min(100,Math.abs(sleepRecCorr)*100)}%`}}/></div></article><article className="trend-panel compact"><span className="kicker">PROTEÍNA</span><h2>{fmt(proteinAdherence)}% adherencia</h2><p>Qué tan cerca estuviste de tu objetivo diario durante los días registrados.</p><div className="mini-meter"><span style={{width:`${Math.min(100,proteinAdherence)}%`}}/></div></article></section>
      <section className="habit-trends section-section motion-rise delay-5"><div className="section-title"><div><span className="kicker">HÁBITOS</span><h2>Consistencia reciente</h2></div></div><div className="habit-trend-grid"><article><span>Agua promedio</span><strong>{Math.round(waterAvg)} ml</strong><small>meta 2500 ml</small></article><article><span>Adherencia calórica</span><strong>{fmt(calorieAdherence)}%</strong><small>según tu objetivo actual</small></article><article><span>Días con registro</span><strong>{nutritionRecent.length}/{range}</strong><small>consistencia nutricional</small></article></div></section>
    </>}
    <section className="beta-note section-section"><span className="kicker">BETA NOTE</span><p>Estas relaciones son descriptivas y no implican causalidad. NOURA usa tus datos para darte contexto, no diagnóstico médico.</p></section>
  </main>;
}
