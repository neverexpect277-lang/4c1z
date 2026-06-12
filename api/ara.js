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
  const to = setTimeout(() => ctrl.abort(), ms || 6000);
  try { return await fetch(url, Object.assign({ signal: ctrl.signal }, opts || {})); }
  finally { clearTimeout(to); }
}

async function searxng(q){
  // İlk 4 instance'ı PARALEL dene (sıralı 8×9s = timeout riski yerine), ilk dolu sonucu al
  const dene = async (base) => {
    try {
      const r = await zamanli(base + "/search?q=" + encodeURIComponent(q) + "&format=json", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)", "Accept": "application/json" }
      }, 5000);
      if (!r.ok) return [];
      const j = await r.json();
      if (Array.isArray(j.results) && j.results.length)
        return j.results.slice(0, 6)
          .map(x => ({ baslik: temizle(x.title || ""), ozet: temizle(x.content || "") }))
          .filter(x => x.baslik);
    } catch (e) {}
    return [];
  };
  const hepsi = await Promise.all(SEARX.slice(0, 4).map(dene));
  for (const r of hepsi) if (r.length) return r;
  return [];
}

async function ddg(q){
  try {
    const r = await zamanli("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" }
    }, 6000);
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

// Reddit — gerçek kullanıcıların dert/talep tartışması (yorum + oy = ilgi sinyali). Anahtarsız (public .json).
async function reddit(q){
  try {
    const r = await zamanli("https://www.reddit.com/search.json?limit=5&sort=relevance&q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0 (https://4c1z.vercel.app)" }
    });
    if (!r.ok) return [];
    const j = await r.json();
    const kids = (j.data && j.data.children) || [];
    return kids.slice(0, 3).map(c => c && c.data).filter(Boolean).map(d => ({
      baslik: "Reddit: " + temizle(d.title || "") + " (r/" + (d.subreddit || "") + ", " + (d.num_comments || 0) + " yorum)",
      ozet: "oy " + (d.score || 0) + (d.selftext ? " · " + temizle(d.selftext).slice(0, 80) : "")
    })).filter(x => x.baslik.length > 10);
  } catch (e) { return []; }
}

// Wikidata — yapılandırılmış kavram varlıkları (kavram gerçekten var mı?). Anahtarsız.
async function wikidata(q){
  try{
    const r = await zamanli("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=tr&uselang=tr&limit=3&search=" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0 (https://4c1z.vercel.app)" }
    });
    if(!r.ok) return [];
    const j = await r.json();
    return (j.search || []).slice(0, 2).map(x => ({ baslik: "Wikidata: " + temizle(x.label || ""), ozet: temizle(x.description || "") })).filter(x => x.baslik.length > 10);
  }catch(e){ return []; }
}

// npm registry — yazılım/teknoloji benimseme sinyali (hazır kütüphane var mı?). Anahtarsız.
async function npmAra(q){
  try{
    const r = await zamanli("https://registry.npmjs.org/-/v1/search?size=3&text=" + encodeURIComponent(q));
    if(!r.ok) return [];
    const j = await r.json();
    return (j.objects || []).slice(0, 2).map(o => ({ baslik: "npm: " + temizle((o.package && o.package.name) || ""), ozet: temizle((o.package && o.package.description) || "") })).filter(x => x.baslik.length > 6);
  }catch(e){ return []; }
}

// Semantic Scholar — geniş bilimsel makale taban (teknik fizibilite). Anahtarsız.
async function semanticScholar(q){
  try{
    const r = await zamanli("https://api.semanticscholar.org/graph/v1/paper/search?limit=3&fields=title,abstract&query=" + encodeURIComponent(q));
    if(!r.ok) return [];
    const j = await r.json();
    return (j.data || []).slice(0, 2).map(p => ({ baslik: "Makale: " + temizle(p.title || ""), ozet: temizle(p.abstract || "").slice(0, 140) })).filter(x => x.baslik.length > 9);
  }catch(e){ return []; }
}

// Open Library — konuda kitap var mı (kavram olgunluğu). Anahtarsız.
async function openLibrary(q){
  try{
    const r = await zamanli("https://openlibrary.org/search.json?limit=3&q=" + encodeURIComponent(q));
    if(!r.ok) return [];
    const j = await r.json();
    return (j.docs || []).slice(0, 2).map(d => ({ baslik: "Kitap: " + temizle(d.title || ""), ozet: temizle((d.author_name && d.author_name[0]) || "") })).filter(x => x.baslik.length > 8);
  }catch(e){ return []; }
}

// YouTube — videoyu bulur ve İÇİNDEKİ bilgiyi (altyazı) süzer. Anahtarsız (resmi API yok).
// YouTube botları engelleyebilir; her adım hata olursa boş döner (kırılmaz).
async function youtubeAltyazi(id){
  try{
    const r = await zamanli("https://www.youtube.com/watch?v=" + id + "&hl=en", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)", "Accept-Language": "en" }
    }, 8000);
    const html = await r.text();
    const m = html.match(/"captionTracks":\[\{"baseUrl":"(.*?)"/);
    if(!m) return "";
    const url = JSON.parse('"' + m[1] + '"');                 // & vb. çöz
    const t = await zamanli(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" } }, 6000);
    const xml = await t.text();
    return temizle([...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(x => x[1]).join(" ")).slice(0, 200);
  }catch(e){ return ""; }
}
async function youtube(q){
  try{
    const r = await zamanli("https://www.youtube.com/results?hl=tr&search_query=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)", "Accept-Language": "tr,en" }
    }, 9000);
    if(!r.ok) return [];
    const html = await r.text();
    const re = /"videoRenderer":\{"videoId":"([\w-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
    const out = []; const idler = []; let m;
    while((m = re.exec(html)) && out.length < 3){ idler.push(m[1]); out.push({ baslik: "YouTube: " + temizle(m[2]), ozet: "" }); }
    if(idler[0]){ const alt = await youtubeAltyazi(idler[0]); if(alt) out[0].ozet = "video içeriği: " + alt; }
    return out.filter(x => x.baslik.length > 10);
  }catch(e){ return []; }
}

// Bluesky — herkese açık API (anahtarsız), gerçek sosyal sinyal.
async function bluesky(q){
  try{
    const r = await zamanli("https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?limit=5&q=" + encodeURIComponent(q), { headers: { "User-Agent": "4c1z/1.0" } }, 7000);
    if(!r.ok) return [];
    const j = await r.json();
    return (j.posts || []).slice(0, 2).map(p => ({ baslik: "Bluesky: @" + temizle((p.author && p.author.handle) || ""), ozet: temizle((p.record && p.record.text) || "").slice(0, 120) })).filter(x => x.baslik.length > 11);
  }catch(e){ return []; }
}
// Lemmy — açık federe sosyal ağ, anahtarsız arama.
async function lemmy(q){
  try{
    const r = await zamanli("https://lemmy.world/api/v3/search?type_=Posts&limit=5&q=" + encodeURIComponent(q), { headers: { "User-Agent": "4c1z/1.0" } }, 7000);
    if(!r.ok) return [];
    const j = await r.json();
    return (j.posts || []).slice(0, 2).map(p => ({ baslik: "Lemmy: " + temizle((p.post && p.post.name) || ""), ozet: temizle((p.post && p.post.body) || "").slice(0, 110) })).filter(x => x.baslik.length > 8);
  }catch(e){ return []; }
}
// Instagram / TikTok — en iyi çaba (bot duvarı sık engeller; engellenince sessizce boş döner).
async function instagram(q){
  try{
    const tag = String(q || "").toLowerCase().replace(/[^a-z0-9çğıöşü]/g, "");
    if(!tag) return [];
    const r = await zamanli("https://www.instagram.com/explore/tags/" + encodeURIComponent(tag) + "/?__a=1&__d=dis", { headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" } }, 6000);
    if(!r.ok) return [];
    const j = await r.json().catch(() => null);
    const med = j && (j.graphql || j.data) ? "var" : null;     // shape değişken; içerik yakalanabildiyse kısa not
    return med ? [{ baslik: "Instagram: #" + tag, ozet: "etiketten görseller" }] : [];
  }catch(e){ return []; }
}
async function tiktok(q){
  try{
    const r = await zamanli("https://www.tiktok.com/api/search/general/full/?keyword=" + encodeURIComponent(q), { headers: { "User-Agent": "Mozilla/5.0 (compatible; 4c1z/1.0)" } }, 6000);
    if(!r.ok) return [];
    const j = await r.json().catch(() => null);
    const list = j && (j.data || j.item_list) || [];
    return (Array.isArray(list) ? list : []).slice(0, 2).map(x => ({ baslik: "TikTok: " + temizle((x.item && x.item.desc) || x.desc || "").slice(0, 60), ozet: "" })).filter(x => x.baslik.length > 9);
  }catch(e){ return []; }
}
// Sosyal medya ekibi: YouTube(altyazı) + Bluesky + Lemmy + Instagram + TikTok (opt-in).
async function sosyalEkip(q, en){
  const dilim = await Promise.all([youtube(q), bluesky(en || q), lemmy(en || q), instagram(q), tiktok(q)]);
  let out = [];
  for(const d of dilim) out = out.concat((d || []).slice(0, 2));
  return out;
}

// ConceptNet — kavramlar arası ilişkiler (X→kullanım/parça/ilişki). Fikir harmanı için yakıt. Anahtarsız.
async function conceptnet(q){
  try{
    const term = String(q || "").trim().toLowerCase().split(/\s+/).filter(Boolean)[0];
    if(!term) return [];
    const r = await zamanli("https://api.conceptnet.io/c/en/" + encodeURIComponent(term) + "?limit=15", {
      headers: { "User-Agent": "4c1z/1.0 (https://4c1z.vercel.app)" }
    });
    if(!r.ok) return [];
    const j = await r.json();
    const out = [], gor = new Set();
    for(const e of (j.edges || [])){
      const lbl = e && e.end && e.end.label, rel = e && e.rel && e.rel.label;
      if(lbl && rel && lbl.toLowerCase() !== term && !gor.has(lbl) && out.length < 3){
        gor.add(lbl); out.push({ baslik: "İlişkili: " + temizle(lbl), ozet: temizle(rel) });
      }
    }
    return out;
  }catch(e){ return []; }
}

// Datamuse — bir terime İLİŞKİLİ kelimeler (arama kapsamını genişletmek için). Anahtarsız.
async function datamuse(q){
  try {
    const r = await zamanli("https://api.datamuse.com/words?max=4&ml=" + encodeURIComponent(q));
    if (!r.ok) return [];
    const j = await r.json();
    return (Array.isArray(j) ? j : []).slice(0, 2).map(x => x && x.word).filter(Boolean);
  } catch (e) { return []; }
}

// arXiv — bilimsel makale (fizik/mühendislik); teknik fizibilite temeli. Anahtarsız, XML döner.
async function arxiv(q){
  try {
    const r = await zamanli("https://export.arxiv.org/api/query?max_results=3&search_query=all:" + encodeURIComponent(q), {
      headers: { "User-Agent": "4c1z/1.0" }
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const out = []; const re = /<entry>([\s\S]*?)<\/entry>/g; let m;
    while ((m = re.exec(xml)) && out.length < 2) {
      const blok = m[1];
      const baslik = temizle((blok.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
      const ozet = temizle((blok.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1] || "").slice(0, 140);
      if (baslik) out.push({ baslik: "arXiv: " + baslik, ozet });
    }
    return out;
  } catch (e) { return []; }
}

// Jenerik basit-ajan: tek URL → JSON → {baslik,ozet}. Alakasız sorguda boş döner (kendi-kendine kapanır).
async function basitAjan(k, q){
  try{
    const r = await zamanli(k.url(q), { headers: { "User-Agent": "4c1z/1.0 (https://4c1z.vercel.app)", "Accept": "application/json" } }, 4500);
    if(!r.ok) return [];
    const j = await r.json();
    return (k.pick(j) || []).filter(x => x && x.baslik && x.baslik.length > 7).slice(0, 2);
  }catch(e){ return []; }
}
// Her alandan, anahtarsız, kendi-kendine kapanan ajan ordusu (yalnız konuyla ilgiliyse sonuç verir)
const EK_KAYNAKLAR = [
  { url: q => "https://itunes.apple.com/search?limit=3&term=" + encodeURIComponent(q), pick: j => (j.results || []).map(x => ({ baslik: "Uygulama: " + temizle(x.trackName || ""), ozet: temizle(x.primaryGenreName || "") })) },
  { url: q => "https://world.openfoodfacts.org/cgi/search.pl?json=1&page_size=3&search_terms=" + encodeURIComponent(q), pick: j => (j.products || []).map(x => ({ baslik: "Gıda: " + temizle(x.product_name || ""), ozet: temizle(x.brands || "") })) },
  { url: q => "https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(q), pick: j => (j.meals || []).map(x => ({ baslik: "Yemek: " + temizle(x.strMeal || ""), ozet: temizle(x.strArea || "") })) },
  { url: q => "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(q), pick: j => (j.drinks || []).map(x => ({ baslik: "İçecek: " + temizle(x.strDrink || ""), ozet: temizle(x.strCategory || "") })) },
  { url: q => "https://crates.io/api/v1/crates?per_page=3&q=" + encodeURIComponent(q), pick: j => (j.crates || []).map(x => ({ baslik: "crate: " + temizle(x.name || ""), ozet: temizle(x.description || "") })) },
  { url: q => "https://gitlab.com/api/v4/projects?per_page=3&order_by=star_count&search=" + encodeURIComponent(q), pick: j => (Array.isArray(j) ? j : []).map(x => ({ baslik: "GitLab: " + temizle(x.path_with_namespace || ""), ozet: temizle(x.description || "") })) },
  { url: q => "https://api.crossref.org/works?rows=3&query=" + encodeURIComponent(q), pick: j => ((j.message && j.message.items) || []).map(x => ({ baslik: "Yayın: " + temizle((x.title && x.title[0]) || ""), ozet: temizle(x.publisher || "") })) },
  { url: q => "https://lookup.dbpedia.org/api/search?format=json&maxResults=3&query=" + encodeURIComponent(q), pick: j => (j.docs || []).map(x => ({ baslik: "DBpedia: " + temizle((Array.isArray(x.label) ? x.label[0] : x.label) || ""), ozet: temizle((x.comment && x.comment[0]) || "") })) },
  { url: q => "https://gutendex.com/books?search=" + encodeURIComponent(q), pick: j => (j.results || []).map(x => ({ baslik: "Kitap(G): " + temizle(x.title || ""), ozet: temizle((x.authors && x.authors[0] && x.authors[0].name) || "") })) },
  { url: q => "https://archive.org/advancedsearch.php?output=json&rows=3&fl[]=title&q=" + encodeURIComponent(q), pick: j => ((j.response && j.response.docs) || []).map(x => ({ baslik: "Arşiv: " + temizle(x.title || "") })) },
  { url: q => "https://musicbrainz.org/ws/2/recording?fmt=json&limit=3&query=" + encodeURIComponent(q), pick: j => (j.recordings || []).map(x => ({ baslik: "Müzik: " + temizle(x.title || ""), ozet: temizle((x["artist-credit"] && x["artist-credit"][0] && x["artist-credit"][0].name) || "") })) },
  { url: q => "https://api.gdeltproject.org/api/v2/doc/doc?format=json&maxrecords=3&query=" + encodeURIComponent(q), pick: j => (j.articles || []).map(x => ({ baslik: "Haber: " + temizle(x.title || ""), ozet: temizle(x.domain || "") })) },
  { url: q => "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&pagesize=3&site=diy&q=" + encodeURIComponent(q), pick: j => (j.items || []).map(x => ({ baslik: "DIY: " + temizle(x.title || ""), ozet: "skor " + (x.score || 0) })) },
  { url: q => "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&pagesize=3&site=electronics&q=" + encodeURIComponent(q), pick: j => (j.items || []).map(x => ({ baslik: "Elektronik: " + temizle(x.title || ""), ozet: "skor " + (x.score || 0) })) }
];

// ÜRETİM TESİSİ için kaynak seti — teknoloji kaynakları (GitHub/npm/Stack-electronics) DEĞİL;
// tarım/gıda, bilimsel yayın, kavram, ticaret/haber odaklı. EK_KAYNAKLAR'ın ilgili alt-kümesi + OpenAlex.
const TESIS_KAYNAKLAR = [
  EK_KAYNAKLAR[1],   // OpenFoodFacts — gıda/tarım ürünleri
  EK_KAYNAKLAR[6],   // Crossref — bilimsel yayın (üretim tekniği/verim)
  EK_KAYNAKLAR[7],   // DBpedia — kavram/tanım
  EK_KAYNAKLAR[9],   // Internet Archive — belge/rapor
  EK_KAYNAKLAR[10],  // GDELT — haber/pazar/ticaret
  { url: q => "https://api.openalex.org/works?per-page=3&search=" + encodeURIComponent(q), pick: j => (j.results || []).map(x => ({ baslik: "Araştırma: " + temizle(x.title || ""), ozet: temizle((x.primary_location && x.primary_location.source && x.primary_location.source.display_name) || "") })) },
  { url: q => "https://api.worldbank.org/v2/country/tur/indicator/AG.PRD.CROP.XD?format=json&per_page=1&mrnev=1&_q=" + encodeURIComponent(q), pick: j => (Array.isArray(j) && j[1] ? j[1] : []).map(x => ({ baslik: "TR tarım verim endeksi: " + temizle(String(x.value || "")), ozet: "yıl " + temizle(String(x.date || "")) })) }
];

// ALTYAPI önbellek: aynı sorgu sıcak instance'ta TTL boyunca AĞA ÇIKMADAN anında döner.
const ONBELLEK = new Map();
const ONBELLEK_TTL = 10 * 60 * 1000;   // 10 dakika
const ONBELLEK_MAX = 200;              // bellek şişmesin
function onbellekAl(anahtar){
  const k = ONBELLEK.get(anahtar);
  if (k && Date.now() - k.t < ONBELLEK_TTL) return k.v;
  if (k) ONBELLEK.delete(anahtar);     // süresi geçti
  return null;
}
function onbellekKoy(anahtar, v){
  ONBELLEK.set(anahtar, { t: Date.now(), v });
  if (ONBELLEK.size > ONBELLEK_MAX){ const ilk = ONBELLEK.keys().next().value; ONBELLEK.delete(ilk); } // en eskiyi at
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 200).trim();         // Türkçe (web)
  const en = String((req.query && req.query.en) || "").slice(0, 200).trim();        // İngilizce (tech kaynakları)
  if (!q) { res.status(200).json({ sonuclar: [] }); return; }
  const sosyal = !!(req.query && (req.query.sosyal == "1" || req.query.sosyal === "true"));
  const tesis = !!(req.query && (req.query.tesis == "1" || req.query.tesis === "true"));   // tesise özel kaynaklar
  const anahtar = q + "|" + en + "|" + (sosyal ? "s" : "") + (tesis ? "|t" : "");
  const onb = onbellekAl(anahtar);
  if (onb) { res.status(200).json(Object.assign({ onbellek: true }, onb)); return; }   // tekrar eden çağrı → anında
  const patentSorgu = /patents\.google\.com/i.test(q);
  try {
    let web = await searxng(q);
    let kaynak = "searxng";
    if (!web.length) { web = await ddg(q); kaynak = "ddg"; }
    let sonuclar = web.slice(0, 4);   // web baskın olmasın, ek kaynaklara yer kalsın
    if (!patentSorgu && tesis) {
      // ÜRETİM TESİSİ araştırma altyapısı: TR yatırım/pazar/teşvik terimleriyle web + tarım/bilim/ticaret kaynakları
      const temiz = q.replace(/^site:\S+\s*/, "");
      const enTemiz = (en || q).replace(/^site:\S+\s*/, "");
      const tesisSorgular = [
        temiz + " üretim tesisi kurulum maliyeti",
        temiz + " ihracat fiyatı pazar talebi",
        temiz + " tesis teşvik IPARD TKDK hibe",
        enTemiz + " production facility cost yield export"
      ];
      const webDilim = await Promise.all(tesisSorgular.map(t => searxng(t)));
      const gor = new Set();
      for (const it of web) gor.add(it.baslik);
      for (const d of webDilim) for (const it of d) if (it.baslik && !gor.has(it.baslik)) { gor.add(it.baslik); sonuclar.push(it); }
      // bilim + kavram + tarım + haber (teknoloji kaynakları YOK)
      const [a, w, wd, ss, cn] = await Promise.all([
        arxiv(enTemiz), wiki(temiz, enTemiz), wikidata(temiz), semanticScholar(enTemiz), conceptnet(enTemiz)
      ]);
      sonuclar = sonuclar.concat(a.slice(0, 2), w.slice(0, 2), wd.slice(0, 2), ss.slice(0, 2), cn.slice(0, 3));
      const ekDilimler = await Promise.all(TESIS_KAYNAKLAR.map(k => basitAjan(k, enTemiz)));
      for (const d of ekDilimler) sonuclar = sonuclar.concat(d.slice(0, 2));
      kaynak = "tesis";
    } else if (!patentSorgu) {
      const temiz = q.replace(/^site:\S+\s*/, "");
      const enTemiz = (en || q).replace(/^site:\S+\s*/, "");
      // Terim seti: İngilizce + Türkçe + Datamuse'un ilişkili kelimeleri (kapsamı genişletir → daha çok repo)
      const terimler = [enTemiz];
      if (temiz && temiz.toLowerCase() !== enTemiz.toLowerCase()) terimler.push(temiz);
      for (const t of await datamuse(enTemiz)) if (terimler.length < 4 && t) terimler.push(t);
      // GitHub/HN/Stack'i TÜM terimlerle ara, tekrarı ele
      const cokDil = async (fn) => {
        const dilim = await Promise.all(terimler.map(t => fn(t)));
        const gor = new Set(), out = [];
        for (const it of [].concat.apply([], dilim)) { if (!gor.has(it.baslik)) { gor.add(it.baslik); out.push(it); } }
        return out;
      };
      const [g, s, h, rd, a, w, wd, np, ss, ol, cn] = await Promise.all([
        cokDil(github), cokDil(stack), cokDil(hackernews), cokDil(reddit), arxiv(enTemiz), wiki(temiz, enTemiz),
        wikidata(temiz), npmAra(enTemiz), semanticScholar(enTemiz), openLibrary(enTemiz), conceptnet(enTemiz)
      ]);
      sonuclar = sonuclar.concat(g.slice(0, 6), s.slice(0, 2), h.slice(0, 2), rd.slice(0, 2), a.slice(0, 2), w.slice(0, 2),
        wd.slice(0, 2), np.slice(0, 1), ss.slice(0, 2), ol.slice(0, 1), cn.slice(0, 3));
      // her alandan kendi-kendine kapanan ek ajan ordusu (alakasızsa susar)
      const ekDilimler = await Promise.all(EK_KAYNAKLAR.map(k => basitAjan(k, enTemiz)));
      for(const d of ekDilimler) sonuclar = sonuclar.concat(d.slice(0, 1));
    }
    if (!patentSorgu) {
      const temiz = q.replace(/^site:\S+\s*/, "");
      const enTemiz = (en || q).replace(/^site:\S+\s*/, "");
      // SOSYAL MEDYA EKİBİ (opt-in: ?sosyal=1) — YouTube(altyazı)+Bluesky+Lemmy+Instagram+TikTok
      if(sosyal){
        const sos = await sosyalEkip(temiz, enTemiz);
        sonuclar = sonuclar.concat(sos.slice(0, 8));
      }
      if (!tesis && !web.length && sonuclar.length) kaynak = "ek";
    }
    if (sonuclar.length) onbellekKoy(anahtar, { sonuclar, kaynak });   // sadece dolu sonucu önbelleğe al
    res.status(200).json({ sonuclar, kaynak });
  } catch (e) {
    res.status(200).json({ sonuclar: [], hata: String(e) });
  }
};
