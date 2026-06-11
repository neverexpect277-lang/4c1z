// Arayüz, kaynak çağrıları ve kart çizimi. (prompt.js'ten sonra yüklenir)
const $ = s => document.querySelector(s);
const out = $("#out"), statusEl = $("#status");
const alanInput = $("#alan");

let mod = "yeni";              // "yeni" | "kayit"
let kayitFiltre = "";          // Kayıtlılar alan filtresi ("" = tümü)
let kayitArama = "";           // Kayıtlılar metin araması
let anlamsalSira = null;       // anlamsal arama skorları {isim: skor} ya da null (metin modu)
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
let ayarlar = { adaySayisi: 6, eleme: true, ton: "dengeli", web: true, kalip: "", otoKaydet: 0, anlamsal: false, yerel: false, heyet: false, sosyal: false, hiz: "dengeli", tesis: false };
// Hız profilleri (süreleri KULLANICI seçer): Hızlı ↔ Derin (iyi araştırma). Hepsi ms.
// NOT: Hızlı, aşama atlayarak hızlanır (web+eleştirmen yok); per-çağrı süreleri
// CÖMERT tutulur ki model cevabı (özellikle uzun tesis prompt'u) yetişmeden abort olmasın.
const HIZ = {
  hizli:   { ilham: 5000,  ara: 12000, gemini: 24000, poll: 42000 },
  dengeli: { ilham: 12000, ara: 25000, gemini: 22000, poll: 40000 },
  derin:   { ilham: 40000, ara: 45000, gemini: 35000, poll: 55000 }
};
function sureler(){ return HIZ[ayarlar.hiz] || HIZ.dengeli; }
// Çok-ajan heyet modu: üretici aşamasında paralel çalışan persona AJAN ORDUSU.
// Geniş havuz → her turda rotasyonla bir alt-küme sahaya iner (çeşitlilik max, kota bounded).
const PERSONALAR = [
  "DIY/maker mucit — ucuz hazır parçalarla hafta sonu prototipi kurar.",
  "endüstriyel tasarımcı — ergonomi, estetik, kullanım kolaylığına odaklanır.",
  "girişimci — pazar boşluğu, talep ve ticari potansiyele odaklanır.",
  "mühendis — mekanizma, malzeme ve fizik fizibilitesine odaklanır.",
  "sürdürülebilirlik uzmanı — atık azaltma, geri dönüşüm, enerji tasarrufu düşünür.",
  "erişilebilirlik uzmanı — yaşlı, engelli ve çocukların kullanımını önceler.",
  "ev ekonomisti — günlük ev/mutfak işlerini kolaylaştıran pratik çözümler arar.",
  "oyun tasarımcısı — sıkıcı işleri eğlenceli, oyunlaştırılmış hale getirir.",
  "sağlık & hijyen uzmanı — temizlik, güvenlik ve sağlıklı yaşam açısından bakar.",
  "doğa/çiftçi gözü — bahçe, balkon, tarım ve açık hava ihtiyaçlarına odaklanır."
];
// Üretim tesisi modunun KENDİ ajan ordusu — ürün personaları (maker, oyun tasarımcısı…) burada SAHAYA İNMEZ.
const TESIS_PERSONALAR = [
  "ziraat mühendisi — tarla/sera yetiştiriciliği, verim ve iklim uygunluğuna odaklanır.",
  "su ürünleri mühendisi — balık/kabuklu/yosun çiftlikleri (kapalı devre/RAS) kurar.",
  "biyoteknoloji uzmanı — zehir, enzim, mikroalg, doku kültürü gibi yüksek katma değerli biyo-madde üretir.",
  "gıda mühendisi — kurutma/distilasyon/paketleme ile katma değerli işleme tesisi düşünür.",
  "niş hayvancılık/veteriner — sülük, salyangoz, ipek böceği, arı ürünleri gibi az bilinen üretimlere bakar.",
  "ihracat & dış ticaret uzmanı — hangi ürün hangi ülkeye, talep ve fiyat avantajına odaklanır.",
  "tarım teşvik danışmanı — IPARD/TKDK/KOSGEB hibe ve desteklerini önceler.",
  "yatırım maliyetçisi — kurulum (CAPEX), işletme gideri ve geri ödeme süresini hesaplar.",
  "pazar/talep analisti — kilogram/gram fiyatı yüksek, niş pazar boşluklarını arar.",
  "sürdürülebilir tarım uzmanı — atığı gelire çeviren döngüsel üretim kurar."
];
const HEYET_AJAN = 6;   // her turda sahaya inen persona sayısı (rotasyonla farklı kombinasyon)
function personaSec(){
  const havuz = ayarlar.tesis ? TESIS_PERSONALAR : PERSONALAR;
  return [...havuz].sort(() => Math.random() - 0.5).slice(0, Math.min(HEYET_AJAN, havuz.length));
}
function ayarYukle(){ try{ const o = JSON.parse(localStorage.getItem(AYAR_KEY)); if(o) Object.assign(ayarlar, o); }catch(e){} }
function ayarKaydet(){ try{ localStorage.setItem(AYAR_KEY, JSON.stringify(ayarlar)); }catch(e){} }
function ayarSet(k, v){ ayarlar[k] = v; ayarKaydet(); akisCiz(); }

// ---- fabric ilhamı: hazır prompt kalıpları (tek tıkla mod) ----
const KALIPLAR = [
  { k: "ucuz", ad: "Ucuz prototip", v: "Her fikir bir hafta sonunda 200 TL altı bütçeyle, kolay bulunan parçalarla prototiplenebilsin; pahalı/karmaşık olanı ELE." },
  { k: "tech", ad: "Yüksek teknoloji", v: "Fikirler sensör/mikrodenetleyici/IoT/akıllı bileşen içersin; yine de bugünün ucuz hazır parçalarıyla kurulabilir olsun." },
  { k: "sosyal", ad: "Sosyal fayda", v: "Fikirler yaşlı, engelli veya çocuk gibi dezavantajlı grupların gündelik hayatını kolaylaştırmaya odaklansın." },
  { k: "cevre", ad: "Çevre dostu", v: "Fikirler atık azaltma, geri dönüşüm, su veya enerji tasarrufu gibi çevresel faydaya odaklansın." },
  { k: "eglence", ad: "Eğlence", v: "Fikirler oyunlaştırma ve keyif odaklı olsun; sıkıcı gündelik işleri eğlenceli hale getirsin." }
];
function kalipVurgu(){ const x = KALIPLAR.find(k => k.k === ayarlar.kalip); return x ? x.v : ""; }
function kaliplarCiz(){
  const host = $("#kaliplar"); if(!host) return;
  host.innerHTML = `<button type="button" class="chip kalip ${ayarlar.kalip ? "" : "on"}" data-k="">Mod yok</button>` +
    KALIPLAR.map(x => `<button type="button" class="chip kalip ${ayarlar.kalip === x.k ? "on" : ""}" data-k="${x.k}">${x.ad}</button>`).join("");
  host.querySelectorAll("[data-k]").forEach(b =>
    b.addEventListener("click", () => { ayarlar.kalip = b.dataset.k; ayarKaydet(); kaliplarCiz(); }));
}

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
// Tesis ve ürün AYRI dünyalar: bir öğe aktif moda (ayarlar.tesis) ait mi?
function modUyar(f){ return !!(f && f.tesis) === !!ayarlar.tesis; }
function kayitSayiGuncelle(){ const el = $("#kayitSay"); if(el) el.textContent = favleriYukle().filter(modUyar).length; }
function favleriKaydet(a){ localStorage.setItem(FAV_KEY, JSON.stringify(a)); kayitSayiGuncelle(); }
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
// Ürün modu chip'leri (varsayılan) vs. Üretim Tesisi modu chip'leri
const URUN_CHIPLER = [["","Sınırsız"],["mutfak","Mutfak"],["banyo","Banyo"],["çanta / cep","Çanta"],["araba","Araba"],["çocuk","Çocuk"],["yaşlılar","Yaşlı"],["sokak / dışarı","Sokak"],["ev","Ev"],["ofis / okul","Ofis"],["bahçe / balkon","Bahçe"],["evcil hayvan","Evcil"]];
const TESIS_CHIPLER = [["","Sınırsız"],["mantar üretim tesisi","Mantar"],["su ürünleri / balık çiftliği","Su ürünleri"],["tıbbi ve aromatik bitki","Tıbbi bitki"],["biyoteknoloji / zehir / enzim","Biyoteknoloji"],["niş hayvancılık (sülük, salyangoz, ipek böceği)","Niş hayvancılık"],["böcek proteini üretimi","Böcek proteini"],["mikroalg (spirulina, klorella)","Mikroalg"],["esansiyel yağ distilasyon tesisi","Esans yağ"],["arıcılık / arı ürünleri (zehir, propolis)","Arı ürünleri"],["seracılık / dikey tarım","Sera / Dikey"]];
function chipleriCiz(){
  const host = $("#chips"); if(!host) return;
  const set = ayarlar.tesis ? TESIS_CHIPLER : URUN_CHIPLER;
  host.innerHTML = set.map(([v, ad]) =>
    `<span class="chip${v === "" ? " sinirsiz" : ""}" data-v="${escapeHtml(v)}">${escapeHtml(ad)}</span>`).join("");
}
function tesisGuncelle(){
  const on = !!ayarlar.tesis;
  const k = $("#tesisKutu");
  if(k){ k.classList.toggle("on", on); k.setAttribute("aria-pressed", on ? "true" : "false"); }
  chipleriCiz();
  // İki AYRI buton: aktif moddaki buton vurgulanır (Fikir Üret ↔ Tesis Üret)
  const gen = $("#gen"); if(gen) gen.classList.toggle("aktifmod", !on);
  const genT = $("#genTesis"); if(genT) genT.classList.toggle("aktifmod", on);
  if(alanInput) alanInput.placeholder = on
    ? "tesis alanı yaz (örn. 'mantar', 'akrep zehri'), boş bırak ya da serbest iste"
    : "alan yaz, boş bırak, ya da 'buzdolabı ve drone'u birleştir' gibi serbest iste";
  kayitSayiGuncelle();   // kayıt sayacı aktif moda göre
}
$("#chips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if(!c) return;
  alanInput.value = c.dataset.v;
});
$("#tesisKutu") && $("#tesisKutu").addEventListener("click", () => {
  ayarlar.tesis = !ayarlar.tesis; ayarKaydet(); tesisGuncelle();
  // mod dünyası değişti: görünen listeyi (üretilenler/kayıtlar) tazele
  if(mod === "kayit") cizKayitlilar(); else cizFikirler(sonUretilen);
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
// Premium yatırım özeti: "kurulum ≈₺ · geri ödeme ≈yıl · marj %" → stat çipleri
function yatirimBlok(v){
  if(!v) return "";
  const stats = String(v).split(/[·|]/).map(s => s.trim()).filter(Boolean);
  if(stats.length < 2) return `<div class="field yatirim"><b>★ Yatırım özeti</b>${metin(v)}</div>`;
  return `<div class="yatirimkutu"><div class="yatirimbas">★ Yatırım Özeti</div>` +
    `<div class="yatirimstats">${stats.map(s => `<span class="ystat">${metin(s)}</span>`).join("")}</div></div>`;
}
function muhHTML(f){
  if(!(f.nasil || f.maliyet || f.benzer || f.talep || f.patent || f.teknik || f.prototip || f.farklilas || f.yapiTaslari || f.ilham || f.yatirim)) return "";
  const sec = (b, v) => v ? `<div class="field"><b>${escapeHtml(b)}</b>${metin(v)}</div>` : "";
  const T = !!f.tesis;
  return `<div class="muhendislik"><div class="muhbaslik">${T ? "Mühendislik & Yatırım" : "Mühendislik"}</div>` +
    (T ? yatirimBlok(f.yatirim) : "") +
    sec(T ? "Nasıl kurulur" : "Nasıl yapılır", f.nasil) +
    sec(T ? "Kurulum + birim maliyet" : "Tahmini maliyet", f.maliyet) +
    sec((T ? "Benzer tesisler" : "Benzer ürünler") + (f.benzerWeb ? " · web" : ""), f.benzer) +
    sec("Farklılaş", f.farklilas) +
    sec((T ? "İhracat / iç talep" : "Talep / ilgi") + (f.benzerWeb ? " · web" : ""), f.talep) +
    sec((T ? "Ruhsat / teşvik" : "Patent durumu") + (f.patentWeb ? " · web" : ""), f.patent) +
    sec(T ? "Teknik / biyolojik darboğaz" : "Teknik gerçeklik", f.teknik) +
    sec(T ? "İlk pilot adımı" : "İlk prototip adımı", f.prototip) +
    sec(T ? "Teşvik / kaynaklar" : "Açık kaynak yapı taşları", f.yapiTaslari) +
    sec("Sahadan ilham (üreticiyi besleyen gerçek sinyaller)", f.ilham) +
    `</div>`;
}
// browser-use ilhamı: bir fikre özel CANLI pazar/rakip taraması (mevcut /api/ara ajan ordusu)
async function pazarTara(el, f){
  const wrap = el.querySelector(".pazarWrap");
  if(!wrap) return;
  wrap.innerHTML = `<div class="pazarYukle"><span class="spin"></span>Pazar taranıyor…</div>`;
  const q = ((f.isim || "") + " " + (f.ne || "")).trim();
  const en = (f.aramaEN || "").trim();
  try{
    const url = "/api/ara?q=" + encodeURIComponent(q) + (en ? "&en=" + encodeURIComponent(en) : "");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    const j = await r.json();
    const liste = (j && Array.isArray(j.sonuclar) ? j.sonuclar : []).slice(0, 8);
    if(!liste.length){ wrap.innerHTML = `<div class="pazarBos">Belirgin sonuç çıkmadı — niş olabilir.</div>`; return; }
    wrap.innerHTML = `<div class="pazarListe"><div class="pazarBaslik">Pazar taraması (${liste.length})</div>` +
      liste.map(s => `<div class="pazarItem"><b>${metin(s.baslik || "")}</b>${s.ozet ? `<span>${metin(s.ozet)}</span>` : ""}</div>`).join("") +
      `</div>`;
  }catch(e){
    wrap.innerHTML = `<div class="pazarBos">Tarama yapılamadı, tekrar dene.</div>`;
  }
}
function kartHTML(f, kayitli){
  const sec = (b, v) => v ? `<div class="field"><b>${b}</b>${metin(v)}</div>` : "";
  const L = f.tesis
    ? { neyden: "Ne üretir / girdi", derde: "Pazar / alıcı", nedenYok: "Neden herkes kurmuyor", vayBe: "Kâr / değer noktası" }
    : { neyden: "Neyden", derde: "Hangi derde", nedenYok: "Neden hâlâ yok", vayBe: "Vay be sebebi" };
  return `
    ${f.tesis ? `<div class="tesisrozet">🏭 Yatırım Dosyası</div>` : ""}
    <h2>${metin(f.isim || "İsimsiz")}
      <button class="star ${favMi(f.isim) ? "on" : ""}" data-act="fav" aria-label="Kaydet"></button>
    </h2>
    ${skorHTML(f)}
    ${f.benzerNot ? `<div class="field benzernot"><b>Anlamca benzer kaydın</b>${metin(f.benzerNot)}</div>` : ""}
    <p class="ne">${metin(f.ne || "")}</p>
    ${diyalogHTML(f.diyalog)}
    ${sec(L.neyden, f.neyden)}
    ${sec(L.derde, f.derde)}
    ${sec(L.nedenYok, f.nedenYok)}
    ${muhHTML(f)}
    ${f.vayBe ? `<div class="field vaybe"><b>${L.vayBe}</b>${metin(f.vayBe)}</div>` : ""}
    ${kayitli ? puanHTML(f) + durumHTML(f) + notHTML(f) : ""}
    <div class="cardfoot">
      <button class="mini" data-act="kopya">Kopyala</button>
      <button class="mini" data-act="pazar">Pazarı tara</button>
      <button class="mini wa" data-act="wa">WhatsApp</button>
      <button class="mini ig" data-act="ig">Instagram</button>
    </div>
    <div class="pazarWrap"></div>`;
}
function fikirKart(f, kayitli){
  const el = document.createElement("div");
  el.className = "card" + (f.tesis ? " tesis" : "");
  el.innerHTML = kartHTML(f, kayitli);
  el.querySelector('[data-act="fav"]').addEventListener("click", ev => {
    favToggle(f); ev.currentTarget.classList.toggle("on");
  });
  el.querySelector('[data-act="kopya"]').addEventListener("click", () => kopyala(f));
  el.querySelector('[data-act="wa"]').addEventListener("click", () => gorselPaylas(f));
  el.querySelector('[data-act="ig"]').addEventListener("click", () => gorselPaylas(f));
  const pazarBtn = el.querySelector('[data-act="pazar"]');
  if(pazarBtn) pazarBtn.addEventListener("click", () => pazarTara(el, f));
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
  const gosterilecek = (list || []).filter(modUyar);   // sadece aktif moda (ürün/tesis) ait olanlar
  if(!gosterilecek.length){
    out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">✦</span></div>Yukarıdan bir alan seç (ya da boş bırak)<br/>ve <b>${ayarlar.tesis ? "Tesis Üret" : "Fikir Üret"}</b>'e bas.</div>`;
    basligiGuncelle();
    return;
  }
  gosterilecek.forEach((f, i) => { const el = fikirKart(f); if(i > 0) el.classList.add("kapali"); out.appendChild(el); });
  basligiGuncelle();
}
// transformers.js: kayıtlı fikirlerde ANLAMSAL arama — kelime birebir geçmese de anlamca bulur.
async function anlamsalAra(){
  const q = kayitArama.trim();
  if(!q) return;
  const qv = await embedet(q);
  if(!qv){ flash("Anlamsal arama için Motoru ayarla → Anlamsal mod'u aç (model iner)"); return; }
  const harita = {};
  for(const f of favleriYukle()){
    const v = await embedet(((f.isim || "") + " " + (f.ne || "")).trim());
    if(v) harita[f.isim] = kosinus(qv, v);
  }
  anlamsalSira = harita;
  cizKayitlilar();
}
function cizKayitlilar(){
  statusEl.textContent = "";
  const hepsi = favleriYukle().filter(modUyar);   // aktif moda (ürün/tesis) ait kayıtlar
  out.innerHTML = "";
  if(!hepsi.length){ out.innerHTML = `<div class="empty"><div class="emblem"><span class="spark">★</span></div>${ayarlar.tesis ? "Henüz kayıtlı tesis fikrin yok." : "Henüz kaydın yok."}<br/>Beğendiğin fikrin yıldızına bas.</div>`; return; }
  // Arama kutusu (yeniden çizimde focus + imleç geri yüklenir)
  const araSatir = document.createElement("div");
  araSatir.className = "kayitarasatir";
  const ara = document.createElement("input");
  ara.className = "kayitara"; ara.type = "text"; ara.placeholder = "Kayıtlarda ara…"; ara.value = kayitArama;
  ara.addEventListener("input", () => {
    kayitArama = ara.value;
    anlamsalSira = null;                 // yazınca metin moduna dön (anlamsal sıralama eskir)
    const c = ara.selectionStart;
    cizKayitlilar();
    const y = out.querySelector(".kayitara");
    if(y){ y.focus(); try{ y.setSelectionRange(c, c); }catch(e){} }
  });
  araSatir.appendChild(ara);
  const semBtn = document.createElement("button");
  semBtn.className = "kayitsem" + (anlamsalSira ? " on" : ""); semBtn.type = "button"; semBtn.textContent = "anlamsal";
  semBtn.title = "Anlamca arama (kelime birebir geçmese de bulur)";
  semBtn.addEventListener("click", anlamsalAra);
  araSatir.appendChild(semBtn);
  out.appendChild(araSatir);
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
  if(q && anlamsalSira){
    // anlamsal mod: benzerliğe göre süz + sırala (kelime birebir geçmese de bulur)
    list = list.filter(f => (anlamsalSira[f.isim] || 0) >= 0.3)
               .sort((x, y) => (anlamsalSira[y.isim] || 0) - (anlamsalSira[x.isim] || 0));
  }else{
    if(q) list = list.filter(f => [f.isim, f.ne, f.neyden, f.derde, f.nedenYok, f.vayBe, f.not, f.alan]
      .filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q));
    list = list.slice().sort((x, y) => (y.puan || 0) - (x.puan || 0));
  }
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

// firecrawl ilhamı: Kaynak'taki URL'i sunucudan çekip temiz metne çevir, kutuyu doldur.
async function urldenCek(){
  const ta = $("#kaynak"), btn = $("#cekUrl");
  if(!ta || !btn) return;
  const url = ta.value.trim();
  if(!/^https?:\/\//i.test(url)){ flash("Önce kaynak kutusuna bir https:// linki yapıştır"); return; }
  const eski = btn.textContent;
  btn.disabled = true; btn.textContent = "Çekiliyor…";
  try{
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 16000);
    const r = await fetch("/api/cek?url=" + encodeURIComponent(url), { signal: ctrl.signal });
    clearTimeout(to);
    const j = await r.json();
    if(j && j.metin){ ta.value = (j.baslik ? j.baslik + "\n\n" : "") + j.metin; flash("Link metni çekildi — şimdi Fikir Üret'e bas"); }
    else flash("Link çekilemedi: " + ((j && j.hata) || "boş içerik"));
  }catch(e){ flash("Link çekilemedi (ağ/zaman aşımı)"); }
  finally{ btn.disabled = false; btn.textContent = eski; }
}

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
  const to = setTimeout(() => ctrl.abort(), sureler().gemini);
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
  const to = setTimeout(() => ctrl.abort(), sureler().poll);
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
  // web-llm: yerel mod açık + WebGPU varsa önce tarayıcıda dene; geçersizse buluta düş
  if(ayarlar.yerel){
    try{ const t = await yerelUret(sistem, kullanici); if(t){ const f = jsonAyikla(t); if(f) return f; } }catch(e){}
  }
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
// ALTYAPI önbellek: aynı arama oturum içinde AĞA ÇIKMADAN anında döner.
const ARA_ONBELLEK = new Map();
const ARA_ONBELLEK_TTL = 10 * 60 * 1000;   // 10 dakika
async function araGetir(q, en){
  let url = "/api/ara?q=" + encodeURIComponent(q);
  if(en) url += "&en=" + encodeURIComponent(en);
  if(ayarlar.sosyal) url += "&sosyal=1";
  const onb = ARA_ONBELLEK.get(url);
  if(onb && Date.now() - onb.t < ARA_ONBELLEK_TTL) return onb.v;   // tekrar eden çağrı → anında (ağ yok)
  try{
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), sureler().ara);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if(r.ok){ const j = await r.json(); if(Array.isArray(j.sonuclar)){ if(j.sonuclar.length) ARA_ONBELLEK.set(url, { t: Date.now(), v: j.sonuclar }); return j.sonuclar; } }
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
    const p = uzmanHeyetiPrompt(alan, fikir, kaynak, arama, patentArama, kur, ayarlar.heyet || ayarlar.tesis, ayarlar.tesis);
    const uz = await zincir(p.sistem, p.kullanici);
    if(uz && uz[0]){
      ["skor", "hukum", "yatirim", "farklilas", "nasil", "maliyet", "benzer", "talep", "patent", "teknik", "prototip", "yapiTaslari"].forEach(k => { if(uz[0][k]) fikir[k] = uz[0][k]; });
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
    ? `<span class="ajanhafiza" title="Daha önce üretilen fikirler hatırlanır, tekrarlanmaz">hafıza: ${uretilmisIsimler.length}</span>` : "";
  statusEl.innerHTML =
    `<div class="ajan"><div class="ajanbaslik"><span>Dünya taranıyor</span>${hafiza}</div>` +
    `<div class="ajanlar">${adimlar}</div>` +
    (alt ? `<div class="ajanalt">${alt}</div>` : "") + `</div>`;
}

// dify ilhamı: 4 aşamalı düzenlenebilir motor. Aç/kapa TARAYICININ yerleşik <details>'i ile
// yapılır (JS toggle yok → hiçbir hata bozamaz). akisCiz yalnız iç düğümleri çizer.
function akisKur(){
  const host = $("#akis");
  if(!host || host.dataset.kuruldu) return;
  host.dataset.kuruldu = "1";
  host.innerHTML =
    `<details class="akisdetay"><summary class="akisbas">Motoru ayarla <span class="akisok"></span><span class="akisetiket">dify</span></summary>` +
    `<div class="akispanel"></div></details>`;
  // ayar değişimi (change tarayıcıda bubbles → delege güvenli)
  host.addEventListener("change", e => {
    const el = e.target.closest("[data-ayar]");
    if(!el) return;
    const k = el.dataset.ayar;
    const v = el.type === "checkbox" ? el.checked : (["adaySayisi", "otoKaydet"].includes(k) ? parseInt(el.value, 10) : el.value);
    ayarSet(k, v);
  });
  akisCiz();
}
function akisCiz(){
  const panel = $("#akis .akispanel");
  if(!panel) return;
  const opt = (deger, secenekler) => secenekler.map(([v, ad]) =>
    `<option value="${v}" ${String(deger) === String(v) ? "selected" : ""}>${ad}</option>`).join("");
  const dugumler = [
    `<select class="akissel" data-ayar="adaySayisi">${opt(ayarlar.adaySayisi, [[3, "3 aday"], [6, "6 aday"], [9, "9 aday"]])}</select>`,
    `<label class="akistgl"><input type="checkbox" data-ayar="eleme" ${ayarlar.eleme ? "checked" : ""}/>eleme</label>`,
    `<select class="akissel" data-ayar="ton">${opt(ayarlar.ton, [["sert", "sert ton"], ["dengeli", "dengeli ton"], ["mizahi", "mizahi ton"]])}</select>`,
    `<label class="akistgl"><input type="checkbox" data-ayar="web" ${ayarlar.web ? "checked" : ""}/>web</label>`
  ];
  const akis = AJAN_ADIMLARI.map((ad, i) =>
    `<div class="akisdugum"><span class="akisik">${i + 1}</span><span class="akisad">${ad}</span>${dugumler[i]}</div>`
  ).join(`<span class="akiswire"></span>`);
  // n8n ilhamı: otomasyon kuralı (skor tetikli oto-kaydet). Toplu üretim artık 'Otomatik üret' butonu.
  const oto = `<div class="akisoto"><div class="akisotobas">Otomasyon · n8n</div>` +
    `<div class="akisdugum"><span class="akisad">Yüksek skoru oto-kaydet</span>` +
      `<select class="akissel" data-ayar="otoKaydet">${opt(ayarlar.otoKaydet, [[0, "kapalı"], [70, "70+"], [80, "80+"], [90, "90+"]])}</select></div>` +
    `<div class="akisdugum"><span class="akisad">Anlamsal mod (deneysel · ilk kullanımda model iner)</span>` +
      `<label class="akistgl"><input type="checkbox" data-ayar="anlamsal" ${ayarlar.anlamsal ? "checked" : ""}/>aç</label></div>` +
    `<div class="akisdugum"><span class="akisad">Yerel LLM (deneysel · WebGPU · büyük indirme)</span>` +
      `<label class="akistgl"><input type="checkbox" data-ayar="yerel" ${ayarlar.yerel ? "checked" : ""}/>aç</label></div>` +
    `<div class="akisdugum"><span class="akisad">Heyet modu (çok ajan · ${PERSONALAR.length} persona havuzu, turda ${HEYET_AJAN} · daha yavaş)</span>` +
      `<label class="akistgl"><input type="checkbox" data-ayar="heyet" ${ayarlar.heyet ? "checked" : ""}/>aç</label></div>` +
    `<div class="akisdugum"><span class="akisad">Sosyal medya ekibi (YouTube altyazı + Bluesky + Lemmy + Instagram/TikTok · yavaş)</span>` +
      `<label class="akistgl"><input type="checkbox" data-ayar="sosyal" ${ayarlar.sosyal ? "checked" : ""}/>aç</label></div></div>`;
  // Hızlandırma: sonuç süresini KULLANICI seçer (kaç dakikada sonuç istiyorsan)
  const hizBlok = `<div class="akisoto"><div class="akisotobas">Hızlandırma</div>` +
    `<div class="akisdugum"><span class="akisad">Sonuç hızı (süreleri sen ayarla)</span>` +
      `<select class="akissel" data-ayar="hiz">${opt(ayarlar.hiz, [["hizli", "Hızlı"], ["dengeli", "Dengeli"], ["derin", "Derin (iyi araştırma)"]])}</select></div></div>`;
  panel.innerHTML = akis + hizBlok + oto;
}

// ---- ragflow ilhamı: akıllı kaynak seçimi (anahtarsız RAG) ----
// Uzun kaynağı cümlelere böler, ALANLA en alakalı kısımları seçip kısaltır;
// böylece belge promptu boğmaz, sadece ilgili bilgi fikre dayanak olur.
function kaynakSec(kaynak, alan){
  const ham = String(kaynak || "").trim();
  if(ham.length <= 500) return ham;                                   // kısa → olduğu gibi
  const parcalar = ham.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 12);
  if(parcalar.length <= 1) return ham.slice(0, 600);
  const kelimeler = String(alan || "").toLocaleLowerCase("tr").split(/[^a-zçğıöşü0-9]+/).filter(w => w.length >= 3);
  const skor = p => {
    const t = p.toLocaleLowerCase("tr");
    let s = 0;
    for(const k of kelimeler) if(t.includes(k)) s += 3;               // alan örtüşmesi
    if(/\d/.test(p)) s += 1;                                          // sayı/ölçü = somut bilgi
    return s;
  };
  const dizi = parcalar.map((p, i) => ({ p, i, s: skor(p) }));
  const eslesme = dizi.some(x => x.s >= 3);
  // alan eşleşmesi varsa SADECE alakalı (skorlu) cümleler; yoksa baştan (belge başı = bağlam)
  const sirali = eslesme ? dizi.filter(x => x.s > 0).sort((a, b) => b.s - a.s) : dizi.slice();
  const secili = []; let uz = 0;
  for(const x of sirali){ if(uz + x.p.length > 700) continue; secili.push(x); uz += x.p.length; if(uz > 550) break; }
  secili.sort((a, b) => a.i - b.i);                                   // okuma akışı için orijinal sıra
  return secili.map(x => x.p).join(" ");
}
// transformers.js Faz 2: kaynağı ANLAMCA (embedding) seç. Model yoksa keyword kaynakSec'e düşer.
async function kaynakSecAnlamsal(kaynak, alan){
  const ham = String(kaynak || "").trim();
  if(ham.length <= 500) return ham;
  const parcalar = ham.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 12);
  if(parcalar.length <= 1) return ham.slice(0, 600);
  const alanVec = await embedet(alan || "ürün fikri");
  if(!alanVec) return kaynakSec(kaynak, alan);                        // model yok → keyword fallback
  const dizi = [];
  for(let i = 0; i < parcalar.length; i++){
    const v = await embedet(parcalar[i]);
    dizi.push({ p: parcalar[i], i, s: v ? kosinus(alanVec, v) : 0 });
  }
  const sirali = dizi.slice().sort((a, b) => b.s - a.s);             // anlamca en yakın önce
  const secili = []; let uz = 0;
  for(const x of sirali){ if(uz + x.p.length > 700) continue; secili.push(x); uz += x.p.length; if(uz > 550) break; }
  secili.sort((a, b) => a.i - b.i);
  return secili.map(x => x.p).join(" ");
}

// transformers.js ilhamı: üretilen fikre ANLAMCA en yakın kayıtlı fikri bul (isim değil, anlam).
// Model yoksa sessizce atlar. Eşik üstü benzerlikte fikir.benzerNot doldurulur.
// transformers.js: üretilen adayları geçmişle (kayıtlı+son üretilen) ve birbiriyle ANLAMCA
// karşılaştırıp çift/benzer fikirleri eler. Model yoksa eleme yapmaz (adaylar aynen döner).
async function tekrarEle(adaylar){
  if(!Array.isArray(adaylar) || adaylar.length < 2) return adaylar;
  const metin = a => ((a && a.isim || "") + " " + (a && a.ne || "")).trim();
  const adayVecler = [];
  for(const a of adaylar) adayVecler.push(await embedet(metin(a)));
  if(adayVecler.every(v => !v)) return adaylar;                 // model yok → eleme yok
  const gecmis = [], gor = new Set();
  for(const f of favleriYukle().concat(sonUretilen.slice(0, 20))){
    if(f && f.isim && !gor.has(f.isim)){ gor.add(f.isim); const v = await embedet(metin(f)); if(v) gecmis.push(v); }
  }
  const tut = benzerleriEle(adayVecler, gecmis, 0.86);
  const elenmis = tut.map(i => adaylar[i]);
  return elenmis.length ? elenmis : adaylar;                    // hepsi elenirse orijinali koru
}
async function benzerKaydiBul(fikir){
  try{
    const vec = await embedet((fikir.isim || "") + " " + (fikir.ne || ""));
    if(!vec) return;
    const liste = [];
    for(const f of favleriYukle()){
      if(f.isim === fikir.isim) continue;
      const v = await embedet((f.isim || "") + " " + (f.ne || ""));
      if(v) liste.push({ vec: v, isim: f.isim });
    }
    const y = enYakin(vec, liste);
    if(y.i >= 0 && y.skor >= 0.82) fikir.benzerNot = liste[y.i].isim + " (%" + Math.round(y.skor * 100) + " anlamca benzer)";
  }catch(e){}
}

// Akıllı niyet yorumlayıcı: "X ve Y'yi birleştir" / serbest alan isteğini ayırt eder.
// Birleştirme niyetinde üreticiye GÜÇLÜ yönerge verir → zekice harman, basit/saçma değil.
function istekYorumla(girdi){
  const g = String(girdi || "").trim();
  if(!g) return { tip: "bos", yonerge: "" };
  const birlesme = /birleştir|harmanla|kombin|birleşim|mezc|\bartı\b|\+|melez/i.test(g);
  const parcalar = g.split(/\s*(?:\+|,|\bve\b|\bile\b|\bartı\b)\s*/i)
    .map(s => s.replace(/birleştir\w*|harmanla\w*|kombin\w*|melez\w*|üret\w*|yap\w*|bir ürün|ürün(ü|ler)?|fikir|tasarla\w*/gi, "").trim())
    .filter(s => s.length >= 2);
  if(birlesme && parcalar.length >= 2){
    return { tip: "birlestir", parcalar,
      yonerge: `Kullanıcı ŞU nesneleri/ürünleri BİRLEŞTİREN tek bir ürün istiyor: ${parcalar.join(" + ")}. Bu öğeleri ZEKİCE ve beklenmedik ama GERÇEKTEN işe yarar şekilde harmanla; her aday bu birleşimi somut biçimde içersin. Zorlama, bariz, oyuncak gibi ya da saçma birleşim YASAK — gerçek bir derde çözüm olsun.` };
  }
  return { tip: "alan", yonerge: "" };
}

// ÜST SEVİYE: araştırma ordusunu ÜRETİCİ aşamasına besle — alan için gerçek sinyaller
// (ConceptNet ilişkileri + Reddit/DIY/Soru dertleri) toplanıp üreticiye ilham olur.
const ILHAM_SEED = ["mutfak", "banyo", "ev", "araba", "çocuk", "bahçe", "ofis", "sokak", "yaşlılar", "evcil hayvan"];
async function ureticiIlham(alan){
  if(!ayarlar.web) return "";
  const konu = alan || ILHAM_SEED[Math.floor(Math.random() * ILHAM_SEED.length)];
  let sonuc = [];
  try{ sonuc = await Promise.race([araGetir(konu, konu), new Promise(r => setTimeout(() => r([]), sureler().ilham))]); }catch(e){ sonuc = []; }   // üretici ilhamı: hız profiline göre
  if(!sonuc.length) return "";
  const al = (re, n) => sonuc.filter(s => re.test(s.baslik)).slice(0, n).map(s => s.baslik.replace(/^[^:]+:\s*/, "").trim()).filter(Boolean);
  const iliski = al(/^İlişkili:/, 5);
  const dert = al(/^(Soru:|DIY:|Elektronik:|Reddit:)/, 5);
  const parca = [];
  if(iliski.length) parca.push("ilişkili kavramlar (harman için): " + iliski.join(", "));
  if(dert.length) parca.push("gerçek dertler/sorular: " + dert.join(" | "));
  return parca.join(". ");
}

let calisiyor = false;
function uretButonKilit(d){ ["#gen", "#genTesis"].forEach(s => { const b = $(s); if(b) b.disabled = d; }); }
async function uret(){
  if(calisiyor) return;
  if(mod !== "yeni") setMod("yeni");
  calisiyor = true;
  uretButonKilit(true);
  const alan = alanInput.value.trim();
  const kaynakHam = (($("#kaynak") && $("#kaynak").value) || "").trim();
  const kaynak = ayarlar.anlamsal ? await kaynakSecAnlamsal(kaynakHam, alan) : kaynakSec(kaynakHam, alan);   // ragflow: alakalı kısmı seç (anlamsal/keyword)
  const mesajlar = ayarlar.tesis ? [
    "Yatırım heyeti toplanıyor…",
    "Ziraat & su ürünleri uzmanları sahada…",
    "Maliyet ve geri ödeme hesaplanıyor…",
    "İhracat pazarları taranıyor…",
    "Teşvik ve ruhsatlar çıkarılıyor…",
    "En kârlı tesis dosyası hazırlanıyor…"
  ] : [
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
  const hizli = ayarlar.hiz === "hizli";   // Hızlı profili: web + eleştirmen atlanır, tek üretici (Dengeli/Derin'de hepsi çalışır)

  try{
  // 1. AŞAMA: aday fikir üretimi (ajan hafızası: beğenilen kayıtlar üreticiye pozitif sinyal)
  const begenilen = favleriYukle().filter(f => f.puan >= 4 || f.durum === "Geliştirilecek").map(f => f.isim).filter(Boolean);
  const yonerge = istekYorumla(alan).yonerge;          // "X+Y birleştir" gibi niyeti güçlü yönergeye çevir
  const ilham = hizli ? "" : await ureticiIlham(alan); // Hızlı: web araştırması atla; değilse araştırma ordusu → üreticiye sinyaller
  const premium = ayarlar.heyet || ayarlar.tesis;   // tesis = premium altyapı: ordu + geniş heyet otomatik
  let adaylar = null;
  if(premium && !hizli){
    // çok-ajan: persona ORDUSU paralel üretir → adaylar havuzda birleşir (tesiste otomatik)
    const dilimler = await Promise.all(personaSec().map(persona => {
      const p = ureticiPrompt(alan, uretilmisIsimler, kaynak, begenilen, ayarlar.adaySayisi, kalipVurgu(), persona, ilham, yonerge, ayarlar.tesis);
      return zincir(p.sistem, p.kullanici);
    }));
    const havuz = [];
    for(const arr of dilimler){ if(Array.isArray(arr)) for(const a of arr) if(a && a.isim) havuz.push(a); }
    if(havuz.length) adaylar = havuz;
  }
  for(let d = 1; d <= 2 && !adaylar; d++){              // tekli üretici (heyet kapalı ya da havuz boş)
    const p = ureticiPrompt(alan, uretilmisIsimler, kaynak, begenilen, ayarlar.adaySayisi, kalipVurgu(), null, ilham, yonerge, ayarlar.tesis);
    adaylar = await zincir(p.sistem, p.kullanici);
    if(!adaylar && d < 2) await bekle(3000);
  }
  // anlamsal tekrar-eleme: geçmişe/birbirine ANLAMCA benzer adayları at (model varsa)
  if(adaylar && ayarlar.anlamsal) adaylar = await tekrarEle(adaylar);
  if(adaylar){ asama = 1; ajanCiz(asama, mesajlar[mi]); }
  // tekrarı önlemek için aday isimlerini de hatırla
  if(adaylar) adaylar.forEach(a => { if(a.isim) uretilmisIsimler.push(a.isim); });

  // 2. AŞAMA: KIRMIZI TAKIM eleştirmen — zayıf/klişe/yapılamaz adayları ele, kalanı keskinleştir
  let suzulmus = null;
  if(adaylar && ayarlar.eleme && !hizli){
    for(let d = 1; d <= 2 && !suzulmus; d++){
      const p = elestirmenPrompt(alan, adaylar, kaynak, premium, ayarlar.tesis);
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
      const p = ustAkilPrompt(alan, suzulmus, kaynak, ayarlar.ton, ilham, ayarlar.tesis);
      fikirler = await zincir(p.sistem, p.kullanici);
      if(!fikirler && d < 2) await bekle(3000);
    }
    if(!fikirler) fikirler = suzulmus.slice(0, 1); // üst akıl olmazsa en iyi adayı göster
  }
  if(fikirler){ asama = 3; ajanCiz(asama, mesajlar[mi]); }

  // 4. AŞAMA: UZMAN HEYETİ — fikri web destekli mühendislik gözüyle zenginleştir (diyalog korunur)
  if(fikirler && fikirler.length){
    fikirler[0].alan = alan || "Sınırsız";     // filtre için üretildiği alanı etiketle
    if(ayarlar.tesis) fikirler[0].tesis = true; // tesis kartı → etiketler tesise uyarlanır
    if(ilham) fikirler[0].ilham = ilham;       // sahadan beslenen sinyaller (kartta gösterilir)
    await uzmanlastir(alan, fikirler[0], kaynak, hizli ? false : ayarlar.web);
    asama = 4; ajanCiz(asama, mesajlar[mi]);   // tüm aşamalar bitti
  }

  if(fikirler && fikirler.length){
    const fikir = fikirler[0];                 // TEK fikir
    sonUretilen.unshift(fikir);                // birer birer: yenisi en üste
    if(fikir.isim) uretilmisIsimler.push(fikir.isim);
    if(uretilmisIsimler.length > 80) uretilmisIsimler = uretilmisIsimler.slice(-80);
    // n8n otomasyon: skoru eşik üstündeyse fikri otomatik kaydet (trigger → action)
    if(ayarlar.otoKaydet && parseInt(fikir.skor, 10) >= ayarlar.otoKaydet && !favMi(fikir.isim)) favToggle(fikir);
    // transformers.js: anlamsal mod açıksa, kayıtlılar arasında anlamca benzer var mı?
    if(ayarlar.anlamsal) await benzerKaydiBul(fikir);
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
  }catch(e){
    // beklenmedik hata: motor ASLA takılı kalmasın, kullanıcıya tekrar dene sun
    try{
      statusEl.innerHTML = "Bir aksilik oldu — ";
      const b = document.createElement("button");
      b.className = "retry"; b.textContent = "Tekrar dene";
      b.addEventListener("click", uret);
      statusEl.appendChild(b);
    }catch(_){}
  }finally{
    clearInterval(dongu);   // spinner her hâlükârda durur
    calisiyor = false;      // kilit her hâlükârda açılır
    uretButonKilit(false);
  }
}

// n8n otomasyon: "Otomatik üret" → arka arkaya N fikir üretir (varsayılan 3)
async function uretCoklu(n){
  if(calisiyor) return;
  n = Math.max(1, parseInt(n, 10) || 3);
  const b = $("#genOto"); if(b) b.disabled = true;
  try{ for(let i = 0; i < n; i++){ await uret(); } }
  finally{ if(b) b.disabled = false; }
}
// İki AYRI üret butonu: ilgili moda geçip üretir (Fikir Üret = ürün, 🏭 Tesis Üret = tesis)
function uretModda(tesisMi){
  if(calisiyor) return;
  if(!!ayarlar.tesis !== !!tesisMi){
    ayarlar.tesis = !!tesisMi; ayarKaydet(); tesisGuncelle();
    if(mod === "kayit") cizKayitlilar(); else cizFikirler(sonUretilen);
  }
  uret();
}
$("#gen").addEventListener("click", () => uretModda(false));
const _tesisBtn = $("#genTesis");
if(_tesisBtn) _tesisBtn.addEventListener("click", () => uretModda(true));
const _otoBtn = $("#genOto");
if(_otoBtn) _otoBtn.addEventListener("click", () => uretCoklu(3));
$("#temaKaydet").addEventListener("click", temaFormAc);
$("#temaOnay").addEventListener("click", temaOnayla);
$("#temaIptal").addEventListener("click", temaFormKapat);
const _cekBtn = $("#cekUrl");
if(_cekBtn) _cekBtn.addEventListener("click", urldenCek);
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

// PWA service worker — yeni sürüm yayınlanınca sayfayı BİR KEZ otomatik tazeler
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    const ilkKontrol = navigator.serviceWorker.controller;   // zaten kontrol eden SW var mıydı?
    navigator.serviceWorker.register("/sw.js").then(reg => { try{ reg.update(); }catch(e){} }).catch(() => {});
    let yenilendi = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if(yenilendi || !ilkKontrol) return;   // ilk kurulumda DEĞİL, sadece güncellemede tazele
      yenilendi = true;
      try{ window.location.reload(); }catch(e){}
    });
  });
}

// init — her adım izole; biri patlasa diğerleri (ve buton bağlamaları) çalışmaya devam etsin
try{ favleriKaydet(favleriYukle()); }catch(e){}
try{ oturumYukle(); }catch(e){}
try{ ayarYukle(); }catch(e){}
try{ tesisGuncelle(); }catch(e){}
try{ kaliplarCiz(); }catch(e){}
try{ akisKur(); }catch(e){}
try{ cizTemalar(); }catch(e){}
try{ cizFikirler(sonUretilen); }catch(e){}
