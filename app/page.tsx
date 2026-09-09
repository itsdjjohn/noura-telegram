"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = "healthy" | "lose" | "maintain" | "gain" | "performance";
type Tab = "today" | "meals" | "recipes" | "profile";

type Profile = {
  name: string;
  age: number;
  height: number;
  weight: number;
  activity: "low" | "medium" | "high";
  goal: Goal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: string;
  date: string;
  title: string;
  items: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Store = {
  onboarded: boolean;
  profile: Profile;
  meals: Meal[];
  water: Record<string, number>;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: { user?: { first_name?: string; username?: string; id?: number } };
        colorScheme?: "light" | "dark";
      };
    };
  }
}

const STORAGE_KEY = "noura-beta-v01";
const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyStore: Store = {
  onboarded: false,
  profile: {
    name: "",
    age: 23,
    height: 175,
    weight: 72,
    activity: "medium",
    goal: "healthy",
    calories: 2300,
    protein: 150,
    carbs: 260,
    fat: 75,
  },
  meals: [],
  water: {},
};

function calculateTargets(profile: Profile): Profile {
  const activityMultiplier = profile.activity === "low" ? 1.35 : profile.activity === "high" ? 1.7 : 1.5;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  let calories = Math.round((bmr * activityMultiplier) / 50) * 50;
  if (profile.goal === "lose") calories -= 350;
  if (profile.goal === "gain") calories += 300;
  if (profile.goal === "performance") calories += 150;
  calories = Math.max(1500, calories);
  const protein = Math.round(profile.weight * (profile.goal === "gain" || profile.goal === "performance" ? 2 : 1.8));
  const fat = Math.round(profile.weight * 0.9);
  const carbs = Math.max(100, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { ...profile, calories, protein, carbs, fat };
}

function pct(value: number, max: number) {
  if (!max) return 0;
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

export default function Home() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [mealOpen, setMealOpen] = useState(false);
  const [mealForm, setMealForm] = useState({ title: "Almuerzo", items: "", calories: 500, protein: 30, carbs: 50, fat: 15 });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setStore(JSON.parse(raw)); } catch { setStore(emptyStore); }
    } else {
      const first = tg?.initDataUnsafe?.user?.first_name;
      if (first) setStore(s => ({ ...s, profile: { ...s.profile, name: first } }));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, hydrated]);

  const todayMeals = useMemo(() => store.meals.filter(m => m.date === todayKey()), [store.meals]);
  const totals = useMemo(() => todayMeals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [todayMeals]);
  const water = store.water[todayKey()] || 0;

  if (!hydrated) return <main className="onboarding"><div className="logo-big">N</div><p className="muted">Cargando NOURA…</p></main>;

  if (!store.onboarded) {
    const goals: { key: Goal; title: string; sub: string }[] = [
      { key: "healthy", title: "Comer mejor", sub: "Mejorar hábitos sin obsesionarme con números." },
      { key: "lose", title: "Perder grasa", sub: "Déficit moderado y proteína alta." },
      { key: "maintain", title: "Mantener peso", sub: "Equilibrio y consistencia." },
      { key: "gain", title: "Ganar músculo", sub: "Superávit controlado y más proteína." },
      { key: "performance", title: "Rendimiento", sub: "Comer según actividad y recuperación." },
    ];
    return (
      <main className="onboarding">
        <div className="logo-big">N</div>
        <div className="kicker">NOURA BETA</div>
        <h1>Nutrición que se adapta a tu vida.</h1>
        <p className="muted">Configura una base simple. Luego conectaremos WHOOP para adaptar recomendaciones según sueño, recovery y strain.</p>
        <div className="goal-grid">
          {goals.map(g => <button key={g.key} className={`goal ${store.profile.goal === g.key ? "active" : ""}`} onClick={() => setStore(s => ({ ...s, profile: { ...s.profile, goal: g.key } }))}><strong>{g.title}</strong><div className="row-sub">{g.sub}</div></button>)}
        </div>
        <div className="form">
          <div className="field"><label>Nombre</label><input className="input" value={store.profile.name} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, name: e.target.value } }))} placeholder="John" /></div>
          <div className="grid-2">
            <div className="field"><label>Edad</label><input className="input" type="number" min="16" max="90" value={store.profile.age} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, age: Number(e.target.value) } }))} /></div>
            <div className="field"><label>Peso (kg)</label><input className="input" type="number" min="40" max="250" value={store.profile.weight} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, weight: Number(e.target.value) } }))} /></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Altura (cm)</label><input className="input" type="number" min="140" max="220" value={store.profile.height} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, height: Number(e.target.value) } }))} /></div>
            <div className="field"><label>Actividad</label><select className="select" value={store.profile.activity} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, activity: e.target.value as Profile["activity"] } }))}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
          </div>
          <button className="btn btn-primary" onClick={() => setStore(s => ({ ...s, onboarded: true, profile: calculateTargets(s.profile) }))}>Crear mi plan</button>
        </div>
      </main>
    );
  }

  const addMeal = () => {
    if (!mealForm.items.trim()) return;
    const meal: Meal = { id: crypto.randomUUID(), date: todayKey(), ...mealForm };
    setStore(s => ({ ...s, meals: [meal, ...s.meals] }));
    setMealForm({ title: "Almuerzo", items: "", calories: 500, protein: 30, carbs: 50, fat: 15 });
    setMealOpen(false);
  };

  const removeMeal = (id: string) => setStore(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  const addWater = (ml: number) => setStore(s => ({ ...s, water: { ...s.water, [todayKey()]: Math.max(0, (s.water[todayKey()] || 0) + ml) } }));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">N</div>NOURA</div>
        <div className="avatar">{(store.profile.name || "N").slice(0, 1).toUpperCase()}</div>
      </header>

      {tab === "today" && <>
        <section className="hero">
          <div className="eyebrow">Hoy · {new Date().toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "short" })}</div>
          <h1>Hola, {store.profile.name || "John"}.</h1>
          <p className="muted">Tu objetivo de hoy es mantenerlo simple: comer bien, llegar a tu proteína y mantenerte hidratado.</p>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,marginTop:18,marginBottom:8}}><strong>{totals.calories.toLocaleString()} kcal</strong><span className="muted">de {store.profile.calories.toLocaleString()}</span></div>
          <div className="progress"><span style={{width:`${pct(totals.calories, store.profile.calories)}%`}} /></div>
        </section>

        <section className="section macros">
          <div className="macro"><div className="eyebrow">Proteína</div><div className="value">{totals.protein}g</div><div className="row-sub">de {store.profile.protein}g</div></div>
          <div className="macro"><div className="eyebrow">Carbs</div><div className="value">{totals.carbs}g</div><div className="row-sub">de {store.profile.carbs}g</div></div>
          <div className="macro"><div className="eyebrow">Grasas</div><div className="value">{totals.fat}g</div><div className="row-sub">de {store.profile.fat}g</div></div>
        </section>

        <section className="section quick-actions">
          <button className="quick" onClick={() => setMealOpen(true)}><strong>＋ Registrar comida</strong><span className="muted">Añade macros en segundos.</span></button>
          <button className="quick" onClick={() => addWater(250)}><strong>💧 +250 ml agua</strong><span className="muted">Hoy: {water} ml</span></button>
          <button className="quick" onClick={() => setTab("recipes")}><strong>✦ Ver recetas</strong><span className="muted">Ideas rápidas según tu día.</span></button>
          <button className="quick" disabled title="Disponible cuando conectemos WHOOP"><strong>↗ WHOOP</strong><span className="muted">Próximamente.</span></button>
        </section>

        <section className="section card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>Comidas de hoy</h2><span className="pill">{todayMeals.length} registros</span></div>
          {todayMeals.length === 0 ? <div className="empty">Aún no has registrado comidas hoy.</div> : <div className="list">{todayMeals.map(m => <div className="row" key={m.id}><div><div className="row-title">{m.title}</div><div className="row-sub">{m.items}</div></div><div style={{textAlign:"right"}}><strong>{m.calories} kcal</strong><div className="row-sub">{m.protein}g proteína</div></div></div>)}</div>}
        </section>
      </>}

      {tab === "meals" && <section className="card">
        <div className="kicker">LOG</div><h1>Comidas</h1><p className="muted">Todo lo que registres se guarda localmente en este dispositivo.</p>
        <button className="btn btn-primary" onClick={() => setMealOpen(true)}>＋ Nueva comida</button>
        <div className="section list">{store.meals.length === 0 ? <div className="empty">Todavía no hay registros.</div> : store.meals.map(m => <div className="row" key={m.id}><div><div className="row-title">{m.title}</div><div className="row-sub">{m.date} · {m.items}</div></div><div style={{textAlign:"right"}}><strong>{m.calories} kcal</strong><br/><button className="btn btn-danger" style={{padding:"7px 10px",marginTop:7}} onClick={() => removeMeal(m.id)}>Eliminar</button></div></div>)}</div>
      </section>}

      {tab === "recipes" && <section>
        <div className="kicker">RECETAS</div><h1>Qué comer hoy</h1><p className="muted">Ideas fáciles para una alimentación sana. Más adelante las adaptaremos automáticamente con WHOOP.</p>
        <div className="list">
          <article className="recipe"><div className="pill">Desayuno · 10 min</div><h3 style={{marginTop:12}}>Huevos, aguacate y tostadas</h3><p className="muted">2 huevos + claras, aguacate, pan integral y fruta.</p><strong>≈ 520 kcal · 35g proteína</strong></article>
          <article className="recipe"><div className="pill">Almuerzo · 20 min</div><h3 style={{marginTop:12}}>Bowl de pollo tropical</h3><p className="muted">Pollo, arroz, vegetales, aguacate y pico de gallo.</p><strong>≈ 680 kcal · 52g proteína</strong></article>
          <article className="recipe"><div className="pill">Cena · 15 min</div><h3 style={{marginTop:12}}>Salmón con papas y ensalada</h3><p className="muted">Salmón a la plancha, papas pequeñas y ensalada fresca.</p><strong>≈ 610 kcal · 44g proteína</strong></article>
          <article className="recipe"><div className="pill">Snack · 3 min</div><h3 style={{marginTop:12}}>Yogurt bowl</h3><p className="muted">Yogurt griego, berries, avena y un toque de miel.</p><strong>≈ 330 kcal · 25g proteína</strong></article>
        </div>
      </section>}

      {tab === "profile" && <section className="card">
        <div className="kicker">PERFIL</div><h1>Tu plan</h1>
        <div className="grid-2"><div className="stat"><span className="muted">Calorías</span><b>{store.profile.calories}</b></div><div className="stat"><span className="muted">Proteína</span><b>{store.profile.protein}g</b></div></div>
        <div className="section notice">WHOOP aún no está conectado. La siguiente fase añadirá Recovery, Sleep, HRV, Strain y workouts.</div>
        <div className="section form">
          <div className="field"><label>Calorías objetivo</label><input className="input" type="number" value={store.profile.calories} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, calories: Number(e.target.value) } }))}/></div>
          <div className="field"><label>Proteína objetivo (g)</label><input className="input" type="number" value={store.profile.protein} onChange={e => setStore(s => ({ ...s, profile: { ...s.profile, protein: Number(e.target.value) } }))}/></div>
          <button className="btn btn-secondary" onClick={() => setStore(s => ({ ...s, profile: calculateTargets(s.profile) }))}>Recalcular objetivos</button>
          <button className="btn btn-danger" onClick={() => { localStorage.removeItem(STORAGE_KEY); setStore(emptyStore); setTab("today"); }}>Reiniciar beta</button>
        </div>
      </section>}

      {mealOpen && <section className="section card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div className="kicker">NUEVO</div><h2>Registrar comida</h2></div><button className="btn btn-secondary" onClick={() => setMealOpen(false)}>Cerrar</button></div>
        <div className="form">
          <div className="field"><label>Tipo</label><select className="select" value={mealForm.title} onChange={e => setMealForm(f => ({ ...f, title: e.target.value }))}><option>Desayuno</option><option>Almuerzo</option><option>Cena</option><option>Snack</option></select></div>
          <div className="field"><label>Qué comiste</label><input className="input" value={mealForm.items} onChange={e => setMealForm(f => ({ ...f, items: e.target.value }))} placeholder="Ej. pollo, arroz y aguacate"/></div>
          <div className="grid-2"><div className="field"><label>Calorías</label><input className="input" type="number" value={mealForm.calories} onChange={e => setMealForm(f => ({ ...f, calories: Number(e.target.value) }))}/></div><div className="field"><label>Proteína (g)</label><input className="input" type="number" value={mealForm.protein} onChange={e => setMealForm(f => ({ ...f, protein: Number(e.target.value) }))}/></div></div>
          <div className="grid-2"><div className="field"><label>Carbs (g)</label><input className="input" type="number" value={mealForm.carbs} onChange={e => setMealForm(f => ({ ...f, carbs: Number(e.target.value) }))}/></div><div className="field"><label>Grasas (g)</label><input className="input" type="number" value={mealForm.fat} onChange={e => setMealForm(f => ({ ...f, fat: Number(e.target.value) }))}/></div></div>
          <button className="btn btn-primary" onClick={addMeal}>Guardar comida</button>
        </div>
      </section>}

      <nav className="tabs" aria-label="Navegación">
        <button className={`tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}><span>◉</span>Hoy</button>
        <button className={`tab ${tab === "meals" ? "active" : ""}`} onClick={() => setTab("meals")}><span>＋</span>Comidas</button>
        <button className={`tab ${tab === "recipes" ? "active" : ""}`} onClick={() => setTab("recipes")}><span>✦</span>Recetas</button>
        <button className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}><span>◎</span>Perfil</button>
      </nav>
    </main>
  );
}
