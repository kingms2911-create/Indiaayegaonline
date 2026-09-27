export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY env var' });

  const { mode, prompt, base64, mime } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const parts = mode === 'video' && base64
    ? [{ inline_data: { mime_type: mime || 'video/mp4', data: base64 } }, { text: prompt }]
    : [{ text: prompt }];

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message || 'Gemini API error' });
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
