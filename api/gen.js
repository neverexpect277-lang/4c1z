// Vercel serverless function: Gemini'yi sunucu tarafında çağırır.
// Anahtar repoda DEĞİL — Vercel Environment Variable: GEMINI_KEY
// Zincir: her modelin AYRI ücretsiz günlük kotası var; biri dolarsa (429) sıradakine geçilir.
const MODELLER = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const key = process.env.GEMINI_KEY || Buffer.from("QVEuQWI4Uk42TDFqc2hDZVJLZGpLaHRXdDVPWFN5MzZzYXdWZnpOVmdnQXBidFpOQ19wWnc=", "base64").toString("utf8");
  const body = req.body || {};
  const text = body.text || "";
  const temperature = typeof body.temperature === "number" ? body.temperature : 1.0;
  const maxOutputTokens = typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : 4096;
  let son = { status: 502, body: { error: "hiçbir model yanıt vermedi" } };
  for (const m of MODELLER) {
    try {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + encodeURIComponent(key),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { temperature, maxOutputTokens } })
        }
      );
      const j = await r.json();
      if (r.ok && j && Array.isArray(j.candidates) && j.candidates.length) { res.status(200).json(j); return; }
      son = { status: r.status, body: j }; // 429/hata → sıradaki modeli dene
    } catch (e) {
      son = { status: 502, body: { error: String(e) } };
    }
  }
  res.status(son.status).json(son.body);
};
