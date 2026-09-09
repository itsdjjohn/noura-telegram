export type ParsedMeal = {
  items: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
  matches: Array<{ name: string; quantity: number; unit: string }>;
};

type Food = {
  aliases: string[];
  name: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const FOODS: Food[] = [
  { name: "Huevo", aliases: ["huevo", "huevos"], unit: "unidad", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: "Clara de huevo", aliases: ["clara", "claras"], unit: "unidad", calories: 17, protein: 3.6, carbs: 0.2, fat: 0 },
  { name: "Pechuga de pollo", aliases: ["pollo", "pechuga", "pechuga de pollo"], unit: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Arroz cocido", aliases: ["arroz", "arroz blanco"], unit: "taza", calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { name: "Carne de res", aliases: ["carne", "res", "bistec", "steak"], unit: "100 g", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Salmón", aliases: ["salmon", "salmón"], unit: "100 g", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Atún", aliases: ["atun", "atún"], unit: "lata", calories: 130, protein: 29, carbs: 0, fat: 1 },
  { name: "Pan integral", aliases: ["pan", "tostada", "tostadas", "pan integral"], unit: "rebanada", calories: 80, protein: 4, carbs: 14, fat: 1 },
  { name: "Avena", aliases: ["avena"], unit: "1/2 taza", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Yogurt griego", aliases: ["yogurt", "yogur", "yogurt griego"], unit: "porción", calories: 120, protein: 17, carbs: 7, fat: 0 },
  { name: "Banano", aliases: ["banana", "banano", "platano", "plátano"], unit: "unidad", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { name: "Aguacate", aliases: ["aguacate"], unit: "1/2 unidad", calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Papa", aliases: ["papa", "papas", "patata"], unit: "mediana", calories: 160, protein: 4, carbs: 37, fat: 0.2 },
  { name: "Pasta cocida", aliases: ["pasta", "spaghetti", "espagueti"], unit: "taza", calories: 220, protein: 8, carbs: 43, fat: 1.3 },
  { name: "Queso", aliases: ["queso"], unit: "30 g", calories: 110, protein: 7, carbs: 1, fat: 9 },
  { name: "Leche", aliases: ["leche"], unit: "taza", calories: 120, protein: 8, carbs: 12, fat: 5 },
  { name: "Whey protein", aliases: ["whey", "proteina", "proteína", "scoop"], unit: "scoop", calories: 120, protein: 24, carbs: 3, fat: 2 },
  { name: "Frijoles", aliases: ["frijol", "frijoles", "beans"], unit: "1/2 taza", calories: 115, protein: 8, carbs: 20, fat: 0.5 },
  { name: "Tortilla", aliases: ["tortilla", "tortillas"], unit: "unidad", calories: 120, protein: 3, carbs: 20, fat: 3 },
  { name: "Manzana", aliases: ["manzana"], unit: "unidad", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Fresas", aliases: ["fresa", "fresas", "strawberry", "strawberries"], unit: "taza", calories: 50, protein: 1, carbs: 12, fat: 0.5 },
  { name: "Aceite de oliva", aliases: ["aceite", "aceite de oliva"], unit: "cda", calories: 119, protein: 0, carbs: 0, fat: 13.5 },
];

const WORD_NUMBERS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function quantityBefore(text: string, alias: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const numeric = text.match(new RegExp(`(?:^|\\s)(\\d+(?:[.,]\\d+)?)\\s*(?:x\\s*)?${escaped}`));
  if (numeric) return Math.max(0.25, Number(numeric[1].replace(",", ".")) || 1);
  const words = Object.keys(WORD_NUMBERS).join("|");
  const word = text.match(new RegExp(`(?:^|\\s)(${words})\\s+${escaped}`));
  if (word) return WORD_NUMBERS[word[1]] || 1;
  return 1;
}

export function parseMealText(input: string): ParsedMeal {
  const text = normalize(input);
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  const matches: ParsedMeal["matches"] = [];
  const used = new Set<string>();

  for (const food of FOODS) {
    const alias = food.aliases.map(normalize).sort((a,b)=>b.length-a.length).find(a => text.includes(a));
    if (!alias || used.has(food.name)) continue;
    const quantity = quantityBefore(text, alias);
    calories += food.calories * quantity;
    protein += food.protein * quantity;
    carbs += food.carbs * quantity;
    fat += food.fat * quantity;
    matches.push({ name: food.name, quantity, unit: food.unit });
    used.add(food.name);
  }

  const confidence: ParsedMeal["confidence"] = matches.length >= 3 ? "high" : matches.length >= 1 ? "medium" : "low";
  return {
    items: input.trim(),
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    confidence,
    matches,
  };
}
