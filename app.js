// Arayüz, kaynak çağrıları ve kart çizimi. (prompt.js'ten sonra yüklenir)
const ENDPOINT = "https://text.pollinations.ai/";
const PK = "pk_9A76J8DMwl5fCL8X"; // pollinations publishable key (frontend-güvenli)
const $ = s => document.querySelector(s);
const out = $("#out"), statusEl = $("#status");
const alanInput = $("#alan");

let mod = "yeni";              // "yeni" | "kayit"
let sonUretilen = [];          // ekrandaki son üretim
let uretilmisIsimler = [];     // tekrar engelleme (oturum)
const FAV_KEY = "mucit_favoriler";

function favleriYukle(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }catch(e){ return []; } }
function favleriKaydet(a){ localStorage.setItem(FAV_KEY, JSON.stringify(a)); $("#kayitSay").textContent = a.length; }
function favMi(isim){ return favleriYukle().some(f => f.isim === isim); }

function favToggle(fikir){
  let a = favleriYukle();
  if(a.some(f => f.isim === fikir.isim)) a = a.filter(f => f.isim !== fikir.isim);
  else a.unshift(fikir);
  favleriKaydet(a);
  if(mod === "kayit") cizKayitlilar();
}

// ---- chips & input ----
$("#chips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if(!c) return;
  alanInput.value = c.dataset.v;
});
$("#clear").addEventListener("click", () => { alanInput.value = ""; alanInput.focus(); });

// ---- tabs ----
$("#tabYeni").addEventListener("click", () => setMod("yeni"));
$("#tabKayit").addEventListener("click", () => setMod("kayit"));
function setMod(m){
  mod = m;
  $("#tabYeni").classList.toggle("on", m === "yeni");
  $("#tabKayit").classList.toggle("on", m === "kayit");
  if(m === "kayit") cizKayitlilar();
  else { statusEl.textContent = ""; cizFikirler(sonUretilen); }
}

// ---- kart çizimi ----
function diyalogHTML(d){
  if(!Array.isArray(d) || !d.length) return "";
  const satir = m => {
    const zeyneb = String(m.kim||"").toLocaleLowerCase("tr").startsWith("zeyneb");
    const ikon = zeyneb ? "🧕" : "🧔🏽";
    const kls = zeyneb ? "zeyneb" : "cavus";
    return `<div class="msg ${kls}"><span class="who">${ikon} ${escapeHtml(m.kim||"")}</span>${escapeHtml(m.soz||"")}</div>`;
  };
  return `<div class="dia">${d.map(satir).join("")}</div>`;
}
function kartHTML(f){
  const sec = (b, v) => v ? `<div class="field"><b>${b}</b>${escapeHtml(v)}</div>` : "";
  return `
    <h2>${escapeHtml(f.isim || "İsimsiz")}
      <button class="star ${favMi(f.isim) ? "on" : ""}" data-act="fav" aria-label="Kaydet"></button>
    </h2>
    <p class="ne">${escapeHtml(f.ne || "")}</p>
    ${diyalogHTML(f.diyalog)}
    ${sec("Neyden", f.neyden)}
    ${sec("Hangi derde", f.derde)}
    ${sec("Neden hâlâ yok", f.nedenYok)}
    ${f.vayBe ? `<div class="field vaybe"><b>Vay be sebebi</b>${escapeHtml(f.vayBe)}</div>` : ""}
    <div class="cardfoot">
      <button class="mini" data-act="kopya">Kopyala</button>
      <button class="mini wa" data-act="wa">WhatsApp</button>
      <button class="mini ig" data-act="ig">Instagram</button>
    </div>`;
}
function fikirKart(f){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = kartHTML(f);
  el.querySelector('[data-act="fav"]').addEventListener("click", ev => {
    favToggle(f); ev.currentTarget.classList.toggle("on");
  });
  el.querySelector('[data-act="kopya"]').addEventListener("click", () => kopyala(f));
  el.querySelector('[data-act="wa"]').addEventListener("click", () => gorselPaylas(f));
  el.querySelector('[data-act="ig"]').addEventListener("click", () => gorselPaylas(f));
  return el;
}
function cizFikirler(list){
  out.innerHTML = "";
  if(!list || !list.length){
    out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">✦</span></div>Yukarıdan bir alan seç (ya da boş bırak)<br/>ve <b>Fikir Üret</b>'e bas.</div>`;
    return;
  }
  list.forEach(f => out.appendChild(fikirKart(f)));
}
function cizKayitlilar(){
  statusEl.textContent = "";
  const a = favleriYukle();
  out.innerHTML = "";
  if(!a.length){ out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">★</span></div>Henüz kaydın yok.<br/>Beğendiğin fikrin yıldızına bas.</div>`; return; }
  a.forEach(f => out.appendChild(fikirKart(f)));
}

function kopyala(f){
  const dia = Array.isArray(f.diyalog) && f.diyalog.length
    ? "\n\n" + f.diyalog.map(m => `${m.kim}: ${m.soz}`).join("\n") : "";
  const t = `${f.isim}\n${f.ne}${dia}\n\nNeyden: ${f.neyden}\nHangi derde: ${f.derde}\nNeden yok: ${f.nedenYok}\nVay be: ${f.vayBe}`;
  navigator.clipboard?.writeText(t).then(
    () => flash("Kopyalandı"),
    () => flash("Kopyalanamadı")
  );
}
function paylasMetni(f){
  const dia = Array.isArray(f.diyalog) && f.diyalog.length
    ? "\n\n" + f.diyalog.map(m => `${m.kim}: ${m.soz}`).join("\n") : "";
  return `💡 ${f.isim}\n${f.ne}${dia}\n\n🔧 Neyden: ${f.neyden}\n🎯 Hangi derde: ${f.derde}\n✨ Vay be: ${f.vayBe}\n\n— 4c1z`;
}
// Metni canvas genişliğine göre satırlara böl
function sar(ctx, metin, maxW){
  const kelime = String(metin || "").split(/\s+/), satir = [];
  let s = "";
  for(const w of kelime){
    const t = s ? s + " " + w : w;
    if(ctx.measureText(t).width > maxW && s){ satir.push(s); s = w; } else s = t;
  }
  if(s) satir.push(s);
  return satir;
}
// Fikri paylaşılabilir bir görsele (PNG) çevir
async function fikirGorseli(f){
  try{ await document.fonts.ready; }catch(e){}
  const W = 1080, H = 1350, P = 88;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#faf6ee"); g.addColorStop(1, "#f1ead9");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = "#b9852a"; x.fillRect(P, 150, 56, 4);
  x.fillStyle = "#b9852a"; x.font = "800 36px Inter,sans-serif"; x.fillText("4c1z", P, 122);
  let y = 250;
  x.fillStyle = "#2e2b24"; x.font = "800 64px Inter,sans-serif";
  sar(x, f.isim, W - 2 * P).forEach(l => { x.fillText(l, P, y); y += 80; });
  y += 16;
  x.fillStyle = "#5d564a"; x.font = "400 40px Inter,sans-serif";
  sar(x, f.ne, W - 2 * P).forEach(l => { x.fillText(l, P, y); y += 54; });
  const blok = (b, m) => {
    if(!m || y > H - 220) return;
    y += 40;
    x.fillStyle = "#9c6f1f"; x.font = "600 24px Inter,sans-serif"; x.fillText(b.toUpperCase(), P, y); y += 44;
    x.fillStyle = "#3a352c"; x.font = "400 34px Inter,sans-serif";
    sar(x, m, W - 2 * P).forEach(l => { if(y < H - 150){ x.fillText(l, P, y); y += 46; } });
  };
  blok("Neyden", f.neyden);
  blok("Vay be", f.vayBe);
  x.fillStyle = "#a89e86"; x.font = "400 28px Inter,sans-serif"; x.fillText("4c1z · fikir üreteci", P, H - 64);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  return new File([blob], "4c1z-fikir.png", { type: "image/png" });
}
// Görseli doğrudan paylaş menüsüne ver (WhatsApp/Instagram orada seçilir)
async function gorselPaylas(f){
  let file;
  try{ file = await fikirGorseli(f); }catch(e){ return; }
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: f.isim, text: paylasMetni(f) }); }
    catch(e){}
    return;
  }
  // paylaşım API'si yoksa (masaüstü): metinle WhatsApp web
  window.open("https://wa.me/?text=" + encodeURIComponent(paylasMetni(f)), "_blank");
}
function flash(msg){ statusEl.textContent = msg; setTimeout(() => { if(mod==="yeni") statusEl.textContent=""; }, 1500); }

// Üretim bitince hafif haptik + yumuşak iki notalı ding
let _ac;
function bildir(){
  try{ if(navigator.vibrate) navigator.vibrate([12, 40, 18]); }catch(e){}
  try{
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    if(_ac.state === "suspended") _ac.resume();
    const now = _ac.currentTime;
    [880, 1318].forEach((f, i) => {
      const o = _ac.createOscillator(), g = _ac.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = now + i * 0.10;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g).connect(_ac.destination);
      o.start(t); o.stop(t + 0.5);
    });
  }catch(e){}
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ---- Model zinciri (prompt.js: ureticiPrompt, ustAkilPrompt, jsonAyikla) ----
const POLL_MODELLER = ["openai", "mistral", "llama"]; // pollinations ücretsiz modelleri

async function geminiCagir(sistem, kullanici){
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 35000);
  try{
    const r = await fetch("/api/gen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sistem + "\n\n" + kullanici }),
      signal: ctrl.signal
    });
    if(!r.ok) throw new Error("Gemini " + r.status);
    const j = await r.json();
    return j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally { clearTimeout(to); }
}

async function pollCagir(sistem, kullanici){
  let son = new Error("pollinations yanıt vermedi");
  for(const model of POLL_MODELLER){
    const body = {
      messages: [{ role: "system", content: sistem }, { role: "user", content: kullanici }],
      model, seed: Math.floor(Math.random() * 1e9),
      referrer: location.hostname || "4c1z", token: PK
    };
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 45000);
    try{
      const r = await fetch(ENDPOINT + "?token=" + encodeURIComponent(PK) + "&key=" + encodeURIComponent(PK), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: ctrl.signal
      });
      if(r.ok){ const t = await r.text(); if(t && t.trim()) return t; }
      else { son = new Error("HTTP " + r.status); }
    }catch(e){ son = e; } finally { clearTimeout(to); }
  }
  throw son;
}

// Bir promptu model zincirinden geçirip fikir dizisi döndürür (Gemini -> pollinations)
async function zincir(sistem, kullanici){
  try{ const f = jsonAyikla(await geminiCagir(sistem, kullanici)); if(f) return f; }catch(e){}
  try{ const f = jsonAyikla(await pollCagir(sistem, kullanici)); if(f) return f; }catch(e){}
  return null;
}
function bekle(ms){ return new Promise(res => setTimeout(res, ms)); }

let calisiyor = false;
async function uret(){
  if(calisiyor) return;
  if(mod !== "yeni") setMod("yeni");
  calisiyor = true;
  $("#gen").disabled = true;
  out.innerHTML = "";
  const alan = alanInput.value.trim();
  const mesajlar = [
    "Çavuş ve Zeyneb istişare ediyor…",
    "Çavuş ürünleri tek tek tarıyor…",
    "Çavuş sıradan fikirleri eliyor…",
    "Zeyneb: \"Efendi, hayretim arttı!\"",
    "Zeyneb beğenmiyor, Çavuş ikna ediyor…",
    "En iyileri birleştirip icat ediyor…"
  ];
  let mi = 0;
  statusEl.innerHTML = `<span class="spin"></span>${mesajlar[0]}`;
  const dongu = setInterval(() => { mi = (mi + 1) % mesajlar.length; statusEl.innerHTML = `<span class="spin"></span>${mesajlar[mi]}`; }, 2000);

  // 1. AŞAMA: aday fikir üretimi
  let adaylar = null;
  for(let d = 1; d <= 2 && !adaylar; d++){
    const p = ureticiPrompt(alan);
    adaylar = await zincir(p.sistem, p.kullanici);
    if(!adaylar && d < 2) await bekle(3000);
  }

  // 2. AŞAMA: aday fikirleri süz ve güçlendir
  let fikirler = null;
  if(adaylar){
    for(let d = 1; d <= 2 && !fikirler; d++){
      const p = ustAkilPrompt(alan, adaylar);
      fikirler = await zincir(p.sistem, p.kullanici);
      if(!fikirler && d < 2) await bekle(3000);
    }
    if(!fikirler) fikirler = adaylar.slice(0, 3); // 2. aşama olmazsa adayları göster
  }

  clearInterval(dongu);
  calisiyor = false;
  $("#gen").disabled = false;

  if(fikirler && fikirler.length){
    sonUretilen = fikirler;
    fikirler.forEach(f => { if(f.isim) uretilmisIsimler.push(f.isim); });
    if(uretilmisIsimler.length > 80) uretilmisIsimler = uretilmisIsimler.slice(-80);
    statusEl.textContent = "";
    cizFikirler(fikirler);
    bildir();
  }else{
    statusEl.innerHTML = `Çavuş şu an bulamadı, birkaç saniye sonra tekrar dene.`;
    const b = document.createElement("button");
    b.className = "retry"; b.textContent = "Tekrar dene";
    b.addEventListener("click", uret);
    out.innerHTML = ""; out.appendChild(b);
  }
}

$("#gen").addEventListener("click", uret);

// init
favleriKaydet(favleriYukle());
cizFikirler([]);
