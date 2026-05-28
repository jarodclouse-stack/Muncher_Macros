const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64_LENGTH = 7_000_000; // ~5MB decoded
const MAX_TEXT_LENGTH = 500;
const MAX_QUERY_LENGTH = 200;

export function validateImage(base64, mediaType) {
  if (!base64) return 'Missing base64 image';
  if (typeof base64 !== 'string') return 'base64 must be a string';
  if (base64.length > MAX_BASE64_LENGTH) return `Image too large (max ~5MB)`;
  const mtype = mediaType || 'image/jpeg';
  if (!ALLOWED_MEDIA_TYPES.includes(mtype)) return `Invalid media type: ${mtype}`;
  return null;
}

export function validateText(text, maxLen = MAX_TEXT_LENGTH) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, maxLen);
}

export function validateQuery(query) {
  return validateText(query, MAX_QUERY_LENGTH);
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      try { resolve(JSON.parse(buffer.toString())); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}
