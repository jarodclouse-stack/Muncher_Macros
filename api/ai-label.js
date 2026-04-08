// api/ai-label.js
const LABEL_PROMPT = 'Extract ALL nutrition data from this label. Return ONLY a valid JSON object with these exact keys: name, serving, sUnit (g/oz/cup/tbsp/tsp/piece/slice/whole/medium/scoop/serving), sQty (number), cal, p (protein g), c (carbs g), f (fat g), fb (fiber g), chol (dietary cholesterol mg), sat (saturated fat g), trans (trans fat g), "Vitamin C"(mg), "Vitamin B1"(mg), "Vitamin B2"(mg), "Vitamin B3"(mg), "Vitamin B5"(mg), "Vitamin B6"(mg), "Vitamin B7"(mcg), "Vitamin B9"(mcg), "Vitamin B12"(mcg), "Vitamin A"(mcg), "Vitamin D"(mcg), "Vitamin E"(mg), "Vitamin K"(mcg), Calcium(mg), Phosphorus(mg), Magnesium(mg), Sodium(mg), Potassium(mg), Chloride(mg), Iron(mg), Zinc(mg), Copper(mg), Manganese(mg), Selenium(mcg), Iodine(mcg), Chromium(mcg), Molybdenum(mcg), Fluoride(mg), ingredients (string — the full ingredients list text exactly as printed on the label, or empty string if not visible). Use 0 for any numeric field not on the label. Return ONLY the JSON, no markdown.';

module.exports = async function handler(req, res) {
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
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
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
      return res.status(anthropicRes.status).json({ error: 'Anthropic error ' + anthropicRes.status, detail });
    }

    const data = await anthropicRes.json();
    const rawText = (data?.content?.[0]?.text || '')
      .replace(/```json/g, '').replace(/```/g, '').trim();

    let food;
    try { food = JSON.parse(rawText); }
    catch (e) { return res.status(502).json({ error: 'Invalid JSON from AI', raw: rawText }); }

    return res.status(200).json({ food });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
