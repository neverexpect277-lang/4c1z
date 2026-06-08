// Vercel serverless: anahtarsız ÇOK KAYNAKLI web arama.
// Zincir: SearXNG (public instance, JSON) -> DuckDuckGo (HTML); ayrıca Wikipedia (kavram var mı?).
// Her kaynak hata/boş olursa sıradakine düşer; hepsi olmazsa boş döner (asla kırılmaz).

function temizle(s){
  return String(s).replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

// Public SearXNG instance'ları (rotasyon; biri JSON'u kapatmışsa sıradakine geçilir)
const SEARX = [
  "https://searx.be",
  "https://search.inetol.net",
  "https://priv.au",
  "https://searx.tiekoetter.com",
  "https://baresearch.org",
  "https://search.rhscz.eu",
  "https://opnxng.com",
  "https://search.bus-hit.me"
];

async function zamanli(url, opts, ms){
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms || 9000);
  try { return await fetch(url, Object.assign({ signal: ctrl.signal }, opts || {})); }
  finally { clearTimeout(to); }
}

async function searxng(q){
  for (const base of SEARX) {
    try {
      const r = await zamanli(base + "/search?q=" + encodeURIComponent(q) + "&format=json", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)", "Accept": "application/json" }
      });
      if (!r.ok) continue;
      const j = await r.json();
      if (Array.isArray(j.results) && j.results.length)
        return j.results.slice(0, 6)
          .map(x => ({ baslik: temizle(x.title || ""), ozet: temizle(x.content || "") }))
          .filter(x => x.baslik);
    } catch (e) {}
  }
  return [];
}

async function ddg(q){
  try {
    const r = await zamanli("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" }
    });
    const html = await r.text();
    const re = /class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const out = []; let m;
    while ((m = re.exec(html)) && out.length < 6) {
      const baslik = temizle(m[1]);
      if (baslik) out.push({ baslik, ozet: temizle(m[2]) });
    }
    return out;
  } catch (e) { return []; }
}

async function wikiLang(q, lang){
  try {
    const r = await zamanli("https://" + lang + ".wikipedia.org/w/api.php?action=opensearch&limit=3&format=json&search=" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0 (https://4c1z.vercel.app)" }
    });
    if (!r.ok) return [];
    const j = await r.json();            // [terim, [başlıklar], [açıklamalar], [url'ler]]
    const titles = j[1] || [], descs = j[2] || [];
    return titles.map((t, i) => ({ baslik: "Wikipedia(" + lang + "): " + t, ozet: descs[i] || "" })).filter(x => x.baslik);
  } catch (e) { return []; }
}
// Türkçe + İngilizce Wikipedia (Türkçe öncelikli; kavram doğrulaması)
async function wiki(q){
  const [tr, en] = await Promise.all([wikiLang(q, "tr"), wikiLang(q, "en")]);
  const out = [];
  for (const it of tr) if (out.length < 3) out.push(it);
  for (const it of en) if (out.length < 4) out.push(it);
  return out;
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 200).trim();
  if (!q) { res.status(200).json({ sonuclar: [] }); return; }
  const patentSorgu = /patents\.google\.com/i.test(q);
  try {
    let sonuclar = await searxng(q);
    let kaynak = "searxng";
    if (!sonuclar.length) { sonuclar = await ddg(q); kaynak = "ddg"; }
    // Wikipedia sadece genel sorguda (site:/patent sorgusunda anlamsız) — kavram doğrulaması olarak eklenir
    if (!patentSorgu) {
      const w = await wiki(q.replace(/^site:\S+\s*/, ""));
      for (const it of w) { if (sonuclar.length < 8) sonuclar.push(it); }
      if (!sonuclar.length && w.length) kaynak = "wikipedia";
    }
    res.status(200).json({ sonuclar, kaynak });
  } catch (e) {
    res.status(200).json({ sonuclar: [], hata: String(e) });
  }
};
