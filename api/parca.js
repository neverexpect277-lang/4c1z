// Vercel serverless: Digi-Key parça fiyatları (KeywordSearch v4). Bileşen-seviyesi fiyat ÖRNEĞİdir,
// ürünün toplam maliyeti DEĞİL. Anahtar: DIGIKEY_CLIENT_ID + DIGIKEY_CLIENT_SECRET (Vercel env).
// Anahtar yoksa/hata olursa boş döner → 'maliyet' alanı modelin tahminine düşer (kırılmaz).
let _token = null, _exp = 0;
async function token(){
  if (_token && Date.now() < _exp) return _token;
  const id = process.env.DIGIKEY_CLIENT_ID, sec = process.env.DIGIKEY_CLIENT_SECRET;
  if (!id || !sec) return null;
  const r = await fetch("https://api.digikey.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=" + encodeURIComponent(id) + "&client_secret=" + encodeURIComponent(sec)
  });
  if (!r.ok) return null;
  const j = await r.json();
  _token = j.access_token;
  _exp = Date.now() + ((j.expires_in || 600) - 60) * 1000;
  return _token;
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || "").slice(0, 80).trim();
  const id = process.env.DIGIKEY_CLIENT_ID;
  if (!q || !id) { res.status(200).json({ parcalar: [] }); return; }
  try {
    const tok = await token();
    if (!tok) { res.status(200).json({ parcalar: [] }); return; }
    const r = await fetch("https://api.digikey.com/products/v4/search/keyword", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + tok,
        "X-DIGIKEY-Client-Id": id,
        "X-DIGIKEY-Locale-Currency": "USD",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ Keywords: q, Limit: 5 })
    });
    if (!r.ok) { res.status(200).json({ parcalar: [], hata: "HTTP " + r.status }); return; }
    const j = await r.json();
    const parcalar = (j.Products || []).slice(0, 5).map(p => ({
      ad: (p.Description && (p.Description.ProductDescription || p.Description)) || p.ProductDescription || "",
      fiyat: p.UnitPrice || (p.ProductVariations && p.ProductVariations[0] && p.ProductVariations[0].StandardPricing
        && p.ProductVariations[0].StandardPricing[0] && p.ProductVariations[0].StandardPricing[0].UnitPrice) || ""
    })).filter(p => p.ad);
    res.status(200).json({ parcalar });
  } catch (e) {
    res.status(200).json({ parcalar: [], hata: String(e) });
  }
};
