// api/ai-barcode.js
// RESTORED: Dedicated Barcode OCR Logic (v7.1 Hardened)

const BARCODE_PROMPT = `Analyze this image and find the product barcode (typically a series of black and white lines with numbers below).
Return ONLY the raw digit sequence (UPC/EAN). No spaces or dashes.
If NO barcode is found, return the text: "NO_BARCODE_DETECTED".
Return ONLY the digits or the failure phrase. No markdown or conversational text.`;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      try { resolve(JSON.parse(buffer.toString())); } 
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);
  const { base64, mediaType } = body;
  
  if (!base64) return res.status(400).json({ error: 'Missing base64 image' });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel' });
  }

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
      return res.status(anthropicRes.status).json({ 
        error: `AI Service Error (${anthropicRes.status})`, 
        detail: detail.slice(0, 200) 
      });
    }

    const data = await anthropicRes.json();
    let rawText = (data?.content?.[0]?.text || '').trim();
    
    const digits = rawText.replace(/[^\d]/g, '');
    if (!digits || digits.length < 5) {
      return res.status(200).json({ error: 'No barcode detected in image. Please try a clearer photo or enter the code manually.' });
    }

    return res.status(200).json({ code: digits });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
}
