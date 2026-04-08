// api/off-search.js — server-side proxy for Open Food Facts (English only)

async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') { resolve(req.body); return; }
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function isEnglish(p) {
  // Must have an English product name
  const name = p.product_name_en || p.product_name || '';
  if (!name.trim()) return false;
  // Prefer products explicitly tagged as English
  if (p.lang && p.lang !== 'en') return false;
  // Filter out names with non-Latin characters (Chinese, Arabic, Cyrillic, etc.)
  if (/[^\x00-\x7F\u00C0-\u024F]/.test(name)) return false;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await parseBody(req);
  const query = (body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Missing query' });

  // Request English-only results from OFF
  const offUrl = 'https://world.openfoodfacts.org/cgi/search.pl'
    + '?search_terms=' + encodeURIComponent(query)
    + '&search_simple=1&action=process&json=1&page_size=50'
    + '&lc=en&cc=us'
    + '&fields=product_name,product_name_en,serving_size,serving_quantity,'
    + 'serving_quantity_unit,serving_size_unit,nutriments,brands,lang';

  try {
    const offRes = await fetch(offUrl, {
      headers: { 'User-Agent': 'MuncherMacros/1.0 (contact@example.com)' }
    });
    if (!offRes.ok) return res.status(offRes.status).json({ error: 'OFF error ' + offRes.status });

    const data = await offRes.json();

    // Filter server-side to English only, return top 20
    const filtered = (data.products || [])
      .filter(isEnglish)
      .slice(0, 20);

    return res.status(200).json({ ...data, products: filtered });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
