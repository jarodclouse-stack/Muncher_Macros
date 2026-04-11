import https from 'https';

// THE SYNC: Using the specific aliases verified in ai-describe.js
const MODELS = [
  'claude-sonnet-4-6',           // Primary (3.5 Sonnet alias)
  'claude-haiku-4-5-20251001',   // ✅ FIXED: was 20241001
];

async function anthropicRequest(prompt, apiKey, modelIndex = 0) {
  const model = MODELS[modelIndex];
  return new Promise((resolve, reject) => {
    const apiReq = https.request('https://api.anthropic.com/v1/messages', {
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
          else {
            if (modelIndex < MODELS.length - 1) {
              console.log(`Model ${model} failed, trying fallback...`);
              resolve(anthropicRequest(prompt, apiKey, modelIndex + 1));
            } else {
              reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
            }
          }
        } catch (e) { reject(new Error('Invalid JSON from AI')); }
      });
    });
    apiReq.on('error', reject);
    apiReq.write(JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }));
    apiReq.end();
  });
}

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
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const mtype = mediaType || 'image/jpeg';

  try {
    const promptWithImage = [
      { type: 'image', source: { type: 'base64', media_type: mtype, data: base64 } },
      { type: 'text', text: BARCODE_PROMPT }
    ];

    const data = await anthropicRequest(promptWithImage, apiKey);
    let rawText = (data?.content?.[0]?.text || '').trim();
    
    const digits = rawText.replace(/[^\d]/g, '');
    if (!digits || digits.length < 5) {
      return res.status(200).json({ error: 'No barcode detected in image. Please try a clearer photo or enter the code manually.' });
    }

    return res.status(200).json({ code: digits });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
