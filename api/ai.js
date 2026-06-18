import aiBarcode from './_lib/ai/ai-barcode.js';
import aiDescribe from './_lib/ai/ai-describe.js';
import aiIngredients from './_lib/ai/ai-ingredients.js';
import aiLabel from './_lib/ai/ai-label.js';
import aiLookup from './_lib/ai/ai-lookup.js';
import aiVerifyMeal from './_lib/ai/ai-verify-meal.js';

export default async function handler(req, res) {
  let action = req.query?.action;
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    action = url.searchParams.get('action');
  }

  switch (action) {
    case 'barcode': return aiBarcode(req, res);
    case 'describe': return aiDescribe(req, res);
    case 'ingredients': return aiIngredients(req, res);
    case 'label': return aiLabel(req, res);
    case 'lookup': return aiLookup(req, res);
    case 'verify-meal': return aiVerifyMeal(req, res);
    default: return res.status(404).json({ error: 'Unknown or missing action parameter' });
  }
}
