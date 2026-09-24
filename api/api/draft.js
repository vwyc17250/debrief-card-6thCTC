// /api/draft.js — 代 AI 起草，API key 只存在伺服器，唔會出現喺前端
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'no_key', message: '伺服器未設定 GEMINI_API_KEY' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const prompt = (body && body.prompt ? String(body.prompt) : '').slice(0, 4000);
  if (!prompt) {
    return res.status(400).json({ error: 'no_prompt' });
  }

  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });

    const data = await r.json();

    if (!r.ok) {
      const m = (data && data.error && data.error.message) || '呼叫失敗';
      return res.status(502).json({ error: 'upstream', message: m });
    }

    const text =
      (((data.candidates || [])[0] || {}).content || {}).parts
        ?.map(p => p.text || '')
        .join('')
        .trim() || '';

    if (!text) {
      return res.status(502).json({ error: 'empty', message: '無回應內容，請再試' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: 'fetch_failed', message: String(err && err.message || err) });
  }
}
