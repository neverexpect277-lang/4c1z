// web-llm köprüsü: TARAYICIDA tam LLM (WebGPU, anahtarsız/sunucusuz). Deneysel, opt-in.
// WebGPU yoksa ya da model inmezse yerelUret() null döner → zincir buluta (Gemini/Pollinations) düşer.
// NOT: model ~0.5GB iner (bir kez, cache'lenir); yalnızca 'Yerel LLM' açıkken çağrılır.

const YEREL_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";  // küçük, hızlı; deneysel
let _eng = null, _engYukleniyor = null;

function yerelDestekli(){ return typeof navigator !== "undefined" && !!navigator.gpu; }

async function yerelHazirla(ilerle){
  if(!yerelDestekli()) return null;          // WebGPU yok → sessiz fallback
  if(_eng) return _eng;
  if(_engYukleniyor) return _engYukleniyor;
  _engYukleniyor = (async () => {
    try{
      const mod = await import("https://esm.run/@mlc-ai/web-llm");
      _eng = await mod.CreateMLCEngine(YEREL_MODEL, ilerle ? { initProgressCallback: ilerle } : undefined);
      return _eng;
    }catch(e){ _eng = null; return null; }
    finally{ _engYukleniyor = null; }
  })();
  return _engYukleniyor;
}

// sistem+kullanici → metin (model çıktısı). Desteklenmiyorsa/başarısızsa null.
async function yerelUret(sistem, kullanici){
  const eng = await yerelHazirla();
  if(!eng) return null;
  try{
    const r = await eng.chat.completions.create({
      messages: [{ role: "system", content: String(sistem || "") }, { role: "user", content: String(kullanici || "") }],
      temperature: 1.0
    });
    return (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || null;
  }catch(e){ return null; }
}
