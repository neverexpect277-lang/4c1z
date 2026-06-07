// Vercel serverless: anahtarsız web arama (DuckDuckGo HTML). Fikrin gerçekten var olup
// olmadığını / benzer ürünleri kontrol için. Hata olursa boş sonuç döner (kırılmaz).
function temizle(s){
  return String(s).replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 200).trim();
  if (!q) { res.status(200).json({ sonuclar: [] }); return; }
  try {
    const r = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" }
    });
    const html = await r.text();
    const re = /class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const sonuclar = [];
    let m;
    while ((m = re.exec(html)) && sonuclar.length < 5) {
      const baslik = temizle(m[1]), ozet = temizle(m[2]);
      if (baslik) sonuclar.push({ baslik, ozet });
    }
    res.status(200).json({ sonuclar });
  } catch (e) {
    res.status(200).json({ sonuclar: [], hata: String(e) });
  }
};
