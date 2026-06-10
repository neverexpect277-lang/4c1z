// Vercel serverless: ürün görseli.
// SICAK YOL: 302 ile Pollinations'a yönlendir → görseli TARAYICI kendi IP'sinden çeker.
// (Sunucu-proxy herkesi tek Vercel IP'sine yığıyordu → Pollinations 402 "queue full, max 1/IP".
//  Yönlendirme ile her kullanıcının kendi limiti olur.)
// TANI: /api/image?debug=1 → Gemini + Pollinations denemelerini sunucudan deneyip JSON döker.
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=1024&h=768&s=seed">

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

// Sadece TANI için: Gemini'yi sunucudan dener (kota/model durumunu görmek için).
async function geminiProbe(prompt, log) {
  const denemeler = [{ model: "gemini-2.5-flash-image", cfg: {} }]; // tek geçerli görsel modeli
  for (const d of denemeler) {
    for (const key of anahtarlar()) {
      try {
        const r = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + d.model + ":generateContent?key=" + encodeURIComponent(key),
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Generate a product photo. " + prompt }] }], generationConfig: d.cfg }) }
        );
        const j = await r.json().catch(() => ({}));
        const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
        const img = Array.isArray(parts) && parts.find(x => x.inlineData && x.inlineData.data);
        log.push(img ? { src: "gemini", model: d.model, ok: true }
          : { src: "gemini", model: d.model, status: r.status, err: ((j.error && j.error.message) || "görsel parça yok").slice(0, 160) });
        if (img) return true;
      } catch (e) { log.push({ src: "gemini", model: d.model, err: String(e).slice(0, 160) }); }
    }
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
    const g = await geminiProbe(p, log);
    const pol = g ? false : await pollProbe(p, w, h, seed, log);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ sonuc: g ? "gemini" : pol ? "pollinations" : "yok", denemeler: log }, null, 2));
    return;
  }

  // Tarayıcı görseli kendi IP'sinden çeksin (per-user limit; Vercel IP'sinde 402 olur).
  const model = (q.m === "turbo" || q.m === "flux") ? q.m : "flux";
  res.statusCode = 302;
  res.setHeader("Location", pollUrl(p, w, h, seed, model));
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.end();
};
