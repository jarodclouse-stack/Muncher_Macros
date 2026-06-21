// api/ai-verify-meal.js
// Photo-based meal verification via Claude Vision
// Accepts: { base64, mediaType, originalItems[] }
// Returns: { summary, confidence, adjustedItems[], significantDifference }

import https from 'https';
import { setCors, handlePreflight } from '../cors.js';
import { readBody, validateImage } from '../validate.js';
import { rateLimit, checkAiQuota } from '../rate-limit.js';
import { requireAuth } from '../auth.js';

const MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
];

function extractJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const oStart = clean.indexOf('{'), oEnd = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return JSON.parse(clean.slice(oStart, oEnd + 1)); } catch {}
  }
  return null;
}

async function callClaude(messageContent, apiKey, modelIndex = 0) {
  const model = MODELS[modelIndex];
  return new Promise((resolve, reject) => {
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
          else if (modelIndex < MODELS.length - 1) {
            resolve(callClaude(messageContent, apiKey, modelIndex + 1));
          } else {
            reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
          }
        } catch (e) { reject(new Error('Invalid JSON from AI')); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{ role: 'user', content: messageContent }]
    }));
    req.end();
  });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res))) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await checkAiQuota(user.id, res))) return;

  const body = await readBody(req);
  const { base64, mediaType, originalItems } = body;

  const imgError = validateImage(base64, mediaType);
  if (imgError) return res.status(400).json({ error: imgError });

  if (!originalItems || !Array.isArray(originalItems) || originalItems.length === 0) {
    return res.status(400).json({ error: 'originalItems array is required' });
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  // Build a readable summary of what was logged
  const itemsSummary = originalItems.map(item => {
    const qty = item.stagedQty || item.sQty || 1;
    const unit = item.stagedUnit || item.sUnit || 'serving';
    const cal = Math.round((Number(item.cal) || 0) * (Number(item.stagedQty) || 1));
    return `- ${item.name}: ${qty} ${unit} (~${cal} kcal, ${item.p || 0}g protein, ${item.c || 0}g carbs, ${item.f || 0}g fat)`;
  }).join('\n');

  const promptText = `You are a nutrition verification assistant. The user has logged the following meal in their food diary:

LOGGED MEAL:
${itemsSummary}

Look carefully at the photo of the actual plate/food. Your job is to:
1. Identify what you can actually see in the photo
2. Compare it to the logged items
3. Estimate if the portions look accurate, too large, or too small

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "summary": "1-2 sentence friendly description of what you see vs what was logged",
  "portionAssessment": "accurate|too_large|too_small|unclear",
  "confidence": "high|medium|low",
  "significantDifference": true or false,
  "adjustedItems": [
    {
      "name": "item name (must match one of the logged items exactly)",
      "adjustedQty": number,
      "adjustedUnit": "same unit as original",
      "adjustedCal": estimated calories,
      "adjustedP": estimated protein grams,
      "adjustedC": estimated carb grams,
      "adjustedF": estimated fat grams,
      "reason": "brief reason for adjustment (or 'Looks accurate' if no change needed)"
    }
  ]
}

Rules:
- adjustedItems must contain ALL logged items, not just changed ones.
- If an item looks accurate, keep the same qty/macros but still include it with reason "Looks accurate".
- Set significantDifference to true only if total calories differ by more than 15%.
- If the photo is blurry, not a meal, or unclear, set confidence to "low" and portionAssessment to "unclear".
- Be friendly and encouraging in the summary. Users are tracking their health.
- Never include markdown fences or extra text — ONLY the JSON object.`;

  try {
    const messageContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: base64 }
      },
      { type: 'text', text: promptText }
    ];

    const data = await callClaude(messageContent, apiKey);
    const rawText = (data?.content?.[0]?.text || '').trim();
    const parsed = extractJSON(rawText);

    if (!parsed) {
      return res.status(502).json({ error: 'Could not parse AI response', raw: rawText.slice(0, 200) });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('AI Verify Meal Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
