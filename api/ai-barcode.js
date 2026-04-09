// api/ai-barcode.js
const BARCODE_PROMPT = `Look at the barcode in this image. 
Specifically, look at the numerical digits either printed below the bars or anywhere clear.
Return ONLY the numerical digits (0-9). 
If you see multiple sets or check digits, return the most complete string.
If you CANNOT find any numerical digits, return the single word: "FAILED".
No conversational text, only the raw number string or FAILED.`;

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
