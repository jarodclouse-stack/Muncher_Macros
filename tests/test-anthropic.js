import https from 'https';

const req = https.request('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy',
    'anthropic-version': '2023-06-01'
  }
}, (res) => {
  let str = '';
  res.on('data', chunk => str += chunk);
  res.on('end', () => console.log(res.statusCode, str));
});

req.write(JSON.stringify({
  model: 'claude-sonnet-4-6',
  max_tokens: 10,
  messages: [{ role: 'user', content: 'test' }]
}));
req.end();
