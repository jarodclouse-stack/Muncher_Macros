import dbSearch from './_lib/search/db-search.js';
import offSearch from './_lib/search/off-search.js';

export default async function handler(req, res) {
  let action = req.query?.action;
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    action = url.searchParams.get('action');
  }

  switch (action) {
    case 'db': return dbSearch(req, res);
    case 'off': return offSearch(req, res);
    default: return res.status(404).json({ error: 'Unknown or missing action parameter' });
  }
}
