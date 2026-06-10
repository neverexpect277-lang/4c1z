// Vercel serverless: ürün görseli.
// SICAK YOL:
//   1) HF_TOKEN varsa → Hugging Face FLUX'u SUNUCUDAN çağırır (token gizli, kimlikli →
//      Pollinations'taki "IP kuyruğu/402" sorunu olmaz; güvenilir). Görsel bytes döner.
//   2) HF yoksa/başarısızsa → 302 ile Pollinations'a (tarayıcı kendi IP'sinden, en iyi çaba).
// TANI: /api/image?debug=1 → HF + Gemini + Pollinations denemelerini JSON döker.
// Kullanım: <img src="/api/image?p=...&w=1024&h=768&s=seed">

function anahtarlar() {
  const a = [];
  if (process.env.GEMINI_KEY) a.push(process.env.GEMINI_KEY);
  if (process.env.GEMINI_KEY2) a.push(process.env.GEMINI_KEY2);
  if (!a.length) a.push(Buffer.from("QVEuQWI4Uk42TDFqc2hDZVJLZGpLaHRXdDVPWFN5MzZzYXdWZnpOVmdnQXBidFpOQ19wWnc=", "base64").toString("utf8"));
  return a;
}

function pollUrl(p, w, h, seed, model) {
  return "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
    + "?width=" + w + "&height=" + h + "&seed=" + seed
    + "&nologo=true&enhance=true&model=" + model + "&referrer=4c1z";
}

// Hugging Face Inference — kimlikli (token), IP-bağımsız → güvenilir. HF_TOKEN yoksa atlanır.
async function hfGorsel(prompt, w, h, log) {
  const tok = process.env.HF_TOKEN;
  if (!tok) { if (log) log.push({ src: "huggingface", model: "-", err: "HF_TOKEN yok (Vercel env ekle)" }); return null; }
  const model = process.env.HF_MODEL || "black-forest-labs/FLUX.1-schnell";
  try {
    const r = await fetch("https://api-inference.huggingface.co/models/" + model, {
      method: "POST",
      headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json", Accept: "image/png" },
      body: JSON.stringify({ inputs: prompt, parameters: { width: w, height: h } })
    });
    const ct = r.headers.get("content-type") || "";
    if (r.ok && ct.startsWith("image/")) {
      if (log) log.push({ src: "huggingface", model, ok: true });
      return { mime: ct, buf: Buffer.from(await r.arrayBuffer()) };
    }
    if (log) log.push({ src: "huggingface", model, status: r.status, err: (await r.text().catch(() => "")).slice(0, 160) });
  } catch (e) { if (log) log.push({ src: "huggingface", model, err: String(e).slice(0, 160) }); }
  return null;
}

// Sadece TANI için (sıcak yolda kullanılmıyor; Gemini ücretsizde görsel kotası yok).
async function geminiProbe(prompt, log) {
  for (const key of anahtarlar()) {
    try {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(key),
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Generate a product photo. " + prompt }] }] }) }
      );
      const j = await r.json().catch(() => ({}));
      const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
      const img = Array.isArray(parts) && parts.find(x => x.inlineData && x.inlineData.data);
      log.push(img ? { src: "gemini", model: "gemini-2.5-flash-image", ok: true }
        : { src: "gemini", model: "gemini-2.5-flash-image", status: r.status, err: ((j.error && j.error.message) || "görsel yok").slice(0, 160) });
      if (img) return true;
    } catch (e) { log.push({ src: "gemini", model: "gemini-2.5-flash-image", err: String(e).slice(0, 160) }); }
  }
  return false;
}

async function pollProbe(p, w, h, seed, log) {
  for (const model of ["flux", "turbo"]) {
    try {
      const r = await fetch(pollUrl(p, w, h, seed, model), { headers: { Referer: "https://4c1z.vercel.app/" } });
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.startsWith("image/")) { log.push({ src: "pollinations", model, ok: true }); return true; }
      log.push({ src: "pollinations", model, status: r.status, err: (await r.text().catch(() => "")).slice(0, 120) });
    } catch (e) { log.push({ src: "pollinations", model, err: String(e).slice(0, 160) }); }
  }
  return false;
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const p = String(q.p || "ürün fotoğrafı").slice(0, 400);
  const w = Math.min(parseInt(q.w, 10) || 1024, 1024);
  const h = Math.min(parseInt(q.h, 10) || 768, 1024);
  const seed = parseInt(q.s, 10) || Math.floor(Math.random() * 1e6);

  if (q.debug == "1" || q.debug === "true") {
    const log = [];
    let ok = await hfGorsel(p, w, h, log) ? "huggingface" : null;
    if (!ok) ok = await geminiProbe(p, log) ? "gemini" : null;
    if (!ok) ok = await pollProbe(p, w, h, seed, log) ? "pollinations" : null;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ sonuc: ok || "yok", denemeler: log }, null, 2));
    return;
  }

  // 1) HF token varsa kimlikli, güvenilir yol:
  const hf = await hfGorsel(p, w, h, null);
  if (hf) {
    res.statusCode = 200;
    res.setHeader("Content-Type", hf.mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(hf.buf);
    return;
  }
  // 2) Yedek: Pollinations'a yönlendir (tarayıcı kendi IP'sinden çeker).
  const model = (q.m === "turbo" || q.m === "flux") ? q.m : "flux";
  res.statusCode = 302;
  res.setHeader("Location", pollUrl(p, w, h, seed, model));
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.end();
};
