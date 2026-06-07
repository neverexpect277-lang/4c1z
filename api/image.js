// Vercel serverless: Pollinations görsel üretimine yönlendirir (token sunucuda kalır).
// Kullanım: <img src="/api/image?p=ürün açıklaması&w=768&h=512">
module.exports = (req, res) => {
  const q = req.query || {};
  const p = String(q.p || "ürün fotoğrafı").slice(0, 400);
  const w = Math.min(parseInt(q.w, 10) || 768, 1024);
  const h = Math.min(parseInt(q.h, 10) || 512, 1024);
  const key = process.env.POLL_KEY || "pk_9A76J8DMwl5fCL8X";
  const seed = parseInt(q.s, 10) || Math.floor(Math.random() * 1e6);
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p)
    + "?width=" + w + "&height=" + h + "&seed=" + seed + "&nologo=true&model=flux&token=" + encodeURIComponent(key);
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.end();
};
