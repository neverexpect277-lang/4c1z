// Arayüz, kaynak çağrıları ve kart çizimi. (prompt.js'ten sonra yüklenir)
const $ = s => document.querySelector(s);
const out = $("#out"), statusEl = $("#status");
const alanInput = $("#alan");

let mod = "yeni";              // "yeni" | "kayit"
let kayitFiltre = "";          // Kayıtlılar alan filtresi ("" = tümü)
let kayitArama = "";           // Kayıtlılar metin araması
let onerilenAcik = false;      // "Önerilen Fikirler" kutusu açık mı (fikirler kutu içinde gizli)
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

// ---- dify ilhamı: ayarlanabilir üretim hattı (görsel akış editörü) ----
const AYAR_KEY = "mucit_ayarlar";
let ayarlar = { adaySayisi: 6, eleme: true, ton: "dengeli", web: true };
function ayarYukle(){ try{ const o = JSON.parse(localStorage.getItem(AYAR_KEY)); if(o) Object.assign(ayarlar, o); }catch(e){} }
function ayarKaydet(){ try{ localStorage.setItem(AYAR_KEY, JSON.stringify(ayarlar)); }catch(e){} }
function ayarSet(k, v){ ayarlar[k] = v; ayarKaydet(); akisCiz(); }

// ---- Temalar (isimli alan+kaynak ayarları) ----
const TEMA_KEY = "mucit_temalar";
function temalarYukle(){ try{ return JSON.parse(localStorage.getItem(TEMA_KEY)) || []; }catch(e){ return []; } }
function temalarKaydet(a){ localStorage.setItem(TEMA_KEY, JSON.stringify(a)); }
function temaFormAc(){
  const alan = alanInput.value.trim();
  const kaynak = (($("#kaynak") && $("#kaynak").value) || "").trim();
  if(!alan && !kaynak){ flash("Önce alan ya da kaynak gir"); return; }
  const inp = $("#temaAd");
  inp.value = alan || "";
  $("#temaForm").hidden = false;
  $("#temaKaydet").hidden = true;
  inp.focus(); inp.select();
}
function temaFormKapat(){
  const f = $("#temaForm"); if(f) f.hidden = true;
  const b = $("#temaKaydet"); if(b) b.hidden = false;
}
function temaOnayla(){
  const inp = $("#temaAd");
  const ad = (inp.value || "").trim();
  if(!ad){ inp.focus(); return; }
  const alan = alanInput.value.trim();
  const kaynak = (($("#kaynak") && $("#kaynak").value) || "").trim();
  const a = temalarYukle().filter(t => t.ad !== ad);  // aynı ad → güncelle
  a.unshift({ ad, alan, kaynak });
  temalarKaydet(a);
  cizTemalar();
  temaFormKapat();
  flash("Tema kaydedildi");
}
function temaSil(ad){ temalarKaydet(temalarYukle().filter(t => t.ad !== ad)); cizTemalar(); }
function temaYukle(t){
  alanInput.value = t.alan || "";
  if($("#kaynak")) $("#kaynak").value = t.kaynak || "";
}
function cizTemalar(){
  const el = $("#temalar"); if(!el) return;
  const a = temalarYukle();
  el.innerHTML = a.map((t, i) =>
    `<span class="tema"><span class="tema-ad" data-yukle="${i}">${escapeHtml(t.ad)}</span><button class="tema-sil" data-sil="${i}" aria-label="Sil">✕</button></span>`).join("");
  el.querySelectorAll("[data-yukle]").forEach(s => s.addEventListener("click", () => temaYukle(a[+s.dataset.yukle])));
  el.querySelectorAll("[data-sil]").forEach(b => b.addEventListener("click", () => temaSil(a[+b.dataset.sil].ad)));
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
// "Önerilen Fikirler" kutusuna basınca fikirleri aç/kapa
$("#onerilenBaslik") && $("#onerilenBaslik").addEventListener("click", () => { onerilenAcik = !onerilenAcik; basligiGuncelle(); });
function setMod(m){
  mod = m;
  $("#tabYeni").classList.toggle("on", m === "yeni");
  $("#tabKayit").classList.toggle("on", m === "kayit");
  if(m === "kayit") cizKayitlilar();
  else { statusEl.textContent = ""; cizFikirler(sonUretilen); }
  basligiGuncelle();
}

// ---- kart çizimi ----
function diyalogHTML(d){
  if(!Array.isArray(d) || !d.length) return "";
  const satir = m => {
    const zeyneb = String(m.kim||"").toLocaleLowerCase("tr").startsWith("zeyneb");
    const ikon = zeyneb ? "🧕" : "🧔🏽";
    const kls = zeyneb ? "zeyneb" : "cavus";
    return `<div class="msg ${kls}"><span class="who">${ikon} ${metin(m.kim||"")}</span>${metin(m.soz||"")}</div>`;
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
function skorHTML(f){
  const n = parseInt(f.skor, 10);
  if(!(n >= 0)) return "";
  const renk = n >= 75 ? "yuksek" : n >= 50 ? "orta" : "dusuk";
  return `<div class="skor ${renk}"><span class="skorNo">${n}</span><span class="skorHukum">${metin(f.hukum || "")}</span></div>`;
}
function muhHTML(f){
  if(!(f.nasil || f.maliyet || f.benzer || f.talep || f.patent || f.teknik || f.prototip || f.farklilas)) return "";
  const sec = (b, v) => v ? `<div class="field"><b>${escapeHtml(b)}</b>${metin(v)}</div>` : "";
  return `<div class="muhendislik"><div class="muhbaslik">Mühendislik</div>` +
    sec("Nasıl yapılır", f.nasil) + sec("Tahmini maliyet", f.maliyet) +
    sec("Benzer ürünler" + (f.benzerWeb ? " · web" : ""), f.benzer) +
    sec("Farklılaş", f.farklilas) +
    sec("Talep / ilgi" + (f.benzerWeb ? " · web" : ""), f.talep) +
    sec("Patent durumu" + (f.patentWeb ? " · web" : ""), f.patent) +
    sec("Teknik gerçeklik", f.teknik) +
    sec("İlk prototip adımı", f.prototip) +
    `</div>`;
}
// ---- ComfyUI ilhamı: düğüm tabanlı görsel üretimi ----
// Düğümler (Konu → Stil → Arka plan → Çıktı) tek görsel prompt'a zincirlenir.
// Prompt İngilizce kurulur (görsel modelleri İngilizceyi sever); arayüz %100 Türkçe.
const GORSEL_STIL = [
  { v: "foto", ad: "Ürün fotoğrafı", p: "professional product photography, studio lighting, high detail" },
  { v: "cizim", ad: "Teknik çizim", p: "technical line drawing, blueprint style, white background" },
  { v: "3d", ad: "3B render", p: "3D render, realistic materials, soft shadows" },
  { v: "izometrik", ad: "İzometrik", p: "isometric illustration, clean flat vector style" }
];
const GORSEL_ARKA = [
  { v: "studyo", ad: "Stüdyo", p: "plain studio backdrop" },
  { v: "sade", ad: "Sade beyaz", p: "minimal pure white background" },
  { v: "baglam", ad: "Bağlam içinde", p: "in a real-world lifestyle context" }
];
function gorselPrompt(f, sec){
  sec = sec || {};
  const ne = String((f && f.ne) || "").replace(/<[^>]*>/g, "").trim().slice(0, 90);
  const konu = [(f && f.isim) || "", ne].filter(Boolean).join(", ");
  const stil = (GORSEL_STIL.find(x => x.v === sec.stil) || GORSEL_STIL[0]).p;
  const arka = (GORSEL_ARKA.find(x => x.v === sec.arka) || GORSEL_ARKA[0]).p;
  return [konu, stil, arka].filter(Boolean).join(", ");
}
function gorselPanelHTML(f){
  const opt = (arr, name) => `<select class="nodesel" data-node="${name}">` +
    arr.map(x => `<option value="${x.v}">${x.ad}</option>`).join("") + `</select>`;
  return `<div class="nodes">
    <div class="node"><span class="nodelbl">Konu</span><span class="nodeval">${metin((f && f.isim) || "")}</span></div>
    <div class="nodewire"></div>
    <div class="node"><span class="nodelbl">Stil</span>${opt(GORSEL_STIL, "stil")}</div>
    <div class="nodewire"></div>
    <div class="node"><span class="nodelbl">Arka plan</span>${opt(GORSEL_ARKA, "arka")}</div>
    <div class="nodewire"></div>
    <button class="node node-uret" data-act="uret">⚙ Üret</button>
    <div class="gorselWrap"></div>
  </div>`;
}
function gorselUret(el, f){
  const wrap = el.querySelector(".gorselWrap");
  if(!wrap) return;
  const sec = {
    stil: el.querySelector('[data-node="stil"]') && el.querySelector('[data-node="stil"]').value,
    arka: el.querySelector('[data-node="arka"]') && el.querySelector('[data-node="arka"]').value
  };
  const p = gorselPrompt(f, sec);
  const seed = Math.floor(Math.random() * 1e6);
  const src = "/api/image?p=" + encodeURIComponent(p) + "&w=768&h=512&s=" + seed;
  wrap.innerHTML = `<div class="gorselYukle"><span class="spin"></span>Görsel üretiliyor…</div>`;
  const img = new Image();
  img.alt = (f && f.isim) || "ürün görseli";
  img.className = "uretilenGorsel";
  img.onload = () => { wrap.innerHTML = ""; wrap.appendChild(img); };
  img.onerror = () => gorselTani(wrap, src);
  img.src = src;
}
// Görsel patlayınca gerçek nedeni göster (debug=1 → her modelin durumu). Sen ekran görüntüsü atınca kesin teşhis.
async function gorselTani(wrap, src){
  wrap.innerHTML = `<div class="gorselHata">Görsel üretilemedi — neden bakılıyor…</div>`;
  try{
    const r = await fetch(src + "&debug=1");
    const j = await r.json();
    const ozet = (j.denemeler || []).map(d =>
      `${d.src}/${d.model}: ${d.ok ? "✓" : ((d.status || "") + " " + (d.err || "")).trim()}`).join("\n");
    wrap.innerHTML = `<div class="gorselHata">Görsel üretilemedi.<br><b>Sonuç: ${escapeHtml(j.sonuc || "yok")}</b>` +
      (ozet ? `<pre class="gorseltani">${escapeHtml(ozet)}</pre>` : "") + `</div>`;
  }catch(e){
    wrap.innerHTML = `<div class="gorselHata">Görsel üretilemedi, tekrar dene.</div>`;
  }
}
function kartHTML(f, kayitli){
  const sec = (b, v) => v ? `<div class="field"><b>${b}</b>${metin(v)}</div>` : "";
  return `
    <h2>${metin(f.isim || "İsimsiz")}
      <button class="star ${favMi(f.isim) ? "on" : ""}" data-act="fav" aria-label="Kaydet"></button>
    </h2>
    ${skorHTML(f)}
    <p class="ne">${metin(f.ne || "")}</p>
    ${diyalogHTML(f.diyalog)}
    ${sec("Neyden", f.neyden)}
    ${sec("Hangi derde", f.derde)}
    ${sec("Neden hâlâ yok", f.nedenYok)}
    ${muhHTML(f)}
    ${f.vayBe ? `<div class="field vaybe"><b>Vay be sebebi</b>${metin(f.vayBe)}</div>` : ""}
    ${kayitli ? puanHTML(f) + durumHTML(f) + notHTML(f) : ""}
    <div class="cardfoot">
      <button class="mini" data-act="kopya">Kopyala</button>
      <button class="mini wa" data-act="wa">WhatsApp</button>
      <button class="mini ig" data-act="ig">Instagram</button>
      <button class="mini gorsel" data-act="gorsel">🎨 Görsel</button>
    </div>
    ${gorselPanelHTML(f)}`;
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
  const gorselBtn = el.querySelector('[data-act="gorsel"]');
  if(gorselBtn){
    const panel = el.querySelector(".nodes");
    gorselBtn.addEventListener("click", () => {
      if(panel) panel.classList.toggle("acik");
      gorselBtn.classList.toggle("on");
    });
    const uretBtn = el.querySelector('[data-act="uret"]');
    if(uretBtn) uretBtn.addEventListener("click", () => gorselUret(el, f));
  }
  // Başlığa basınca kartı aç/kapa (yıldıza basınca değil)
  const h2 = el.querySelector("h2");
  if(h2) h2.addEventListener("click", ev => { if(ev.target.closest('[data-act="fav"]')) return; el.classList.toggle("kapali"); });
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
// "Önerilen Fikirler" kutusu: Yeni sekmesinde kart varken görünür; fikirler kutu içinde gizli, basınca açılır
function basligiGuncelle(){
  const b = $("#onerilenBaslik"); if(!b) return;
  const varMi = mod === "yeni" && !!out.querySelector(".card");
  b.hidden = !varMi;
  const say = $("#onerilenSay"); if(say) say.textContent = varMi ? "(" + out.querySelectorAll(".card").length + ")" : "";
  b.classList.toggle("acik", onerilenAcik);
  // Yeni modda kart varsa: kutu kapalıyken fikirleri GİZLE (ana sayfada gözükmesin). Kayıtlılar/boş durumda göster.
  out.style.display = (varMi && !onerilenAcik) ? "none" : "";
}
function cizFikirler(list){
  out.innerHTML = "";
  if(!list || !list.length){
    out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">✦</span></div>Yukarıdan bir alan seç (ya da boş bırak)<br/>ve <b>Fikir Üret</b>'e bas.</div>`;
    basligiGuncelle();
    return;
  }
  list.forEach((f, i) => { const el = fikirKart(f); if(i > 0) el.classList.add("kapali"); out.appendChild(el); });
  basligiGuncelle();
}
function cizKayitlilar(){
  statusEl.textContent = "";
  const hepsi = favleriYukle();
  out.innerHTML = "";
  if(!hepsi.length){ out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">★</span></div>Henüz kaydın yok.<br/>Beğendiğin fikrin yıldızına bas.</div>`; return; }
  // Arama kutusu (yeniden çizimde focus + imleç geri yüklenir)
  const ara = document.createElement("input");
  ara.className = "kayitara"; ara.type = "text"; ara.placeholder = "Kayıtlarda ara…"; ara.value = kayitArama;
  ara.addEventListener("input", () => {
    kayitArama = ara.value;
    const c = ara.selectionStart;
    cizKayitlilar();
    const y = out.querySelector(".kayitara");
    if(y){ y.focus(); try{ y.setSelectionRange(c, c); }catch(e){} }
  });
  out.appendChild(ara);
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
  // Alan filtresi + metin araması + puana göre sırala (eşitlikte yeni→eski korunur)
  const q = kayitArama.trim().toLocaleLowerCase("tr");
  let list = kayitFiltre ? hepsi.filter(f => (f.alan || "Sınırsız") === kayitFiltre) : hepsi;
  if(q) list = list.filter(f => [f.isim, f.ne, f.neyden, f.derde, f.nedenYok, f.vayBe, f.not, f.alan]
    .filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q));
  list = list.slice().sort((x, y) => (y.puan || 0) - (x.puan || 0));
  if(!list.length){
    const d = document.createElement("div"); d.className = "bossonuc"; d.textContent = "Eşleşen fikir yok.";
    out.appendChild(d); return;
  }
  list.forEach((f, i) => { const el = fikirKart(f, true); if(i > 0) el.classList.add("kapali"); out.appendChild(el); });
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
// Model çıktısı için: önce stray HTML etiketlerini sök (ör. <h4>), sonra güvenli kaçışla. Kullanıcı metninde KULLANMA.
function metin(s){ return escapeHtml(String(s || "").replace(/<[^>]*>/g, "")); }

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

// Güncel USD→TRY kuru (Frankfurter, anahtarsız + CORS). Hata olursa boş.
async function kurGetir(){
  try{
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=TRY", { signal: ctrl.signal });
    clearTimeout(to);
    if(r.ok){ const j = await r.json(); if(j && j.rates && j.rates.TRY) return Math.round(j.rates.TRY); }
  }catch(e){}
  return "";
}

// Tek arama çağrısı (en: İngilizce kelimeler, sadece tech kaynakları için; web Türkçe kalır)
async function araGetir(q, en){
  try{
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    let url = "/api/ara?q=" + encodeURIComponent(q);
    if(en) url += "&en=" + encodeURIComponent(en);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if(r.ok){ const j = await r.json(); if(Array.isArray(j.sonuclar)) return j.sonuclar; }
  }catch(e){}
  return [];
}
// 4. AŞAMA yardımcısı: web + patent araması (paralel) + uzman heyeti ile fikri mühendislik gözüyle zenginleştir
async function uzmanlastir(alan, fikir, kaynak, webAcik){
  const ad = ((fikir.isim || "") + " " + (fikir.ne || "")).trim();
  const enQ = (fikir.aramaEN || "").trim();            // üst aklın ürettiği gizli İngilizce kelimeler
  const anahtar = fikir.isim || fikir.ne || "";
  // web kapalı (dify ayarı): arama atlanır, sadece kur çekilir; uzman heyeti yine çalışır.
  const [genel, patent, kur] = webAcik === false
    ? [[], [], await kurGetir()]
    : await Promise.all([
        araGetir(ad, enQ),
        araGetir("site:patents.google.com " + (enQ || anahtar)),
        kurGetir()
      ]);
  const fmt = arr => arr.slice(0, 12).map(s => "- " + s.baslik + ": " + (s.ozet || "")).join("\n");
  const arama = genel.length ? fmt(genel) : "";
  const patentArama = patent.length ? fmt(patent) : "";
  try{
    const p = uzmanHeyetiPrompt(alan, fikir, kaynak, arama, patentArama, kur);
    const uz = await zincir(p.sistem, p.kullanici);
    if(uz && uz[0]){
      ["skor", "hukum", "farklilas", "nasil", "maliyet", "benzer", "talep", "patent", "teknik", "prototip"].forEach(k => { if(uz[0][k]) fikir[k] = uz[0][k]; });
      if(arama) fikir.benzerWeb = true;
      if(patentArama) fikir.patentWeb = true;
    }
  }catch(e){}
}

// ---- mastra ilhamı: canlı ajan zinciri + öğrenen hafıza ----
const AJAN_ADIMLARI = ["Üretici", "Eleştirmen", "Üst akıl", "Uzman heyeti"];
// aktif = o an çalışan aşamanın index'i; öncekiler 'bitti', sonrakiler 'bekliyor'.
function ajanCiz(aktif, alt){
  const adimlar = AJAN_ADIMLARI.map((ad, i) => {
    const durum = i < aktif ? "bitti" : i === aktif ? "aktif" : "bekliyor";
    const ik = durum === "bitti" ? "✓" : durum === "aktif" ? `<span class="spin"></span>` : String(i + 1);
    return `<div class="ajanadim ${durum}"><span class="ajanik">${ik}</span><span class="ajanad">${ad}</span></div>`;
  }).join(`<span class="ajanwire"></span>`);
  const hafiza = uretilmisIsimler.length
    ? `<span class="ajanhafiza" title="Daha önce üretilen fikirler hatırlanır, tekrarlanmaz">🧠 hafıza: ${uretilmisIsimler.length}</span>` : "";
  statusEl.innerHTML =
    `<div class="ajan"><div class="ajanbaslik"><span>Ajan zinciri</span>${hafiza}</div>` +
    `<div class="ajanlar">${adimlar}</div>` +
    (alt ? `<div class="ajanalt">${alt}</div>` : "") + `</div>`;
}

// dify ilhamı: 4 aşamalı motoru düzenlenebilir görsel akış olarak çiz (her düğüm gerçek davranışa bağlı)
let akisAcik = false;
function akisCiz(){
  const host = $("#akis");
  if(!host) return;
  const opt = (deger, secenekler) => secenekler.map(([v, ad]) =>
    `<option value="${v}" ${String(deger) === String(v) ? "selected" : ""}>${ad}</option>`).join("");
  const dugumler = [
    `<select class="akissel" data-ayar="adaySayisi">${opt(ayarlar.adaySayisi, [[3, "3 aday"], [6, "6 aday"], [9, "9 aday"]])}</select>`,
    `<label class="akistgl"><input type="checkbox" data-ayar="eleme" ${ayarlar.eleme ? "checked" : ""}/>eleme</label>`,
    `<select class="akissel" data-ayar="ton">${opt(ayarlar.ton, [["sert", "sert ton"], ["dengeli", "dengeli ton"], ["mizahi", "mizahi ton"]])}</select>`,
    `<label class="akistgl"><input type="checkbox" data-ayar="web" ${ayarlar.web ? "checked" : ""}/>web</label>`
  ];
  const satirlar = AJAN_ADIMLARI.map((ad, i) =>
    `<div class="akisdugum"><span class="akisik">${i + 1}</span><span class="akisad">${ad}</span>${dugumler[i]}</div>`
  ).join(`<span class="akiswire"></span>`);
  host.innerHTML =
    `<button type="button" class="akisbas" data-akis="tog">${akisAcik ? "▾" : "▸"} Motoru ayarla <span class="akisetiket">dify</span></button>` +
    `<div class="akispanel" ${akisAcik ? "" : "hidden"}>${satirlar}</div>`;
  host.querySelector('[data-akis="tog"]').addEventListener("click", () => { akisAcik = !akisAcik; akisCiz(); });
  host.querySelectorAll("[data-ayar]").forEach(el => {
    el.addEventListener("change", () => {
      const k = el.dataset.ayar;
      const v = el.type === "checkbox" ? el.checked : (k === "adaySayisi" ? parseInt(el.value, 10) : el.value);
      ayarSet(k, v);
    });
  });
}

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
  let asama = 0;
  ajanCiz(asama, mesajlar[0]);
  try{ if(statusEl.scrollIntoView) statusEl.scrollIntoView({ behavior: "smooth", block: "center" }); }catch(e){}
  const dongu = setInterval(() => { mi = (mi + 1) % mesajlar.length; ajanCiz(asama, mesajlar[mi]); }, 2000);

  // 1. AŞAMA: aday fikir üretimi (ajan hafızası: beğenilen kayıtlar üreticiye pozitif sinyal)
  const begenilen = favleriYukle().filter(f => f.puan >= 4 || f.durum === "Geliştirilecek").map(f => f.isim).filter(Boolean);
  let adaylar = null;
  for(let d = 1; d <= 2 && !adaylar; d++){
    const p = ureticiPrompt(alan, uretilmisIsimler, kaynak, begenilen, ayarlar.adaySayisi);
    adaylar = await zincir(p.sistem, p.kullanici);
    if(!adaylar && d < 2) await bekle(3000);
  }
  if(adaylar){ asama = 1; ajanCiz(asama, mesajlar[mi]); }
  // tekrarı önlemek için aday isimlerini de hatırla
  if(adaylar) adaylar.forEach(a => { if(a.isim) uretilmisIsimler.push(a.isim); });

  // 2. AŞAMA: KIRMIZI TAKIM eleştirmen — zayıf/klişe/yapılamaz adayları ele, kalanı keskinleştir
  let suzulmus = null;
  if(adaylar && ayarlar.eleme){
    for(let d = 1; d <= 2 && !suzulmus; d++){
      const p = elestirmenPrompt(alan, adaylar, kaynak);
      suzulmus = await zincir(p.sistem, p.kullanici);
      if(!suzulmus && d < 2) await bekle(3000);
    }
    if(!suzulmus) suzulmus = adaylar; // eleştirmen olmazsa ham adaylarla devam
  }else if(adaylar){
    suzulmus = adaylar;               // eleme kapalı (dify ayarı): ham adaylarla devam
  }
  if(suzulmus){ asama = 2; ajanCiz(asama, mesajlar[mi]); }

  // 3. AŞAMA: ÜST AKIL — süzülmüş adaylardan en iyi 1'ini diyaloğuyla sun
  let fikirler = null;
  if(suzulmus){
    for(let d = 1; d <= 2 && !fikirler; d++){
      const p = ustAkilPrompt(alan, suzulmus, kaynak, ayarlar.ton);
      fikirler = await zincir(p.sistem, p.kullanici);
      if(!fikirler && d < 2) await bekle(3000);
    }
    if(!fikirler) fikirler = suzulmus.slice(0, 1); // üst akıl olmazsa en iyi adayı göster
  }
  if(fikirler){ asama = 3; ajanCiz(asama, mesajlar[mi]); }

  // 4. AŞAMA: UZMAN HEYETİ — fikri web destekli mühendislik gözüyle zenginleştir (diyalog korunur)
  if(fikirler && fikirler.length){
    fikirler[0].alan = alan || "Sınırsız";     // filtre için üretildiği alanı etiketle
    await uzmanlastir(alan, fikirler[0], kaynak, ayarlar.web);
    asama = 4; ajanCiz(asama, mesajlar[mi]);   // tüm aşamalar bitti
  }

  clearInterval(dongu);
  calisiyor = false;
  $("#gen").disabled = false;

  if(fikirler && fikirler.length){
    const fikir = fikirler[0];                 // TEK fikir
    sonUretilen.unshift(fikir);                // birer birer: yenisi en üste
    if(fikir.isim) uretilmisIsimler.push(fikir.isim);
    if(uretilmisIsimler.length > 80) uretilmisIsimler = uretilmisIsimler.slice(-80);
    statusEl.textContent = "";
    onerilenAcik = true;                         // üretince kutuyu aç ki yeni fikir görünsün
    cizFikirler(sonUretilen);
    oturumKaydet();
    bildir();
    // Fikir altta kalmasın: kutuya kaydır
    try{ const ust = $("#onerilenBaslik"); if(ust && ust.scrollIntoView) ust.scrollIntoView({ behavior: "smooth", block: "start" }); }catch(e){}
  }else{
    statusEl.innerHTML = `Çavuş şu an bulamadı — `;
    const b = document.createElement("button");
    b.className = "retry"; b.textContent = "Tekrar dene";
    b.addEventListener("click", uret);
    statusEl.appendChild(b);
  }
}

$("#gen").addEventListener("click", uret);
$("#temaKaydet").addEventListener("click", temaFormAc);
$("#temaOnay").addEventListener("click", temaOnayla);
$("#temaIptal").addEventListener("click", temaFormKapat);
$("#temaAd").addEventListener("keydown", e => {
  if(e.key === "Enter"){ e.preventDefault(); temaOnayla(); }
  else if(e.key === "Escape"){ temaFormKapat(); }
});

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
ayarYukle();
akisCiz();
cizTemalar();
cizFikirler(sonUretilen);
