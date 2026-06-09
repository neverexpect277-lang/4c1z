// Vercel serverless: Pollinations görselini SUNUCU tarafında çeker ve geri akıtır.
// Neden proxy (302 değil): çalışan api/poll.js gibi token + referrer ile sunucudan
// istemek, tarayıcı-referer allowlist sorununu aşar. Model zinciri: flux -> turbo.
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=768&h=512&s=seed">
module.exports = async (req, res) => {
  const q = req.query || {};
  const p = String(q.p || "ürün fotoğrafı").slice(0, 400);
  const w = Math.min(parseInt(q.w, 10) || 768, 1024);
  const h = Math.min(parseInt(q.h, 10) || 512, 1024);
  const seed = parseInt(q.s, 10) || Math.floor(Math.random() * 1e6);
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  for (const model of ["flux", "turbo"]) {
    try {
      const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
        + "?width=" + w + "&height=" + h + "&seed=" + seed
        + "&nologo=true&model=" + model + "&referrer=4c1z&token=" + encodeURIComponent(key);
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
    } catch (e) { /* sıradaki modele geç */ }
  }
  res.statusCode = 502;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("görsel üretilemedi");
};
