// /api/data.js — 由伺服器轉發去 Google Apps Script，避免瀏覽器 CORS 問題
export default async function handler(req, res) {
  const base = process.env.SHEET_URL;
  if (!base) {
    return res.status(500).json({ error: 'no_sheet_url', message: '伺服器未設定 SHEET_URL' });
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(base + '?action=slots', { redirect: 'follow' });
      const data = await r.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      const r = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body || {}),
        redirect: 'follow'
      });
      const data = await r.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'proxy_failed', message: String(err && err.message || err) });
  }
}
