const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:5173/api/off-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '028400047707' })
  });
  console.log(await res.json());
}
test();
