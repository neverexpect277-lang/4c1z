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
// Türkçe + İngilizce Wikipedia (tr: Türkçe sorgu, en: İngilizce sorgu; kavram doğrulaması)
async function wiki(qTr, qEn){
  const [tr, en] = await Promise.all([wikiLang(qTr, "tr"), wikiLang(qEn || qTr, "en")]);
  const out = [];
  for (const it of tr) if (out.length < 3) out.push(it);
  for (const it of en) if (out.length < 4) out.push(it);
  return out;
}

// GitHub açık kaynak projeleri (benzer proje + yıldız = ilgi). Anahtarsız (anonim).
async function github(q){
  try {
    const r = await zamanli("https://api.github.com/search/repositories?per_page=10&sort=stars&order=desc&q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0", "Accept": "application/vnd.github+json" }
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []).slice(0, 7).map(x => {
      const konular = (Array.isArray(x.topics) && x.topics.length) ? " [" + x.topics.slice(0, 5).join(", ") + "]" : "";
      const guncel = x.pushed_at ? " · son: " + String(x.pushed_at).slice(0, 7) : "";
      return {
        baslik: "GitHub: " + (x.full_name || "") + " (★" + (x.stargazers_count || 0) + " ⑂" + (x.forks_count || 0) + ")",
        ozet: temizle(x.description || "") + konular + guncel
      };
    }).filter(x => x.baslik.length > 9);
  } catch (e) { return []; }
}

// Stack Exchange soruları (gerçek sorun/talep sinyali). Anahtarsız (anonim).
async function stack(q){
  try {
    const r = await zamanli("https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&pagesize=4&site=stackoverflow&q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0" }
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []).slice(0, 3).map(x => ({
      baslik: "Soru: " + temizle(x.title || ""),
      ozet: "skor " + (x.score || 0) + ", " + (x.answer_count || 0) + " cevap"
    })).filter(x => x.baslik.length > 7);
  } catch (e) { return []; }
}

// Hacker News (Algolia) — ürün lansmanı/tartışma + puan = ilgi sinyali. Anahtarsız.
async function hackernews(q){
  try {
    const r = await zamanli("https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=4&query=" + encodeURIComponent(q));
    if (!r.ok) return [];
    const j = await r.json();
    return (j.hits || []).slice(0, 3).map(x => ({
      baslik: "HN: " + temizle(x.title || "") + " (" + (x.points || 0) + "p, " + (x.num_comments || 0) + " yorum)",
      ozet: x.url ? String(x.url).slice(0, 90) : ""
    })).filter(x => x.baslik.length > 6);
  } catch (e) { return []; }
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 200).trim();         // Türkçe (web)
  const en = String((req.query && req.query.en) || "").slice(0, 200).trim();        // İngilizce (tech kaynakları)
  if (!q) { res.status(200).json({ sonuclar: [] }); return; }
  const patentSorgu = /patents\.google\.com/i.test(q);
  try {
    let web = await searxng(q);
    let kaynak = "searxng";
    if (!web.length) { web = await ddg(q); kaynak = "ddg"; }
    let sonuclar = web.slice(0, 4);   // web baskın olmasın, ek kaynaklara yer kalsın
    if (!patentSorgu) {
      const temiz = q.replace(/^site:\S+\s*/, "");
      const enTemiz = (en || q).replace(/^site:\S+\s*/, "");   // GitHub/HN/Stack İngilizce ile daha çok sonuç bulur
      const [g, s, h, w] = await Promise.all([github(enTemiz), stack(enTemiz), hackernews(enTemiz), wiki(temiz, enTemiz)]);
      sonuclar = sonuclar.concat(g.slice(0, 6), s.slice(0, 2), h.slice(0, 2), w.slice(0, 2));
      if (!web.length && sonuclar.length) kaynak = "ek";
    }
    res.status(200).json({ sonuclar, kaynak });
  } catch (e) {
    res.status(200).json({ sonuclar: [], hata: String(e) });
  }
};
