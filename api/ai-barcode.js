// api/ai-barcode.js
const BARCODE_PROMPT = `Analyze the barcode or QR code in this image.
1. Primary Goal: Extract the numerical digits (0-9) printed below/near the bars or within the code.
2. Secondary Goal: If you see a product name or brand near the code, mention it in parentheses after the code (e.g. "012345678901 (Brand Name)").
3. Special: If you see a QR code content that looks like a product ID or SmartLabel URL, extract the ID.
Return ONLY the raw result. If nothing is found, return "FAILED".
No conversational text.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const { base64, mediaType } = body || {};
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
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mtype, data: base64 } },
            { type: 'text', text: BARCODE_PROMPT }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: 'AI Service Error (' + anthropicRes.status + ')', detail });
    }

    const data = await anthropicRes.json();
    let digits = (data?.content?.[0]?.text || '').trim();
    
    // Cleanup any accidental text
    digits = digits.replace(/[^\d]/g, '');

    if (!digits || digits.length < 5) {
      return res.status(404).json({ error: 'No barcode digits found' });
    }

    return res.status(200).json({ code: digits });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
