// api/ai-describe.js
// Modern AI-Native Meal Perception Logic

import { setCors, handlePreflight } from './_lib/cors.js';
import { validateText, readBody } from './_lib/validate.js';
import { rateLimit } from './_lib/rate-limit.js';

function extractJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const aStart = clean.indexOf('['), aEnd = clean.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) {
    try { return JSON.parse(clean.slice(aStart, aEnd + 1)); } catch {}
  }
  const oStart = clean.indexOf('{'), oEnd = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return [JSON.parse(clean.slice(oStart, oEnd + 1))]; } catch {}
  }
  return null;
}

const MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20241022',
  'claude-haiku-4-5-20241001',
];

import https from 'https';

async function anthropicJson(prompt, apiKey, maxTokens = 4000) {
  let lastError = 'Initialization error';
  
  for (const model of MODELS) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.request('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }, (res) => {
          let str = '';
          res.on('data', chunk => str += chunk);
          res.on('end', () => {
            try {
              const body = JSON.parse(str);
              if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
              else reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
            } catch (e) {
              reject(new Error('Invalid JSON from AI'));
            }
          });
        });
        req.on('error', reject);
        req.write(JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        }));
        req.end();
      });

      const content = data?.content?.[0]?.text || '';
      const parsed = extractJSON(content);
      if (parsed) return parsed;
      lastError = 'Invalid JSON structure in AI response';
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(lastError);
}

function normalizeResult(f) {
  const p = Math.round((Number(f.p) || 0) * 10) / 10;
  const c = Math.round((Number(f.c) || 0) * 10) / 10;
  const fat = Math.round((Number(f.f) || 0) * 10) / 10;
  
  // Enforce Macro Integrity
  const cal = Math.round(p * 4 + c * 4 + fat * 9);

  // Safely extract portions
  const baseQty = Number(f.sQty || f.qty || f.quantity || 1);
  const count = Number(f.detectedCount || 1);
  const sUnit = String(f.sUnit || f.unit || 'piece');

  // Compute total portion across the deconstructed/multi-unit meal
  const totalQty = count * baseQty;

  // Base serving description MUST strictly represent 1 unit of sUnit (or baseQty)
  // so the client-side computeMultiplier multiplies by totalQty / baseQty.
  const serving = f.sUnit || f.unit ? `1 ${f.sUnit || f.unit}` : (f.serving || '1 serving');

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(serving),
    sQty: baseQty,
    sUnit: sUnit,
    cal,
    p,
    c,
    f: fat,
    fb: Math.round((Number(f.fb || f.Fiber || f.fiber) || 0) * 10) / 10,
    sat: Math.round((Number(f.sat) || 0) * 10) / 10,
    trans: Math.round((Number(f.trans) || 0) * 10) / 10,
    mono: Math.round((Number(f.mono) || 0) * 10) / 10,
    poly: Math.round((Number(f.poly) || 0) * 10) / 10,
    chol: Math.round(Number(f.chol) || 0),
    sugars: Math.round((Number(f.sugars) || 0) * 10) / 10,
    Sodium: Math.round(Number(f.Sodium) || 0),
    Potassium: Math.round(Number(f.Potassium) || 0),
    Calcium: Math.round(Number(f.Calcium) || 0),
    Iron: Math.round((Number(f.Iron) || 0) * 10) / 10,
    'Vitamin C': Math.round((Number(f['Vitamin C']) || 0) * 10) / 10,
    'Vitamin A': Math.round(Number(f['Vitamin A']) || 0),
    'Vitamin D': Math.round((Number(f['Vitamin D']) || 0) * 10) / 10,
    'Vitamin B1': Math.round((Number(f['Vitamin B1']) || 0) * 100) / 100,
    'Vitamin B2': Math.round((Number(f['Vitamin B2']) || 0) * 100) / 100,
    'Vitamin B3': Math.round((Number(f['Vitamin B3']) || 0) * 100) / 100,
    'Vitamin B5': Math.round((Number(f['Vitamin B5']) || 0) * 100) / 100,
    'Vitamin B6': Math.round((Number(f['Vitamin B6']) || 0) * 100) / 100,
    'Vitamin B7': Math.round((Number(f['Vitamin B7']) || 0) * 100) / 100,
    'Vitamin B9': Math.round((Number(f['Vitamin B9']) || 0) * 100) / 100,
    'Vitamin B12': Math.round((Number(f['Vitamin B12']) || 0) * 100) / 100,
    'Vitamin E': Math.round((Number(f['Vitamin E']) || 0) * 10) / 10,
    'Vitamin K': Math.round((Number(f['Vitamin K']) || 0) * 10) / 10,
    Magnesium: Math.round(Number(f.Magnesium) || 0),
    Phosphorus: Math.round(Number(f.Phosphorus) || 0),
    Zinc: Math.round((Number(f.Zinc) || 0) * 10) / 10,
    Copper: Math.round((Number(f.Copper) || 0) * 1000) / 1000,
    Manganese: Math.round((Number(f.Manganese) || 0) * 100) / 100,
    Selenium: Math.round((Number(f.Selenium) || 0) * 10) / 10,
    Chloride: Math.round(Number(f.Chloride) || 0),
    Iodine: Math.round((Number(f.Iodine) || 0) * 10) / 10,
    Chromium: Math.round((Number(f.Chromium) || 0) * 10) / 10,
    Molybdenum: Math.round((Number(f.Molybdenum) || 0) * 10) / 10,
    Fluoride: Math.round((Number(f.Fluoride) || 0) * 10) / 10,
    Fiber: Math.round((Number(f.Fiber || f.fb || f.fiber) || 0) * 10) / 10,
    'Soluble Fiber': Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    'Insoluble Fiber': Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    solubleFiber: Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    insolubleFiber: Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    category: String(f.category || 'unknown'),
    confidence: String(f.confidence || 'high'),
    _src: f._src || 'ai',
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: Math.round((Number(f.fb || f.Fiber || f.fiber) || 0) * 10) / 10,
    sugar: Math.round((Number(f.sugars) || 0) * 10) / 10,
    sodium: Math.round(Number(f.Sodium) || 0),
    potassium: Math.round(Number(f.Potassium) || 0),
    cholesterol: Math.round(Number(f.chol) || 0),
    saturatedFat: Math.round((Number(f.sat) || 0) * 10) / 10,
    monounsaturatedFat: Math.round((Number(f.mono) || 0) * 10) / 10,
    polyunsaturatedFat: Math.round((Number(f.poly) || 0) * 10) / 10,
    chloride: Math.round(Number(f.Chloride) || 0),
    iodine: Math.round((Number(f.Iodine) || 0) * 10) / 10,
    chromium: Math.round((Number(f.Chromium) || 0) * 10) / 10,
    molybdenum: Math.round((Number(f.Molybdenum) || 0) * 10) / 10,
    fluoride: Math.round((Number(f.Fluoride) || 0) * 10) / 10,
    solubleFiber: Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    insolubleFiber: Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    stagedQty: String(totalQty),
    stagedUnit: sUnit
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res)) return;

  const body = await readBody(req);
  const description = validateText(body.description);
  const meal = body.meal || 'Snacks';

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  console.log(`AI Describe: key=${apiKey ? 'configured' : 'MISSING'} model=${MODELS[0]}`);

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const prompt = `You are a world-class nutrition scientist and food parsing engine.

Meal description: "${description}"

Parse this meal description into individual food components using the rules below. Return ONLY a JSON array — no markdown fences, no commentary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CANONICALIZATION (Rule 16)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before parsing, normalize the input:
- Fix typos: "browmie" → brownie, "carne asadaa" → carne asada
- Normalize brand aliases: "coke zero" → Coca-Cola Zero Sugar, "chik fil a" → Chick-fil-A, "micky d's" → McDonald's
- Normalize capitalization and spacing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — FOOD ONTOLOGY CLASSIFICATION (Rule 15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify every identified component into one of these categories:
  protein | grain | vegetable | fruit | dairy | sauce | topping | side | beverage | dessert | condiment | snack | other

These categories DIRECTLY control quantity inheritance in Step 3.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — QUANTITY PARSING (Rules 1–4, 11, 17)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Determine detectedCount for every component. Follow this decision tree:

A) EXPLICIT COUNT — always takes priority.
   "2 eggs" → 2. "3 slices toast" → 3. "a brownie" or "one brownie" → 1.

B) TOPPING / FILLING INHERITANCE — applies when the meal uses "with" or "topped with":
   When "X [dish] with [ingredients]", toppings/fillings/sauces inherit X.
   - "3 tacos with lettuce, salsa, cheese" → tortilla=3, carne asada=3, lettuce=3, salsa=3, cheese=3
   - "2 bagels with cream cheese" → bagel=2, cream cheese=2
   - "2 slices pizza with pepperoni" → pizza slices=2, pepperoni=2
   - "2 sandwiches with mayo" → sandwich=2, mayo=2
   INHERITANCE only applies to categories: topping, sauce, condiment, filling, protein, grain, vegetable, dairy
   INHERITANCE never applies to: beverage, dessert, side, snack
   
   CRITICAL TOPPING PORTION SCALING RULE:
   - When ingredients are toppings/fillings inherited from a main dish count (e.g. 3 tacos), adjust the unit portion size ("sQty" and "sUnit") to represent the amount on exactly ONE single item, not the whole meal.
   - For example: ground beef on a single taco should be 0.5 oz or 1 oz (NOT 3 oz), and cheese should be 0.25 oz or 0.5 oz.
   - Ensure the calorie and nutrient estimates in Step 7 match this single-item portion size exactly (e.g., ground beef: 35 kcal per 0.5 oz serving, or 70 kcal per 1 oz serving).
   - This prevents the final scaled totals from being overwhelmingly large when multiplied by the inherited count.

C) STANDALONE / SIDE ITEMS — never inherit the main dish quantity.
   Listed after a comma OR clearly a separate food type (dessert, drink, side dish).
   "3 tacos, rice, beans, Coke" → tacos=3, rice=1, beans=1, Coke=1
   "3 tacos with salsa and a brownie" → tacos+salsa=3, brownie=1
   "2 burgers and fries" → burgers=2, fries=1
   "2 burgers with cheese" → burgers=2, cheese=2 (cheese is a topping, not a side)
   RULE: beverages and desserts are ALWAYS standalone quantity=1 unless explicitly "2 brownies" etc.

D) AMBIGUOUS — if you cannot determine the relationship, default to quantity 1 (Rule 17 safety).

E) MULTI-FOOD INDEPENDENT TRACKING (Rule 11):
   "2 tacos and 3 enchiladas" → tacos=2, enchiladas=3 (completely independent)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — IMPLICIT INGREDIENTS (Rule 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Infer standard base components from named dishes unless contradicted:
- "carne asada taco" → infer corn tortilla + carne asada (do NOT add lettuce/salsa unless mentioned)
- "cheeseburger" → infer bun + beef patty + cheese slice
- "pepperoni pizza" → infer crust + tomato sauce + mozzarella + pepperoni
- "BLT sandwich" → infer bread + bacon + lettuce + tomato + mayo
DO NOT infer exotic or uncommon additions. Only infer what is virtually always present.
DUPLICATE PREVENTION (Rule 10): If the user already names a component, do NOT add it again as an implicit ingredient.
  "cheeseburger with cheese" → DO NOT double the cheese. It is already included.
  "cheeseburger with extra cheese" → ADD one additional cheese component.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — PORTION & STATE ASSUMPTIONS (Rules 6, 7, 8, 9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COOKED STATE (Rule 7): Assume cooked/ready-to-eat unless "raw" is stated.
  "8 oz chicken" → cooked chicken breast. "1 cup rice" → cooked rice.

RESTAURANT / CHAIN SCALING (Rule 6): If a chain is named, use their known nutrition data.
  "McDonald's fries" ≠ generic fries. "Chipotle burrito" uses Chipotle's portions.
  Restaurant nachos are larger than homemade. Adjust cal accordingly.

BEVERAGE RULES (Rule 8):
  - Coffee does NOT include cream or sugar unless stated.
  - "black coffee" → ~5 cal, no fat, no sugar.
  - "diet Coke" / "Coke Zero" → ~0–5 cal, 0g sugar. NEVER assign sugar calories to diet drinks.
  - Size adjectives scale calories: "large Coke" has more cal than "small Coke".
  - "coffee with cream and sugar" → add dairy and sugar calories.

UNIT HEURISTICS (Rule 9):
  - "bowl pasta" → medium restaurant bowl ~2 cups cooked (~200g)
  - "handful almonds" → ~1 oz (28g)
  - "scoop protein powder" → standard manufacturer serving (~30g, check brand if named)
  - "slice of cake" → standard dessert slice (~100–120g)
  - "glass of milk" → 8 fl oz (240ml)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — CONFIDENCE SCORING (Rule 12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assign a confidence level to each component:
  "high"   → branded food, explicit quantity, well-known item (e.g. "2 eggs", "McDonald's Big Mac")
  "medium" → common food with reasonable estimate (e.g. "chicken taco", "bowl of oatmeal")
  "low"    → vague description, homemade dish, ambiguous portion (e.g. "some chips", "homemade casserole", "bowl")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — NUTRITION ESTIMATION (Rules 13, 14)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each component, estimate nutrition for exactly ONE (1) unit:

MICRONUTRIENT MANDATE (Rule 13): You MUST estimate and populate every micronutrient and trace mineral below.
Do NOT leave them as 0 unless the value is truly negligible (e.g. selenium in Coke). Use USDA/NCCDB data.

CONTRADICTION PREVENTION (Rule 14):
  - Diet/zero-sugar drinks: sugars ≈ 0, cal ≈ 0–5. Violating this is an error.
  - Black coffee: no milk fat, no sugar. cal ≈ 5.
  - Verify: P*4 + C*4 + F*9 ≈ stated cal. Recalculate cal from macros if inconsistent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return a JSON array. Every object must contain ALL keys below. No omissions.

[{
  "name": "specific ingredient name (canonicalized)",
  "category": "protein|grain|vegetable|fruit|dairy|sauce|topping|side|beverage|dessert|condiment|snack|other",
  "confidence": "high|medium|low",
  "detectedCount": number,
  "sUnit": "piece|slice|whole|serving|oz|cup|tbsp|tsp|g|ml",
  "cal": number, "p": number, "c": number, "f": number,
  "fb": number, "sugars": number, "sat": number, "trans": number, "mono": number, "poly": number, "chol": number,
  "Sodium": number, "Potassium": number, "Calcium": number, "Iron": number,
  "Vitamin C": number, "Vitamin A": number, "Vitamin D": number,
  "Vitamin B1": number, "Vitamin B2": number, "Vitamin B3": number, "Vitamin B5": number,
  "Vitamin B6": number, "Vitamin B7": number, "Vitamin B9": number, "Vitamin B12": number,
  "Vitamin E": number, "Vitamin K": number,
  "Magnesium": number, "Phosphorus": number, "Zinc": number, "Copper": number,
  "Manganese": number, "Selenium": number, "Chloride": number, "Iodine": number,
  "Chromium": number, "Molybdenum": number, "Fluoride": number, "Fiber": number, "Soluble Fiber": number, "Insoluble Fiber": number
}]

CRITICAL REMINDERS:
- cal = calories for ONE unit. detectedCount is the multiplier the app applies.
- Calorie formula: P*4 + C*4 + F*9. Always verify.
- beverages and desserts: NEVER inherit main dish quantity unless explicitly numbered.
- diet/zero-sugar drinks: sugars = 0, cal ≈ 0–5.
- Return ONLY raw JSON. No markdown fences, no explanation text.`;

  try {
    const aiResults = await anthropicJson(prompt, apiKey);
    console.log('AI Describe Result:', JSON.stringify(aiResults));
    const finalFoods = (Array.isArray(aiResults) ? aiResults : []).map(f => normalizeResult(f));
    return res.status(200).json({ foods: finalFoods, meal });
  } catch (e) {
    console.error('AI Describe Error:', e);
    return res.status(500).json({ error: 'Could not analyze meal: ' + e.message });
  }
}
