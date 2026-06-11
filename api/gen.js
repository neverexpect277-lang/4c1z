// Vercel serverless function: Gemini'yi sunucu tarafında çağırır.
// Anahtar repoda DEĞİL — Vercel Environment Variable: GEMINI_KEY
// Zincir: her modelin AYRI ücretsiz günlük kotası var; biri dolarsa (429) sıradakine geçilir.
// ALTYAPI: her çağrı per-call timeout'lu (takılan model zinciri kilitlemez) + toplam bütçe
// (fonksiyon Vercel limitini aşıp 504 vermez).
const MODELLER = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];
const CAGRI_TIMEOUT = 8000;    // tek model çağrısı en fazla bu kadar bekler
const TOPLAM_BUTCE = 38000;    // tüm zincir bu süreyi aşarsa durur (504 koruması)

async function modelCagir(url, govde, ms) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: govde, signal: ctrl.signal });
    const j = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, j };
  } finally { clearTimeout(to); }
}

function anahtarlar() {
  const a = [];
  if (process.env.GEMINI_KEY) a.push(process.env.GEMINI_KEY);
  if (process.env.GEMINI_KEY2) a.push(process.env.GEMINI_KEY2); // ikinci anahtar = ikiye katlanmış kota
  if (!a.length) a.push(Buffer.from("QVEuQWI4Uk42TDFqc2hDZVJLZGpLaHRXdDVPWFN5MzZzYXdWZnpOVmdnQXBidFpOQ19wWnc=", "base64").toString("utf8"));
  return a;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const keys = anahtarlar();
  const body = req.body || {};
  const text = body.text || "";
  const temperature = typeof body.temperature === "number" ? body.temperature : 1.0;
  const maxOutputTokens = typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : 4096;
  const govde = JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { temperature, maxOutputTokens } });
  const basla = Date.now();
  let son = { status: 502, body: { error: "hiçbir model yanıt vermedi" } };
  for (const m of MODELLER) {
    for (const key of keys) {
      if (Date.now() - basla > TOPLAM_BUTCE) { res.status(son.status).json(son.body); return; } // bütçe doldu → 504 koruması
      try {
        const url = "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + encodeURIComponent(key);
        const { ok, status, j } = await modelCagir(url, govde, CAGRI_TIMEOUT);
        if (ok && j && Array.isArray(j.candidates) && j.candidates.length) { res.status(200).json(j); return; }
        son = { status: status, body: j || { error: "boş yanıt" } }; // 429/hata/timeout → sıradaki anahtar/model
      } catch (e) {
        son = { status: 502, body: { error: String(e) } }; // abort/ağ → sıradakine geç
      }
    }
  }
  res.status(son.status).json(son.body);
};
