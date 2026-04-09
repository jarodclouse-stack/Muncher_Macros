// api/ai-label.js
const LABEL_PROMPT = `Extract ALL nutrition data from this nutrition facts label image. 
Return ONLY a valid JSON object. 
Requirements:
1. Keys: name, brand, serving, sUnit (g, oz, cup, tbsp, tsp, piece, slice, whole, medium, scoop, serving), sQty (number), cal, p (protein g), c (carbs g), f (fat g), fb (fiber g), sugars (g), chol (dietary cholesterol mg), sat (saturated fat g), trans (trans fat g), mono (g), poly (g), Sodium (mg), Potassium (mg), Magnesium (mg), Calcium (mg), Iron (mg), Zinc (mg), and any other vitamins/minerals found.
2. For numeric fields, return only the number. If not found, use 0.
3. For 'name', provide a descriptive name for the food.
4. For 'ingredients', extract the ingredients list if visible.
5. Ensure the JSON is flat and minified. 
No conversational text, only the raw JSON string starting with { and ending with }.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64, mediaType } = req.body || {};
  if (!base64) return res.status(400).json({ error: 'Missing base64 image' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

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
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mtype, data: base64 } },
            { type: 'text', text: LABEL_PROMPT }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: 'AI Service Error (' + anthropicRes.status + ')', detail });
    }

    const data = await anthropicRes.json();
    let rawText = (data?.content?.[0]?.text || '').trim();
    
    // Better JSON stripping
    if (rawText.includes('```')) {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let food;
    try { food = JSON.parse(rawText); }
    catch (e) { return res.status(502).json({ error: 'Invalid JSON from AI', raw: rawText }); }

    return res.status(200).json({ food });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
