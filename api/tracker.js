import fitbitAuth from './_lib/tracker/fitbit-auth.js';
import fitbitCallback from './_lib/tracker/fitbit-callback.js';
import fitbitSync from './_lib/tracker/fitbit-sync.js';
import googleFitAuth from './_lib/tracker/google-fit-auth.js';
import googleFitCallback from './_lib/tracker/google-fit-callback.js';
import googleFitSync from './_lib/tracker/google-fit-sync.js';
import trackerStatus from './_lib/tracker/tracker-status.js';
import trackerDisconnect from './_lib/tracker/tracker-disconnect.js';

export default async function handler(req, res) {
  let action = req.query?.action;
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    action = url.searchParams.get('action');
  }

  switch (action) {
    case 'fitbit-auth': return fitbitAuth(req, res);
    case 'fitbit-callback': return fitbitCallback(req, res);
    case 'fitbit-sync': return fitbitSync(req, res);
    case 'google-fit-auth': return googleFitAuth(req, res);
    case 'google-fit-callback': return googleFitCallback(req, res);
    case 'google-fit-sync': return googleFitSync(req, res);
    case 'status': return trackerStatus(req, res);
    case 'disconnect': return trackerDisconnect(req, res);
    default: return res.status(404).json({ error: 'Unknown or missing action parameter' });
  }
}
