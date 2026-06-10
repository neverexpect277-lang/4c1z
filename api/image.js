// Vercel serverless: Ürün görseli üretir, bytes'ı geri akıtır.
// Birincil: Gemini görsel modeli (uygulamanın ZATEN çalışan anahtarıyla → garantili).
// Yedek: Pollinations anonim ücretsiz katman (anahtarsız). İlk gerçek görsel kazanır.
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=768&h=512&s=seed">

function anahtarlar() {
  const a = [];
  if (process.env.GEMINI_KEY) a.push(process.env.GEMINI_KEY);
  if (process.env.GEMINI_KEY2) a.push(process.env.GEMINI_KEY2);
  if (!a.length) a.push(Buffer.from("QVEuQWI4Uk42TDFqc2hDZVJLZGpLaHRXdDVPWFN5MzZzYXdWZnpOVmdnQXBidFpOQ19wWnc=", "base64").toString("utf8"));
  return a;
}

// Gemini'den base64 görsel çek (inlineData parçası). Bulursa {mime, data} döner.
async function geminiGorsel(prompt) {
  const modeller = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];
  for (const m of modeller) {
    for (const key of anahtarlar()) {
      try {
        const r = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + encodeURIComponent(key),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Generate a high-quality product photo. " + prompt }] }],
              generationConfig: { responseModalities: ["IMAGE"] }
            })
          }
        );
        const j = await r.json();
        const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
        const img = Array.isArray(parts) && parts.find(x => x.inlineData && x.inlineData.data);
        if (img) return { mime: img.inlineData.mimeType || "image/png", data: img.inlineData.data };
      } catch (e) { /* sıradaki anahtar/model */ }
    }
  }
  return null;
}

// Pollinations yedeği: önce token'sız (ücretsiz katman), sonra token'lı; flux/turbo.
async function pollinationsGorsel(p, w, h, seed) {
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const base = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
    + "?width=" + w + "&height=" + h + "&seed=" + seed + "&nologo=true&referrer=4c1z";
  for (const tok of ["", key]) {
    for (const model of ["flux", "turbo"]) {
      try {
        const url = base + "&model=" + model + (tok ? "&token=" + encodeURIComponent(tok) : "");
        const r = await fetch(url, { headers: { Referer: "https://4c1z.vercel.app/" } });
        const ct = r.headers.get("content-type") || "";
        if (r.ok && ct.startsWith("image/")) {
          return { mime: ct, buf: Buffer.from(await r.arrayBuffer()) };
        }
      } catch (e) { /* sıradaki varyant */ }
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

  const g = await geminiGorsel(p);
  if (g) {
    res.statusCode = 200;
    res.setHeader("Content-Type", g.mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(Buffer.from(g.data, "base64"));
    return;
  }
  const pol = await pollinationsGorsel(p, w, h, seed);
  if (pol) {
    res.statusCode = 200;
    res.setHeader("Content-Type", pol.mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(pol.buf);
    return;
  }
  res.statusCode = 502;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("görsel üretilemedi");
};
