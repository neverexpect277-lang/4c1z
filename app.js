// Arayüz, kaynak çağrıları ve kart çizimi. (prompt.js'ten sonra yüklenir)
const $ = s => document.querySelector(s);
const out = $("#out"), statusEl = $("#status");
const alanInput = $("#alan");

let mod = "yeni";              // "yeni" | "kayit"
let kayitFiltre = "";          // Kayıtlılar alan filtresi ("" = tümü)
let sonUretilen = [];          // ekrandaki son üretim
let uretilmisIsimler = [];     // tekrar engelleme (oturum)
const FAV_KEY = "mucit_favoriler";
const OTURUM_KEY = "mucit_oturum";
const DURUMLAR = ["Ham", "Geliştirilecek", "Çöp"];
function oturumYukle(){
  try{
    const o = JSON.parse(localStorage.getItem(OTURUM_KEY));
    if(o && Array.isArray(o.ideas)) sonUretilen = o.ideas;
    if(o && Array.isArray(o.isimler)) uretilmisIsimler = o.isimler;
  }catch(e){}
}
function oturumKaydet(){
  try{ localStorage.setItem(OTURUM_KEY, JSON.stringify({ ideas: sonUretilen.slice(0, 40), isimler: uretilmisIsimler.slice(-80) })); }catch(e){}
}

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
// Kayıtlı fikre durum ata (aynı duruma tekrar basınca kaldırır)
function favDurumSet(isim, durum){
  const a = favleriYukle();
  const f = a.find(x => x.isim === isim);
  if(!f) return;
  f.durum = f.durum === durum ? "" : durum;
  favleriKaydet(a);
  if(mod === "kayit") cizKayitlilar();
}
// Kayıtlı fikre puan ver (aynı yıldıza tekrar basınca sıfırlar)
function favPuanSet(isim, puan){
  const a = favleriYukle();
  const f = a.find(x => x.isim === isim);
  if(!f) return;
  f.puan = f.puan === puan ? 0 : puan;
  favleriKaydet(a);
  if(mod === "kayit") cizKayitlilar();
}
// Kayıtlı fikre not yaz — sessiz kaydeder (yeniden çizmez, textarea focus'u korunur)
function favNotSet(isim, not){
  const a = favleriYukle();
  const f = a.find(x => x.isim === isim);
  if(!f) return;
  f.not = not;
  favleriKaydet(a);
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
function durumHTML(f){
  return `<div class="durumlar">${DURUMLAR.map(d =>
    `<button class="durum ${f.durum === d ? "on" : ""}" data-durum="${d}">${d}</button>`).join("")}</div>`;
}
function puanHTML(f){
  const p = f.puan || 0;
  return `<div class="puanlar">${[1,2,3,4,5].map(n =>
    `<button class="puan ${n <= p ? "on" : ""}" data-puan="${n}" aria-label="${n} yıldız"></button>`).join("")}</div>`;
}
function notHTML(f){
  return `<textarea class="not" rows="2" placeholder="Kendi notun…">${escapeHtml(f.not || "")}</textarea>`;
}
function kartHTML(f, kayitli){
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
    ${kayitli ? puanHTML(f) + durumHTML(f) + notHTML(f) : ""}
    <div class="cardfoot">
      <button class="mini" data-act="kopya">Kopyala</button>
      <button class="mini wa" data-act="wa">WhatsApp</button>
      <button class="mini ig" data-act="ig">Instagram</button>
    </div>`;
}
function fikirKart(f, kayitli){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = kartHTML(f, kayitli);
  el.querySelector('[data-act="fav"]').addEventListener("click", ev => {
    favToggle(f); ev.currentTarget.classList.toggle("on");
  });
  el.querySelector('[data-act="kopya"]').addEventListener("click", () => kopyala(f));
  el.querySelector('[data-act="wa"]').addEventListener("click", () => gorselPaylas(f));
  el.querySelector('[data-act="ig"]').addEventListener("click", () => gorselPaylas(f));
  if(kayitli){
    el.querySelectorAll("[data-durum]").forEach(b =>
      b.addEventListener("click", () => favDurumSet(f.isim, b.dataset.durum)));
    el.querySelectorAll("[data-puan]").forEach(b =>
      b.addEventListener("click", () => favPuanSet(f.isim, +b.dataset.puan)));
    const nt = el.querySelector(".not");
    if(nt) nt.addEventListener("input", () => favNotSet(f.isim, nt.value));
  }
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
  const hepsi = favleriYukle();
  out.innerHTML = "";
  if(!hepsi.length){ out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">★</span></div>Henüz kaydın yok.<br/>Beğendiğin fikrin yıldızına bas.</div>`; return; }
  // Alan filtresi çubuğu (1'den fazla alan varsa)
  const alanlar = [...new Set(hepsi.map(f => f.alan || "Sınırsız"))];
  if(kayitFiltre && !alanlar.includes(kayitFiltre)) kayitFiltre = "";  // silinmiş alan seçiliyse sıfırla
  if(alanlar.length > 1){
    const bar = document.createElement("div");
    bar.className = "filtreler";
    bar.innerHTML = `<button class="filtre ${kayitFiltre ? "" : "on"}" data-f="">Tümü</button>` +
      alanlar.map(a => `<button class="filtre ${kayitFiltre === a ? "on" : ""}" data-f="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join("");
    bar.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { kayitFiltre = b.dataset.f; cizKayitlilar(); }));
    out.appendChild(bar);
  }
  // Filtrele + puana göre sırala (yüksek üstte); eşitlikte mevcut sıra (yeni→eski) korunur
  (kayitFiltre ? hepsi.filter(f => (f.alan || "Sınırsız") === kayitFiltre) : hepsi)
    .slice().sort((x, y) => (y.puan || 0) - (x.puan || 0)).forEach(f => out.appendChild(fikirKart(f, true)));
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
function rrect(x, a, b, w, h, r){
  x.beginPath();
  x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
// Fikri, uygulamadaki kartın aynısı olacak şekilde görsele (PNG) çevir
async function fikirGorseli(f){
  try{ await document.fonts.ready; }catch(e){}
  const W = 1080, P = 70, CW = W - 2 * P;

  // Tek fonksiyon: ciz=false ölçer (yükseklik), ciz=true çizer. y matematiği iki geçişte aynı.
  function yerlesim(x, ciz){
    let y = 64;
    // Önce fontu uygula, SONRA o fontla satırlara böl (yoksa satırlar yanlış ölçülüp taşar)
    const yaz = (text, font, color, lh, maxw = CW, px = P) => {
      x.font = font;
      for(const l of sar(x, text, maxw)){ if(ciz){ x.fillStyle = color; x.fillText(l, px, y + lh * 0.74); } y += lh; }
    };
    if(ciz){ x.fillStyle = "#b9852a"; x.fillRect(P, y, 54, 4); }
    y += 22;
    x.font = "700 32px Literata,Georgia,serif";
    if(ciz){ x.fillStyle = "#b9852a"; x.fillText("4c1z", P, y + 26); }
    y += 66;
    yaz(f.isim, "700 56px Literata,Georgia,serif", "#2e2b24", 68);
    y += 8;
    yaz(f.ne, "400 35px Literata,Georgia,serif", "#5d564a", 48);

    if(Array.isArray(f.diyalog)){
      y += 14;
      const maxW = CW * 0.84, ip = 26, tpad = 24, nameH = 36, gap = 6, tl = 42, bpad = 26;
      for(const m of f.diyalog){
        const z = String(m.kim || "").toLocaleLowerCase("tr").startsWith("zeyneb");
        x.font = "400 31px Literata,Georgia,serif";
        const lns = sar(x, m.soz || "", maxW - 2 * ip);
        let tw = 0; lns.forEach(l => tw = Math.max(tw, x.measureText(l).width));
        const ad = (z ? "🧕 " : "🧔🏽 ") + (m.kim || "");
        x.font = "700 27px Literata,Georgia,serif"; tw = Math.max(tw, x.measureText(ad).width);
        const bw = Math.min(maxW, tw + 2 * ip);
        const bh = tpad + nameH + gap + lns.length * tl + bpad;
        const bx = z ? (W - P - bw) : P;
        if(ciz){
          x.fillStyle = z ? "#f6efdc" : "#eef2fb";
          x.strokeStyle = z ? "rgba(185,133,42,.4)" : "rgba(91,123,196,.4)";
          x.lineWidth = 2; rrect(x, bx, y, bw, bh, 22); x.fill(); x.stroke();
          x.font = "700 27px Literata,Georgia,serif"; x.fillStyle = z ? "#9c6f1f" : "#5b7bc4";
          x.fillText(ad, bx + ip, y + tpad + 27);
          x.font = "400 31px Literata,Georgia,serif"; x.fillStyle = "#2e2b24";
          let ty = y + tpad + nameH + gap + 31;
          for(const l of lns){ x.fillText(l, bx + ip, ty); ty += tl; }
        }
        y += bh + 14;
      }
    }

    const blok = (b, m) => {
      if(!m) return;
      y += 18;
      x.font = "700 23px Literata,Georgia,serif";
      if(ciz){ x.fillStyle = "#9c6f1f"; x.fillText(b.toUpperCase(), P, y + 18); }
      y += 38;
      yaz(m, "400 33px Literata,Georgia,serif", "#3a352c", 44);
    };
    blok("Neyden", f.neyden);
    blok("Hangi derde", f.derde);
    blok("Neden hâlâ yok", f.nedenYok);

    if(f.vayBe){
      y += 22;
      x.font = "400 33px Literata,Georgia,serif";
      const vl = sar(x, f.vayBe, CW - 56);
      const vh = 24 + 30 + 8 + vl.length * 44 + 26;
      if(ciz){
        x.fillStyle = "#f6efdc"; x.strokeStyle = "rgba(185,133,42,.4)"; x.lineWidth = 2;
        rrect(x, P, y, CW, vh, 18); x.fill(); x.stroke();
        x.font = "700 23px Literata,Georgia,serif"; x.fillStyle = "#9c6f1f"; x.fillText("VAY BE", P + 28, y + 24 + 18);
        x.font = "400 33px Literata,Georgia,serif"; x.fillStyle = "#2e2b24";
        let ty = y + 24 + 30 + 8 + 32;
        for(const l of vl){ x.fillText(l, P + 28, ty); ty += 44; }
      }
      y += vh;
    }

    y += 50;
    x.font = "400 26px Literata,Georgia,serif";
    if(ciz){ x.fillStyle = "#a89e86"; x.fillText("4c1z · fikir üreteci", P, y); }
    y += 36;
    return y;
  }

  const mc = document.createElement("canvas"); mc.width = W; mc.height = 10;
  const H = Math.ceil(yerlesim(mc.getContext("2d"), false));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#faf6ee"); g.addColorStop(1, "#f1ead9");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  yerlesim(x, true);
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
// Pollinations modelleri artık sunucuda (api/poll.js) zincirleniyor.

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
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 55000);
  try{
    const r = await fetch("/api/poll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: sistem }, { role: "user", content: kullanici }] }),
      signal: ctrl.signal
    });
    if(!r.ok) throw new Error("poll " + r.status);
    const j = await r.json();
    return j.text || "";
  } finally { clearTimeout(to); }
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
  const alan = alanInput.value.trim();
  const kaynak = (($("#kaynak") && $("#kaynak").value) || "").trim();
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
    const p = ureticiPrompt(alan, uretilmisIsimler, kaynak);
    adaylar = await zincir(p.sistem, p.kullanici);
    if(!adaylar && d < 2) await bekle(3000);
  }
  // tekrarı önlemek için aday isimlerini de hatırla
  if(adaylar) adaylar.forEach(a => { if(a.isim) uretilmisIsimler.push(a.isim); });

  // 2. AŞAMA: aday fikirleri süz ve güçlendir
  let fikirler = null;
  if(adaylar){
    for(let d = 1; d <= 2 && !fikirler; d++){
      const p = ustAkilPrompt(alan, adaylar, kaynak);
      fikirler = await zincir(p.sistem, p.kullanici);
      if(!fikirler && d < 2) await bekle(3000);
    }
    if(!fikirler) fikirler = adaylar.slice(0, 1); // 2. aşama olmazsa en iyi adayı göster
  }

  clearInterval(dongu);
  calisiyor = false;
  $("#gen").disabled = false;

  if(fikirler && fikirler.length){
    const fikir = fikirler[0];                 // TEK fikir
    fikir.alan = alan || "Sınırsız";           // filtre için üretildiği alanı etiketle
    sonUretilen.unshift(fikir);                // birer birer: yenisi en üste
    if(fikir.isim) uretilmisIsimler.push(fikir.isim);
    if(uretilmisIsimler.length > 80) uretilmisIsimler = uretilmisIsimler.slice(-80);
    statusEl.textContent = "";
    cizFikirler(sonUretilen);
    oturumKaydet();
    bildir();
  }else{
    statusEl.innerHTML = `Çavuş şu an bulamadı — `;
    const b = document.createElement("button");
    b.className = "retry"; b.textContent = "Tekrar dene";
    b.addEventListener("click", uret);
    statusEl.appendChild(b);
  }
}

$("#gen").addEventListener("click", uret);

// Girişte Osmanlıca karşılama penceresi (giren herkes görür)
(function selamGoster(){
  const m = $("#selamModal"); if(!m || typeof KARSILAMA === "undefined") return;
  $("#selamMetin").textContent = "“" + KARSILAMA[Math.floor(Math.random() * KARSILAMA.length)] + "”";
  m.hidden = false;
  const kapat = () => { m.classList.add("kapan"); setTimeout(() => m.remove(), 260); };
  $("#selamKapat").addEventListener("click", kapat);
  m.addEventListener("click", e => { if(e.target === m) kapat(); });
})();

// PWA service worker
if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// init
favleriKaydet(favleriYukle());
oturumYukle();
cizFikirler(sonUretilen);
