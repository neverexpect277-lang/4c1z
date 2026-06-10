// Vercel serverless: Ürün görseli üretir, bytes'ı geri akıtır.
// Birincil: Gemini görsel modeli (uygulamanın ZATEN çalışan anahtarıyla).
// Yedek: Pollinations anonim ücretsiz katman (anahtarsız).
// Tanı: /api/image?debug=1 → her denemenin sonucunu JSON döker (anahtar sızdırmaz).
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=768&h=512&s=seed">

function anahtarlar() {
  const a = [];
  if (process.env.GEMINI_KEY) a.push(process.env.GEMINI_KEY);
  if (process.env.GEMINI_KEY2) a.push(process.env.GEMINI_KEY2);
  if (!a.length) a.push(Buffer.from("QVEuQWI4Uk42TDFqc2hDZVJLZGpLaHRXdDVPWFN5MzZzYXdWZnpOVmdnQXBidFpOQ19wWnc=", "base64").toString("utf8"));
  return a;
}

// Gemini görsel modelleri — her biri kendi doğru config'iyle (responseModalities farkı kritik).
const GEMINI_DENEME = [
  { model: "gemini-2.5-flash-image", cfg: {} },
  { model: "gemini-2.5-flash-image-preview", cfg: {} },
  { model: "gemini-2.0-flash-preview-image-generation", cfg: { responseModalities: ["TEXT", "IMAGE"] } }
];

async function geminiGorsel(prompt, log) {
  for (const d of GEMINI_DENEME) {
    for (const key of anahtarlar()) {
      try {
        const r = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + d.model + ":generateContent?key=" + encodeURIComponent(key),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Generate a high-quality product photo. " + prompt }] }],
              generationConfig: d.cfg
            })
          }
        );
        const j = await r.json().catch(() => ({}));
        const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
        const img = Array.isArray(parts) && parts.find(x => x.inlineData && x.inlineData.data);
        if (img) { log.push({ src: "gemini", model: d.model, ok: true }); return { mime: img.inlineData.mimeType || "image/png", data: img.inlineData.data }; }
        log.push({ src: "gemini", model: d.model, status: r.status, err: ((j.error && j.error.message) || "görsel parça yok").slice(0, 180) });
      } catch (e) { log.push({ src: "gemini", model: d.model, err: String(e).slice(0, 180) }); }
    }
  }
  return null;
}

async function pollinationsGorsel(p, w, h, seed, log) {
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const base = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
    + "?width=" + w + "&height=" + h + "&seed=" + seed + "&nologo=true&referrer=4c1z";
  for (const tok of ["", key]) {
    for (const model of ["flux", "turbo"]) {
      const etiket = model + (tok ? "+token" : "");
      try {
        const url = base + "&model=" + model + (tok ? "&token=" + encodeURIComponent(tok) : "");
        const r = await fetch(url, { headers: { Referer: "https://4c1z.vercel.app/" } });
        const ct = r.headers.get("content-type") || "";
        if (r.ok && ct.startsWith("image/")) { log.push({ src: "pollinations", model: etiket, ok: true }); return { mime: ct, buf: Buffer.from(await r.arrayBuffer()) }; }
        log.push({ src: "pollinations", model: etiket, status: r.status, err: (ct.startsWith("image/") ? "ok değil" : (await r.text().catch(() => "")).slice(0, 120)) });
      } catch (e) { log.push({ src: "pollinations", model: etiket, err: String(e).slice(0, 180) }); }
    }
  }
  return null;
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const p = String(q.p || "ürün fotoğrafı").slice(0, 400);
  const w = Math.min(parseInt(q.w, 10) || 768, 1024);
  const h = Math.min(parseInt(q.h, 10) || 512, 1024);
  const seed = parseInt(q.s, 10) || Math.floor(Math.random() * 1e6);
  const debug = q.debug == "1" || q.debug === "true";
  const log = [];

  const g = await geminiGorsel(p, log);
  const pol = g ? null : await pollinationsGorsel(p, w, h, seed, log);

  if (debug) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ sonuc: g ? "gemini" : pol ? "pollinations" : "yok", denemeler: log }, null, 2));
    return;
  }
  const cikti = g ? { mime: g.mime, buf: Buffer.from(g.data, "base64") } : pol;
  if (cikti) {
    res.statusCode = 200;
    res.setHeader("Content-Type", cikti.mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(cikti.buf);
    return;
  }
  res.statusCode = 502;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("görsel üretilemedi");
};
