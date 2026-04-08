// api/check.js — diagnostic endpoint, visit /api/check in browser to confirm setup
module.exports = async function handler(req, res) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(200).json({ status: 'error', message: 'ANTHROPIC_API_KEY not set in environment variables' });
  }

  try {
    // 1. List models
    const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    });
    const data = await modelsRes.json();
    const models = (data.data || []).map(m => m.id);

    // 2. Test a real message call with the cheapest available model
    let testResult = null;
    const testModel = models.includes('claude-haiku-4-5-20251001')
      ? 'claude-haiku-4-5-20251001'
      : (models[0] || 'claude-haiku-4-5-20251001');

    try {
      const msgRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: testModel,
          max_tokens: 64,
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }]
        })
      });
      const msgRaw = await msgRes.text();
      testResult = {
        model: testModel,
        status: msgRes.status,
        ok: msgRes.ok,
        raw: msgRaw.slice(0, 500)
      };
    } catch (e) {
      testResult = { error: e.message };
    }

    return res.status(200).json({
      status: modelsRes.ok ? 'ok' : 'error',
      httpStatus: modelsRes.status,
      keyPrefix: apiKey.substring(0, 20) + '...',
      availableModels: models,
      testCall: testResult,
      raw: modelsRes.ok ? undefined : data
    });
  } catch (err) {
    return res.status(200).json({ status: 'fetch_error', message: err.message });
  }
};
