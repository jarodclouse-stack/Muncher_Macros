const LABEL_PROMPT = `Extract ALL nutrition data from this image (Nutrition Facts or Supplement Facts).
Return ONLY a valid JSON object. 
Requirements:
1. Handle images at any angle. If text is inverted or rotated, re-orient it mentally to extract data.
2. Recognition: Look for 'Nutrition Facts', 'Supplement Facts', or 'Nutritional Information'.
3. Keys: name, brand, serving, sUnit (g, oz, cup, tbsp, tsp, piece, slice, whole, medium, scoop, serving), sQty (number), cal (use 0 for supplements if calories aren't listed), p (protein g), c (carbs g), f (fat g), fb (fiber g), sugars (g), chol (dietary cholesterol mg), sat (saturated fat g), trans (trans fat g), mono (g), poly (g), Sodium (mg), Potassium (mg), Magnesium (mg), Calcium (mg), Iron (mg), Zinc (mg), and any other vitamins/minerals found.
4. For numeric fields, return only the number. If not found, use 0.
5. For 'name', provide a descriptive name for the food.
6. For 'ingredients', extract the ingredients list if visible.
7. Ensure the JSON is flat and minified. 
No conversational text, only the raw JSON string starting with { and ending with }.`;

const BARCODE_PROMPT = `Analyze the barcode or QR code in this image.
1. Primary Goal: Extract the numerical digits (0-9) printed below/near the bars or within the code.
2. Secondary Goal: If you see a product name or brand near the code, mention it in parentheses after the code (e.g. "012345678901 (Brand Name)").
3. Special: If you see a QR code content that looks like a product ID or SmartLabel URL, extract the ID.
Return ONLY the raw result. If nothing is found, return "FAILED".
No conversational text.`;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Read Type
  const { searchParams } = new URL(req.url, 'http://localhost');
  const type = searchParams.get('type') || 'label'; // default to label

  const body = await readBody(req);
  const { base64, mediaType } = body || {};
  if (!base64) return res.status(400).json({ error: 'Missing base64 image' });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const prompt = type === 'barcode' ? BARCODE_PROMPT : LABEL_PROMPT;
  const mtype = mediaType || 'image/jpeg';

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: type === 'barcode' ? 1024 : 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mtype, data: base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: 'AI Vision Error (' + anthropicRes.status + ')', detail });
    }

    const data = await anthropicRes.json();
    let rawText = (data?.content?.[0]?.text || '').trim();
    
    if (type === 'barcode') {
       // Barcode extraction
       let digits = rawText.replace(/[^\d]/g, '');
       if (!digits || digits.length < 5) return res.status(404).json({ error: 'No barcode digits found' });
       return res.status(200).json({ code: digits });
    } else {
       // Nutrition Label extraction
       if (rawText.includes('```')) {
         rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
       }
       let food;
       try { food = JSON.parse(rawText); }
       catch (e) { return res.status(502).json({ error: 'Invalid JSON from AI', raw: rawText }); }
       return res.status(200).json({ food });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
