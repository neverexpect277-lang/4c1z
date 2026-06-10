// Vercel serverless: bir URL'i çekip LLM'e uygun TEMİZ METNE çevirir (firecrawl mantığı, anahtarsız).
// Kullanım: /api/cek?url=https://...  → { baslik, metin }

function temizMetin(html){
  let s = String(html || "");
  // gürültü blokları
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ")
       .replace(/<style[\s\S]*?<\/style>/gi, " ")
       .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
       .replace(/<!--[\s\S]*?-->/g, " ")
       .replace(/<(nav|footer|header|aside|form|svg)[\s\S]*?<\/\1>/gi, " ");
  // blok sonlarını satır başına çevir (okunur metin)
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|article|section)>/gi, "\n")
       .replace(/<br\s*\/?>/gi, "\n")
       .replace(/<[^>]+>/g, " ");
  // html entity çöz
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
  return s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = async (req, res) => {
  const url = String((req.query && req.query.url) || "").trim();
  if(!/^https?:\/\//i.test(url)){ res.status(400).json({ metin: "", hata: "geçerli http(s) linki ver" }); return; }
  try{
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" }, signal: ctrl.signal });
    clearTimeout(to);
    if(!r.ok){ res.status(200).json({ metin: "", hata: "HTTP " + r.status }); return; }
    const html = await r.text();
    const baslik = temizMetin((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").slice(0, 160);
    const metin = temizMetin(html).slice(0, 4000);
    res.status(200).json({ baslik, metin });
  }catch(e){
    res.status(200).json({ metin: "", hata: String(e) });
  }
};

module.exports.temizMetin = temizMetin;
