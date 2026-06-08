// Vercel serverless: PatentsView Search API — yapılandırılmış patent (sahip/başlık/tarih).
// Anahtar: PATENTSVIEW_KEY (Vercel env). Anahtar yoksa veya hata olursa boş döner →
// 4c1z mevcut Google Patents aramasına düşer (kırılmaz).
module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 120).trim();
  const key = process.env.PATENTSVIEW_KEY;
  if (!q || !key) { res.status(200).json({ patentler: [] }); return; }
  try {
    const body = {
      q: { "_text_any": { "patent_title": q } },
      f: ["patent_id", "patent_title", "patent_date", "assignees.assignee_organization"],
      o: { "size": 5 }
    };
    const r = await fetch("https://search.patentsview.org/api/v1/patent/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": key },
      body: JSON.stringify(body)
    });
    if (!r.ok) { res.status(200).json({ patentler: [], hata: "HTTP " + r.status }); return; }
    const j = await r.json();
    const patentler = (j.patents || []).slice(0, 5).map(p => ({
      no: p.patent_id || "",
      baslik: p.patent_title || "",
      tarih: p.patent_date || "",
      sahip: (p.assignees && p.assignees[0] && p.assignees[0].assignee_organization) || ""
    })).filter(p => p.baslik);
    res.status(200).json({ patentler });
  } catch (e) {
    res.status(200).json({ patentler: [], hata: String(e) });
  }
};
