// Vercel serverless: Pollinations metin modellerini sunucudan zincirler (anahtar gizli, CORS yok).
// ALTYAPI: her model çağrısı per-call timeout'lu (takılan model zinciri kilitlemez) + toplam
// bütçe (fonksiyon Vercel limitini aşıp 504 vermez).
const MODELLER = ["deepseek", "gemini", "openai", "mistral", "qwen-coder", "phi", "llama"];
const CAGRI_TIMEOUT = 12000;   // tek model çağrısı en fazla bu kadar bekler
const TOPLAM_BUTCE = 48000;    // tüm zincir bu süreyi aşarsa durur

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const body = req.body || {};
  const messages = Array.isArray(body.messages) && body.messages.length
    ? body.messages
    : (body.text ? [{ role: "user", content: body.text }] : []);
  const models = Array.isArray(body.models) && body.models.length ? body.models : MODELLER;
  const basla = Date.now();
  let son = { status: 502, body: { error: "pollinations yanıt vermedi" } };
  for (const model of models) {
    if (Date.now() - basla > TOPLAM_BUTCE) break; // bütçe doldu → 504 koruması
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), CAGRI_TIMEOUT);
    try {
      const r = await fetch("https://text.pollinations.ai/?token=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model, seed: Math.floor(Math.random() * 1e9), referrer: "4c1z", token: key }),
        signal: ctrl.signal
      });
      if (r.ok) {
        const t = await r.text();
        if (t && t.trim()) { res.status(200).json({ text: t, model }); return; }
      } else {
        son = { status: r.status, body: { error: "HTTP " + r.status, model } };
      }
    } catch (e) {
      son = { status: 502, body: { error: String(e), model } }; // abort/ağ → sıradaki model
    } finally { clearTimeout(to); }
  }
  res.status(son.status).json(son.body);
};
