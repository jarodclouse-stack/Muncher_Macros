// api/ai-describe.js
// Modern AI-Native Meal Perception Logic

import { setCors, handlePreflight } from './_lib/cors.js';
import { validateText, readBody } from './_lib/validate.js';
import { rateLimit } from './_lib/rate-limit.js';
import { requireAuth } from './_lib/auth.js';

function extractJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const oStart = clean.indexOf('{'), oEnd = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return JSON.parse(clean.slice(oStart, oEnd + 1)); } catch {}
  }
  const aStart = clean.indexOf('['), aEnd = clean.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) {
    try { return JSON.parse(clean.slice(aStart, aEnd + 1)); } catch {}
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

function parseNum(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalizeResult(f) {
  const p = Math.round(parseNum(f.p != null ? f.p : f.protein) * 10) / 10;
  const sugars = Math.round(parseNum(f.sugars != null ? f.sugars : f.sugar) * 10) / 10;
  const fb = Math.round(parseNum(f.fb != null ? f.fb : (f.fiber != null ? f.fiber : f.Fiber)) * 10) / 10;
  
  let c = Math.round(parseNum(f.c != null ? f.c : (f.carbs != null ? f.carbs : f.carbohydrates)) * 10) / 10;
  // Enforce Carbohydrates >= sugars + fiber
  if (c < sugars + fb) {
    c = Math.round((sugars + fb) * 10) / 10;
  }

  const fat = Math.round(parseNum(f.f != null ? f.f : f.fat) * 10) / 10;
  
  // Calculate macro-based calories
  let cal = Math.round(p * 4 + c * 4 + fat * 9);
  
  // Self-Healing Macro Reconstructor
  if (cal === 0) {
    const rawCal = Math.round(parseNum(f.cal != null ? f.cal : f.calories));
    if (rawCal > 0) {
      // Set carbs to explain calories, e.g. for sugary/fat-free drinks/beverages
      c = Math.round((rawCal / 4) * 10) / 10;
      cal = rawCal;
    }
  }

  // Safely extract portions
  const baseQty = Number(f.sQty || f.qty || f.quantity || 1);
  const count = Number(f.detectedCount || 1);
  const sUnit = String(f.sUnit || f.unit || 'piece');

  // Compute total portion across the deconstructed/multi-unit meal
  const totalQty = count * baseQty;

  // Base serving description MUST strictly represent 1 unit of sUnit (or baseQty)
  // so the client-side computeMultiplier multiplies by totalQty / baseQty.
  const serving = f.sUnit || f.unit ? `${baseQty} ${f.sUnit || f.unit}` : (f.serving || '1 serving');

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(serving),
    sQty: baseQty,
    sUnit: sUnit,
    cal,
    p,
    c,
    f: fat,
    fb,
    sat: Math.round(parseNum(f.sat) * 10) / 10,
    trans: Math.round(parseNum(f.trans) * 10) / 10,
    mono: Math.round(parseNum(f.mono) * 10) / 10,
    poly: Math.round(parseNum(f.poly) * 10) / 10,
    chol: Math.round(parseNum(f.chol || f.cholesterol)),
    sugars,
    Sodium: Math.round(parseNum(f.Sodium || f.sodium)),
    Potassium: Math.round(parseNum(f.Potassium || f.potassium)),
    Calcium: Math.round(parseNum(f.Calcium || f.calcium)),
    Iron: Math.round(parseNum(f.Iron || f.iron) * 10) / 10,
    'Vitamin C': Math.round(parseNum(f['Vitamin C'] || f.vitamin_c) * 10) / 10,
    'Vitamin A': Math.round(parseNum(f['Vitamin A'] || f.vitamin_a)),
    'Vitamin D': Math.round(parseNum(f['Vitamin D'] || f.vitamin_d) * 10) / 10,
    'Vitamin B1': Math.round(parseNum(f['Vitamin B1'] || f.vitamin_b1) * 100) / 100,
    'Vitamin B2': Math.round(parseNum(f['Vitamin B2'] || f.vitamin_b2) * 100) / 100,
    'Vitamin B3': Math.round(parseNum(f['Vitamin B3'] || f.vitamin_b3) * 100) / 100,
    'Vitamin B5': Math.round(parseNum(f['Vitamin B5'] || f.vitamin_b5) * 100) / 100,
    'Vitamin B6': Math.round(parseNum(f['Vitamin B6'] || f.vitamin_b6) * 100) / 100,
    'Vitamin B7': Math.round(parseNum(f['Vitamin B7'] || f.vitamin_b7) * 100) / 100,
    'Vitamin B9': Math.round(parseNum(f['Vitamin B9'] || f.vitamin_b9) * 100) / 100,
    'Vitamin B12': Math.round(parseNum(f['Vitamin B12'] || f.vitamin_b12) * 100) / 100,
    'Vitamin E': Math.round(parseNum(f['Vitamin E'] || f.vitamin_e) * 10) / 10,
    'Vitamin K': Math.round(parseNum(f['Vitamin K'] || f.vitamin_k) * 10) / 10,
    Magnesium: Math.round(parseNum(f.Magnesium || f.magnesium)),
    Phosphorus: Math.round(parseNum(f.Phosphorus || f.phosphorus)),
    Zinc: Math.round(parseNum(f.Zinc || f.zinc) * 10) / 10,
    Copper: Math.round(parseNum(f.Copper || f.copper) * 1000) / 1000,
    Manganese: Math.round(parseNum(f.Manganese || f.manganese) * 100) / 100,
    Selenium: Math.round(parseNum(f.Selenium || f.selenium) * 10) / 10,
    Chloride: Math.round(parseNum(f.Chloride || f.chloride)),
    Iodine: Math.round(parseNum(f.Iodine || f.iodine) * 10) / 10,
    Chromium: Math.round(parseNum(f.Chromium || f.chromium) * 10) / 10,
    Molybdenum: Math.round(parseNum(f.Molybdenum || f.molybdenum) * 10) / 10,
    Fluoride: Math.round(parseNum(f.Fluoride || f.fluoride) * 10) / 10,
    Fiber: fb,
    'Soluble Fiber': Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    'Insoluble Fiber': Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    solubleFiber: Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    insolubleFiber: Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    category: String(f.category || 'unknown'),
    confidence: String(f.confidence || 'high'),
    nutriscore_grade: f.nutriscore_grade ? String(f.nutriscore_grade).toLowerCase().trim() : undefined,
    nutrient_levels: typeof f.nutrient_levels === 'object' && f.nutrient_levels ? {
      fat: f.nutrient_levels.fat ? String(f.nutrient_levels.fat).toLowerCase().trim() : undefined,
      'saturated-fat': (f.nutrient_levels['saturated-fat'] || f.nutrient_levels.saturatedFat) ? String(f.nutrient_levels['saturated-fat'] || f.nutrient_levels.saturatedFat).toLowerCase().trim() : undefined,
      sugars: f.nutrient_levels.sugars ? String(f.nutrient_levels.sugars).toLowerCase().trim() : undefined,
      salt: f.nutrient_levels.salt ? String(f.nutrient_levels.salt).toLowerCase().trim() : undefined,
    } : undefined,
    nutrient_percentages: typeof f.nutrient_percentages === 'object' && f.nutrient_percentages ? {
      fat: f.nutrient_percentages.fat !== undefined ? Number(f.nutrient_percentages.fat) : undefined,
      'saturated-fat': (f.nutrient_percentages['saturated-fat'] || f.nutrient_percentages.saturatedFat) !== undefined ? Number(f.nutrient_percentages['saturated-fat'] || f.nutrient_percentages.saturatedFat) : undefined,
      sugars: f.nutrient_percentages.sugars !== undefined ? Number(f.nutrient_percentages.sugars) : undefined,
      salt: f.nutrient_percentages.salt !== undefined ? Number(f.nutrient_percentages.salt) : undefined,
    } : undefined,
    _src: f._src || 'ai',
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: fb,
    sugar: sugars,
    sodium: Math.round(parseNum(f.Sodium || f.sodium)),
    potassium: Math.round(parseNum(f.Potassium || f.potassium)),
    cholesterol: Math.round(parseNum(f.chol || f.cholesterol)),
    saturatedFat: Math.round(parseNum(f.sat || f.saturatedFat) * 10) / 10,
    monounsaturatedFat: Math.round(parseNum(f.mono || f.monounsaturatedFat) * 10) / 10,
    polyunsaturatedFat: Math.round(parseNum(f.poly || f.polyunsaturatedFat) * 10) / 10,
    chloride: Math.round(parseNum(f.Chloride || f.chloride)),
    iodine: Math.round(parseNum(f.Iodine || f.iodine) * 10) / 10,
    chromium: Math.round(parseNum(f.Chromium || f.chromium) * 10) / 10,
    molybdenum: Math.round(parseNum(f.Molybdenum || f.molybdenum) * 10) / 10,
    fluoride: Math.round(parseNum(f.Fluoride || f.fluoride) * 10) / 10,
    solubleFiber: Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    insolubleFiber: Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    stagedQty: String(totalQty),
    stagedUnit: sUnit
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

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
   - When ingredients are toppings, fillings, or condiments inherited from a main dish count (e.g., lettuce, cheese, salsa, guacamole, or sour cream on 3 tacos), you MUST use small, realistic minor units (e.g., "tbsp", "tsp", "pinch") and fractional portions rather than large generic ounces (e.g. "oz") or massive standard pieces.
   - For example, toppings like shredded lettuce, cheese, or salsa on a single taco should be represented as "1 tbsp", "2 tbsp", or fractional ounces like "0.25 oz" (NEVER represent lettuce as "3 oz" or "1 cup", which results in overwhelming totals when multiplied by taco counts).
   - Adjust the single-unit portion size ("sQty" and "sUnit") to represent the realistic amount on exactly ONE single item, not the whole meal.
   - Ensure the calorie and nutrient estimates in Step 7 match this single-item minor portion size exactly (e.g., salsa: 4 kcal per 1 tbsp serving, lettuce: 1 kcal per 1 tbsp serving, cheddar cheese: 28 kcal per 1 tbsp / 0.25 oz serving).
   - This ensures that toppings on multi-item dishes (like 3 tacos) are scaled correctly by the app and do not result in absurdly high volumes like "3 oz of lettuce on 3 tacos".

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

1. BRANDED & COMMERCIAL PRODUCTS: For widely known commercial products (e.g. "Pepsi", "Coca-Cola", "Oreo", "Big Mac"), you MUST use their exact, real-world manufacturer nutrition label facts. A standard 12 fl oz (355ml) regular Pepsi has exactly 150 kcal, 41g carbohydrates (all sugars), 0g protein, and 0g fat. Regular Coca-Cola has 140 kcal, 39g carbs. Do not guess or hallucinate generic or blank numbers (like 0g carbs for regular Pepsi) for standard commercial items.
2. TOTAL CARBOHYDRATES RULE: The "c" (carbs) key represents TOTAL carbohydrates. Total carbohydrates MUST include all simple sugars ("sugars") and dietary fiber ("fb"). Therefore, it is a mathematical requirement that: c >= sugars + fb. For example, if a beverage has 41g of sugars, its "c" value MUST be at least 41g. Never set "c" to 0 if "sugars" is non-zero.
3. MACRO-CALORIE ALIGNMENT: Stated calories ("cal") must be mathematically aligned with the macronutrients: cal = p * 4 + c * 4 + f * 9. Stating a positive calorie count (like 150 kcal) while setting all macros (protein, carbs, fat) to 0 is an extreme error. If a food has calories, it MUST have the corresponding macros that produce those calories.
4. MICRONUTRIENT MANDATE (Rule 13): You MUST estimate and populate every micronutrient and trace mineral below. Do NOT leave them as 0 unless the value is truly negligible (e.g. selenium in Coke). Use USDA/NCCDB data.
5. CONTRADICTION PREVENTION (Rule 14):
  - Diet/zero-sugar drinks: sugars ≈ 0, cal ≈ 0–5. Violating this is an error.
  - Black coffee: no milk fat, no sugar. cal ≈ 5.
6. NUTRI-SCORE & NUTRIENT LEVELS: Estimate the product's Nutri-Score grade ('a', 'b', 'c', 'd', or 'e') and nutrient levels (qualitative level 'low', 'moderate', or 'high' for fat, saturated-fat, sugars, and salt) based on the calculated nutritional density per 100g of the food:
   - Nutri-Score: 'a' or 'b' for fresh raw vegetables, fruits, whole grains, water. 'c' for standard meats, mixed meals with reasonable balance. 'd' or 'e' for high-sugar, high-saturated-fat, or high-salt processed foods (e.g. regular soda, donuts, potato chips).
   - Nutrient Levels per 100g:
     * fat: low (<3g), moderate (3g - 17.5g), high (>17.5g)
     * saturated-fat: low (<1.5g), moderate (1.5g - 5g), high (>5g)
     * sugars: low (<5g), moderate (5g - 22.5g), high (>22.5g)
     * salt: low (<0.3g / <120mg sodium), moderate (0.3g - 1.5g / 120mg - 600mg sodium), high (>1.5g / >600mg sodium)
   - Also calculate/estimate the exact nutrient percentages (weight percentage of that nutrient per 100g of the food) for: fat, saturated-fat, sugars, and salt (where salt percentage = sodium per 100g in mg * 2.5 / 1000). e.g., a food with 30g sugar per 100g has 30% sugars.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY a single raw JSON object. Do not wrap in markdown fences or include introductory text.
The JSON object MUST follow this structure exactly:

{
  "totalServingQty": number (estimate the overall combined physical volume/weight of the entire meal/plate combined, e.g. 4, 500, 2),
  "totalServingUnit": "cups|slices|tacos|g|ml|pieces|bowls|plates" (the physical unit for the entire meal combined. Avoid generic "meal" or "serving" alone unless no physical unit applies; if "meal" is used, you MUST define a physical equivalent, e.g. quantity 4, unit "cups"),
  "foods": [
    {
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
      "Chromium": number, "Molybdenum": number, "Fluoride": number, "Fiber": number, "Soluble Fiber": number, "Insoluble Fiber": number,
      "nutriscore_grade": "a|b|c|d|e",
      "nutrient_levels": {
        "fat": "low|moderate|high",
        "saturated-fat": "low|moderate|high",
        "sugars": "low|moderate|high",
        "salt": "low|moderate|high"
      },
      "nutrient_percentages": {
        "fat": number,
        "saturated-fat": number,
        "sugars": number,
        "salt": number
      }
    }
  ]
}

CRITICAL REMINDERS:
- cal = calories for ONE unit. detectedCount is the multiplier the app applies.
- Calorie formula: P*4 + C*4 + F*9. Always verify.
- beverages and desserts: NEVER inherit main dish quantity unless explicitly numbered.
- diet/zero-sugar drinks: sugars = 0, cal ≈ 0–5.
- Return ONLY raw JSON. No markdown fences, no explanation text.`;

  try {
    const aiResults = await anthropicJson(prompt, apiKey);
    console.log('AI Describe Result:', JSON.stringify(aiResults));
    
    let finalFoods = [];
    let totalServingQty = 1;
    let totalServingUnit = 'meal';
    
    if (aiResults && typeof aiResults === 'object' && !Array.isArray(aiResults)) {
      const foodsArray = Array.isArray(aiResults.foods) ? aiResults.foods : [];
      finalFoods = foodsArray.map(f => normalizeResult(f));
      totalServingQty = Number(aiResults.totalServingQty || 1);
      totalServingUnit = String(aiResults.totalServingUnit || 'meal');
    } else if (Array.isArray(aiResults)) {
      finalFoods = aiResults.map(f => normalizeResult(f));
    }
    
    return res.status(200).json({ 
      foods: finalFoods, 
      meal,
      totalServingQty,
      totalServingUnit
    });
  } catch (e) {
    console.error('AI Describe Error:', e);
    return res.status(500).json({ error: 'Could not analyze meal: ' + e.message });
  }
}
