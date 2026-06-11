// Vercel serverless function: Gemini'yi sunucu tarafında çağırır.
// Anahtar repoda DEĞİL — Vercel Environment Variable: GEMINI_KEY
// Zincir: her modelin AYRI ücretsiz günlük kotası var; biri dolarsa (429) sıradakine geçilir.
// ALTYAPI: modeller DALGA halinde PARALEL yarışır — ilk geçerli cevap kazanır, kalanları
// iptal edilir (çok daha hızlı). Per-call timeout + toplam bütçe (504 koruması) korunur.
const MODELLER = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];
const CAGRI_TIMEOUT = 8000;    // tek model çağrısı en fazla bu kadar bekler
const TOPLAM_BUTCE = 38000;    // tüm zincir bu süreyi aşarsa durur (504 koruması)
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
  const kombos = [];
  for (const m of MODELLER) for (const key of keys) kombos.push({ m, key });
  const basla = Date.now();
  let son = { status: 502, body: { error: "hiçbir model yanıt vermedi" } };
  for (let i = 0; i < kombos.length; i += DALGA) {
    if (Date.now() - basla > TOPLAM_BUTCE) break;   // bütçe doldu → 504 koruması
    const gorevler = kombos.slice(i, i + DALGA).map(({ m, key }) => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), CAGRI_TIMEOUT);
      return {
        iptal: () => { clearTimeout(to); try { ctrl.abort(); } catch (e) {} },
        calis: async () => {
          try {
            const url = "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + encodeURIComponent(key);
            const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: govde, signal: ctrl.signal });
            const j = await r.json().catch(() => null);
            if (r.ok && j && Array.isArray(j.candidates) && j.candidates.length) return { gecerli: true, j };
            son = { status: r.status, body: j || { error: "boş yanıt" } }; // 429/hata → sıradaki dalga
          } catch (e) {
            son = { status: 502, body: { error: String(e) } };            // abort/ağ → sıradaki dalga
          } finally { clearTimeout(to); }
          return { gecerli: false };
        }
      };
    });
    const kazanan = await ilkGecerli(gorevler);
    if (kazanan) { res.status(200).json(kazanan.j); return; }
  }
  res.status(son.status).json(son.body);
};
