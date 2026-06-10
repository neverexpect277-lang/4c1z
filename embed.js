// transformers.js köprüsü: TARAYICIDA anlamsal embedding (anahtarsız, sunucusuz).
// Opt-in: yalnızca 'Anlamsal mod' açıkken çağrılır; model ilk kullanımda iner, tarayıcıya cache'lenir.
// Model yüklenemezse embedet() null döner → çağıranlar kelime (keyword) moduna düşer.

const EMBED_MODEL = "Xenova/multilingual-e5-small";  // Türkçe destekli, küçük
let _pipe = null, _yukleniyor = null;

async function embedHazirla(ilerle){
  if(_pipe) return _pipe;
  if(_yukleniyor) return _yukleniyor;
  _yukleniyor = (async () => {
    try{
      const mod = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");
      if(mod.env) mod.env.allowLocalModels = false;
      _pipe = await mod.pipeline("feature-extraction", EMBED_MODEL, ilerle ? { progress_callback: ilerle } : undefined);
      return _pipe;
    }catch(e){ _pipe = null; return null; }
    finally{ _yukleniyor = null; }
  })();
  return _yukleniyor;
}

// Tek metin → normalize edilmiş vektör (sayı dizisi). Model yoksa null.
async function embedet(metin){
  const p = await embedHazirla();
  if(!p) return null;
  try{
    const out = await p(String(metin || ""), { pooling: "mean", normalize: true });
    return Array.from(out.data);
  }catch(e){ return null; }
}

// Saf: iki vektörün kosinüs benzerliği (0..1). Test edilebilir, modelsiz.
function kosinus(a, b){
  if(!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for(let i = 0; i < a.length; i++){ dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if(na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Saf: bir vektöre en yakın kaydı bul → {i, skor}. liste: [{vec}, ...]
function enYakin(vec, liste){
  let best = { i: -1, skor: 0 };
  if(!vec || !Array.isArray(liste)) return best;
  for(let i = 0; i < liste.length; i++){
    const s = kosinus(vec, liste[i] && liste[i].vec);
    if(s > best.skor) best = { i, skor: s };
  }
  return best;
}
