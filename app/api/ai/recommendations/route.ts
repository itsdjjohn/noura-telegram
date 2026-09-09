import { NextRequest, NextResponse } from "next/server";
import { generateNouraText } from "@/lib/noura-ai";

type Payload = {
  profile?: { goal?: string; calories?: number; protein?: number; carbs?: number; fat?: number };
  today?: { calories?: number; protein?: number; carbs?: number; fat?: number; water?: number; mealCount?: number };
  whoop?: { connected?: boolean; recovery?: number | null; sleep?: number | null; strain?: number | null; hrv?: number | null };
};

function fallback(p: Payload) {
  const profile = p.profile || {};
  const today = p.today || {};
  const whoop = p.whoop || {};
  const remainingProtein = Math.max(0, Number(profile.protein || 0) - Number(today.protein || 0));
  const remainingCalories = Math.max(0, Number(profile.calories || 0) - Number(today.calories || 0));
  const tips: string[] = [];
  if ((today.mealCount || 0) === 0) tips.push("Empieza registrando tu primera comida para que NOURA tenga contexto real del día.");
  if ((today.water || 0) < 1000) tips.push("Tu hidratación va baja: suma 500–750 ml de agua de forma progresiva durante las próximas horas.");
  if (remainingProtein > 40) tips.push(`Prioriza una comida con 35–50 g de proteína; todavía te faltan aproximadamente ${remainingProtein} g para tu objetivo.`);
  if (whoop.connected && (whoop.recovery ?? 100) < 34) tips.push("Recovery bajo: mantén el día simple, cubre energía y proteína, hidrátate bien y evita compensar con restricciones agresivas.");
  else if (whoop.connected && (whoop.strain ?? 0) >= 14) tips.push(`Strain alto: te quedan cerca de ${remainingCalories} kcal; una comida completa con carbohidratos y proteína puede apoyar mejor tu recuperación.`);
  if (!tips.length) tips.push("Tu día va equilibrado. Mantén hidratación, completa tus macros sin forzarlos y prioriza una cena que te deje cómodo para dormir.");
  return { source: "local", headline: "Tu enfoque de hoy", summary: tips[0], actions: tips.slice(0, 4), note: "Recomendación de bienestar general, no sustituye atención médica o nutricional profesional." };
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Payload;
  const prompt = `Eres NOURA Coach, un asistente de bienestar, nutrición cotidiana y rendimiento. Responde en español. Usa SOLO los datos proporcionados. No diagnostiques enfermedades, no recomiendes medicamentos ni hagas afirmaciones clínicas. Sé concreto, práctico y no alarmista. Devuelve JSON válido con exactamente estas claves: headline (string), summary (string), actions (array de 3 a 4 strings), note (string).\n\nDatos del usuario hoy:\n${JSON.stringify(payload)}`;

  try {
    const generated = await generateNouraText(prompt, 500);
    if (!generated) return NextResponse.json(fallback(payload));
    const clean = generated.text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({
      source: "ai",
      provider: generated.provider,
      model: generated.model,
      headline: String(parsed.headline || "Tu enfoque de hoy"),
      summary: String(parsed.summary || ""),
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 4).map(String) : [],
      note: String(parsed.note || "Recomendación de bienestar general."),
    });
  } catch (error) {
    console.error("NOURA AI recommendation failed", error);
    return NextResponse.json(fallback(payload));
  }
}
