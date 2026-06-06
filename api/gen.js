// Vercel serverless function: Gemini'yi sunucu tarafında çağırır.
// Anahtar repoda DEĞİL — Vercel Environment Variable: GEMINI_KEY
module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const key = process.env.GEMINI_KEY;
  if (!key) { res.status(500).json({ error: "GEMINI_KEY tanımlı değil" }); return; }
  try {
    const text = (req.body && req.body.text) || "";
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
      }
    );
    const j = await r.json();
    res.status(r.status).json(j);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
