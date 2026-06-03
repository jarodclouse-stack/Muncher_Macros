// Default origins: production + localhost dev server
const DEFAULT_ORIGINS = [
  'https://munchermacros.com',
  'https://www.munchermacros.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Merge env-provided origins with defaults (env takes precedence if set)
const origins = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : DEFAULT_ORIGINS;

export function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  // If origin is not in the allow-list, no Access-Control-Allow-Origin header
  // is set — the browser will block the cross-origin request.
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(req, res);
    res.status(200).end();
    return true;
  }
  return false;
}
