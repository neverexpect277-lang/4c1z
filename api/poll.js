// Vercel serverless: Pollinations metin modellerini sunucudan zincirler (anahtar gizli, CORS yok).
// ALTYAPI: modeller DALGA halinde PARALEL yarışır — ilk geçerli cevap kazanır, kalanları iptal
// edilir (çok daha hızlı). Per-call timeout + toplam bütçe (504 koruması) korunur.
const MODELLER = ["deepseek", "gemini", "openai", "mistral", "qwen-coder", "phi", "llama"];
const CAGRI_TIMEOUT = 12000;   // tek model çağrısı en fazla bu kadar bekler
const TOPLAM_BUTCE = 48000;    // tüm zincir bu süreyi aşarsa durur
const DALGA = 2;               // aynı anda yarışan model sayısı (ilk geçerli kazanır)

// Görevleri paralel başlatır; İLK geçerli sonuç kazanır, kalanları iptal eder.
function ilkGecerli(gorevler) {
  return new Promise(resolve => {
    let kalan = gorevler.length, bitti = false;
    if (!kalan) return resolve(null);
    gorevler.forEach(g => Promise.resolve().then(g.calis).then(v => {
      if (bitti) return;
      if (v && v.gecerli) { bitti = true; gorevler.forEach(x => x.iptal()); resolve(v); }
      else if (--kalan === 0) resolve(null);
    }, () => { if (!bitti && --kalan === 0) resolve(null); }));
  });
}

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
  for (let i = 0; i < models.length; i += DALGA) {
    if (Date.now() - basla > TOPLAM_BUTCE) break;   // bütçe doldu → 504 koruması
    const gorevler = models.slice(i, i + DALGA).map(model => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), CAGRI_TIMEOUT);
      return {
        iptal: () => { clearTimeout(to); try { ctrl.abort(); } catch (e) {} },
        calis: async () => {
          try {
            const r = await fetch("https://text.pollinations.ai/?token=" + encodeURIComponent(key), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages, model, seed: Math.floor(Math.random() * 1e9), referrer: "4c1z", token: key }),
              signal: ctrl.signal
            });
            if (r.ok) {
              const t = await r.text();
              if (t && t.trim()) return { gecerli: true, text: t, model };
            } else {
              son = { status: r.status, body: { error: "HTTP " + r.status, model } };
            }
          } catch (e) {
            son = { status: 502, body: { error: String(e), model } };       // abort/ağ → sıradaki dalga
          } finally { clearTimeout(to); }
          return { gecerli: false };
        }
      };
    });
    const kazanan = await ilkGecerli(gorevler);
    if (kazanan) { res.status(200).json({ text: kazanan.text, model: kazanan.model }); return; }
  }
  res.status(son.status).json(son.body);
};
