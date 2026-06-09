// Vercel serverless: Pollinations görselini SUNUCU tarafında çeker ve geri akıtır.
// Çok-stratejili: Pollinations'ın ÜCRETSIZ anonim katmanı yalnız referrer ister
// (token istemez; ölü token 403 verir). Bu yüzden önce token'SIZ, sonra token'lı;
// flux ve turbo ile sırayla denenir. İlk gerçek görsel kazanır.
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=768&h=512&s=seed">
module.exports = async (req, res) => {
  const q = req.query || {};
  const p = String(q.p || "ürün fotoğrafı").slice(0, 400);
  const w = Math.min(parseInt(q.w, 10) || 768, 1024);
  const h = Math.min(parseInt(q.h, 10) || 512, 1024);
  const seed = parseInt(q.s, 10) || Math.floor(Math.random() * 1e6);
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const base = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
    + "?width=" + w + "&height=" + h + "&seed=" + seed + "&nologo=true&referrer=4c1z";

  // Denenecek varyantlar: önce anahtarsız (ücretsiz katman), sonra anahtarlı.
  const denemeler = [];
  for (const tok of ["", key]) {
    for (const model of ["flux", "turbo"]) {
      denemeler.push(base + "&model=" + model + (tok ? "&token=" + encodeURIComponent(tok) : ""));
    }
  }

  for (const url of denemeler) {
    try {
      const r = await fetch(url, { headers: { Referer: "https://4c1z.vercel.app/" } });
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.startsWith("image/")) {
        const buf = Buffer.from(await r.arrayBuffer());
        res.statusCode = 200;
        res.setHeader("Content-Type", ct);
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.end(buf);
        return;
      }
    } catch (e) { /* sıradaki varyanta geç */ }
  }
  res.statusCode = 502;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("görsel üretilemedi");
};
