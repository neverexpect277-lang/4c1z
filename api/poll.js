// Vercel serverless: Pollinations metin modellerini sunucudan zincirler (anahtar gizli, CORS yok).
const MODELLER = ["deepseek", "gemini", "openai", "mistral", "qwen-coder", "phi", "llama"];

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const body = req.body || {};
  const messages = Array.isArray(body.messages) && body.messages.length
    ? body.messages
    : (body.text ? [{ role: "user", content: body.text }] : []);
  const models = Array.isArray(body.models) && body.models.length ? body.models : MODELLER;
  let son = { status: 502, body: { error: "pollinations yanıt vermedi" } };
  for (const model of models) {
    try {
      const r = await fetch("https://text.pollinations.ai/?token=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model, seed: Math.floor(Math.random() * 1e9), referrer: "4c1z", token: key })
      });
      if (r.ok) {
        const t = await r.text();
        if (t && t.trim()) { res.status(200).json({ text: t, model }); return; }
      } else {
        son = { status: r.status, body: { error: "HTTP " + r.status, model } };
      }
    } catch (e) {
      son = { status: 502, body: { error: String(e), model } };
    }
  }
  res.status(son.status).json(son.body);
};
