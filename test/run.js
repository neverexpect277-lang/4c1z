// 4c1z test koşucusu — app.js mantığını gerçek DOM + localStorage (jsdom) ile test eder.
// Çalıştır:  npm test
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const REPO = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(name, cond){ if(cond){ pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } }

function yeniDom(){
  const html = fs.readFileSync(path.join(REPO, "index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  const w = dom.window;
  w.eval(fs.readFileSync(path.join(REPO, "prompt.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(REPO, "embed.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(REPO, "wllm.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(REPO, "app.js"), "utf8"));
  return w;
}

// ---- #1 Durum etiketi ----
console.log("\n#1 — Durum etiketi");
(function(){
  const w = yeniDom();
  const fikir = { isim: "Test Fikri", ne: "açıklama", neyden: "x+y", diyalog: [] };
  w.favToggle(fikir);
  ok("fav eklendi", w.favleriYukle().length === 1);

  w.setMod("kayit");
  const card = w.document.querySelector("#out .card");
  ok("kayıt kartı çizildi", !!card);
  const btns = card.querySelectorAll("[data-durum]");
  ok("3 durum butonu var", btns.length === 3);
  ok("buton etiketleri doğru", [...btns].map(b => b.dataset.durum).join(",") === "Ham,Geliştirilecek,Çöp");
  ok("başta hiçbiri seçili değil", card.querySelectorAll(".durum.on").length === 0);

  [...btns].find(b => b.dataset.durum === "Geliştirilecek").click();
  ok("durum veriye yazıldı", w.favleriYukle()[0].durum === "Geliştirilecek");
  const card2 = w.document.querySelector("#out .card");
  ok("seçili buton işaretlendi", card2.querySelector(".durum.on")?.dataset.durum === "Geliştirilecek");
  ok("sadece 1 buton seçili", card2.querySelectorAll(".durum.on").length === 1);

  card2.querySelector('[data-durum="Geliştirilecek"]').click();
  ok("tekrar tıkla → durum kalktı", (w.favleriYukle()[0].durum || "") === "");

  w.document.querySelector('#out .card [data-durum="Çöp"]').click();
  ok("Çöp atandı", w.favleriYukle()[0].durum === "Çöp");

  const ls = w.localStorage.getItem("mucit_favoriler");
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_favoriler", ls);
  w2.setMod("kayit");
  ok("durum kalıcı (yeni oturumda Çöp seçili)",
     w2.document.querySelector("#out .card .durum.on")?.dataset.durum === "Çöp");

  w2.cizFikirler([fikir]);
  ok("kart çizildi (yeni mod)", !!w2.document.querySelector("#out .card"));
  ok("Yeni Fikirler'de durum butonu yok", w2.document.querySelectorAll("#out [data-durum]").length === 0);
})();

// ---- "Önerilen Fikirler" başlığı ----
console.log("\nÖnerilen Fikirler başlığı");
(function(){
  const w = yeniDom();
  const b = w.document.querySelector("#onerilenBaslik");
  ok("başta başlık gizli (fikir yok)", b.hidden === true);

  w.cizFikirler([{ isim: "F1", ne: "a" }, { isim: "F2", ne: "b" }]);
  ok("Yeni'de fikir varken kutu görünür", b.hidden === false);
  ok("sayaç doğru (2)", w.document.querySelector("#onerilenSay").textContent === "(2)");
  ok("başlık metni 'Önerilen Fikirler'", /Önerilen Fikirler/.test(b.textContent));
  // fikirler kutu içinde GİZLİ (ana sayfada gözükmez)
  ok("fikirler varsayılan GİZLİ (#out display:none)", w.document.querySelector("#out").style.display === "none");
  ok("kutu kapalı göstergesi (acik değil)", !b.classList.contains("acik"));
  b.click();
  ok("kutuya basınca fikirler AÇILIR", w.document.querySelector("#out").style.display !== "none" && b.classList.contains("acik"));
  b.click();
  ok("tekrar basınca kapanır", w.document.querySelector("#out").style.display === "none");

  w.favToggle({ isim: "F1", ne: "a" });
  w.setMod("kayit");
  ok("Kayıtlılar sekmesinde kutu gizli", b.hidden === true);
  ok("Kayıtlılar'da #out görünür", w.document.querySelector("#out").style.display !== "none");
})();

// ---- Katlanabilir kart + etiket temizliği ----
console.log("\nKatlanabilir kart + etiket temizliği");
(function(){
  const w = yeniDom();
  ok("metin() model etiketlerini temizler (<h4>)", w.metin("nasıl olacak?<h4></h4>") === "nasıl olacak?");
  ok("escapeHtml kullanıcı '<' metnini korur", w.escapeHtml("a < b") === "a &lt; b");

  w.cizFikirler([
    { isim: "Yeni", ne: "n", diyalog: [{ kim: "Zeyneb", soz: "soru var mı?<h4></h4>" }] },
    { isim: "Eski", ne: "e" }
  ]);
  const k = w.document.querySelectorAll("#out .card");
  ok("en yeni kart AÇIK", !k[0].classList.contains("kapali"));
  ok("eski kart KAPALI", k[1].classList.contains("kapali"));
  ok("diyalogdan <h4> temizlendi", !/h4/.test(k[0].querySelector(".dia").innerHTML) && /soru var mı\?/.test(k[0].textContent));

  k[1].querySelector("h2").click();
  ok("eski başlığa tıkla → açıldı", !k[1].classList.contains("kapali"));
  k[0].querySelector("h2").click();
  ok("yeni başlığa tıkla → kapandı", k[0].classList.contains("kapali"));

  k[0].classList.remove("kapali");
  k[0].querySelector('[data-act="fav"]').click();
  ok("yıldıza basınca KATLANMAZ", !k[0].classList.contains("kapali"));
})();

// ---- #2 Puan + sıralama ----
console.log("\n#2 — Puan ve sıralama");
(function(){
  const w = yeniDom();
  w.favToggle({ isim: "A", ne: "a" });
  w.favToggle({ isim: "B", ne: "b" });
  w.favToggle({ isim: "C", ne: "c" });
  w.setMod("kayit");

  const card = w.document.querySelector("#out .card");
  ok("5 yıldız var", card.querySelectorAll("[data-puan]").length === 5);
  ok("başta puan yok", card.querySelectorAll(".puan.on").length === 0);

  const isimler = () => [...w.document.querySelectorAll("#out .card h2")].map(h => h.textContent.trim());
  ok("başlangıç sırası C,B,A", isimler().slice(0, 3).join(",") === "C,B,A");

  const kartA = [...w.document.querySelectorAll("#out .card")].find(c => c.querySelector("h2").textContent.includes("A"));
  kartA.querySelector('[data-puan="5"]').click();
  ok("A puanı 5", w.favleriYukle().find(f => f.isim === "A").puan === 5);
  ok("A en üste çıktı", isimler()[0].startsWith("A"));
  ok("A kartında 5 yıldız dolu", w.document.querySelector("#out .card").querySelectorAll(".puan.on").length === 5);

  const kartB = [...w.document.querySelectorAll("#out .card")].find(c => c.querySelector("h2").textContent.includes("B"));
  kartB.querySelector('[data-puan="3"]').click();
  ok("sıralama A,B,C (puana göre)", isimler().slice(0, 3).join(",") === "A,B,C");

  const kartB2 = [...w.document.querySelectorAll("#out .card")].find(c => c.querySelector("h2").textContent.includes("B"));
  kartB2.querySelector('[data-puan="3"]').click();
  ok("aynı yıldız → puan 0", w.favleriYukle().find(f => f.isim === "B").puan === 0);

  const ls = w.localStorage.getItem("mucit_favoriler");
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_favoriler", ls);
  w2.setMod("kayit");
  ok("puan kalıcı (A hâlâ 5, en üstte)",
     w2.document.querySelector("#out .card").querySelectorAll(".puan.on").length === 5);

  w2.cizFikirler([{ isim: "X", ne: "x" }]);
  ok("Yeni Fikirler'de puan butonu yok", w2.document.querySelectorAll("#out [data-puan]").length === 0);
})();

// ---- #3 Kişisel not ----
console.log("\n#3 — Kişisel not");
(function(){
  const w = yeniDom();
  w.favToggle({ isim: "Notlu", ne: "n" });
  w.setMod("kayit");
  const ta = w.document.querySelector("#out .not");
  ok("not textarea var", !!ta);
  ok("başta boş", ta.value === "");

  ta.focus();
  ta.value = "Bunu pazara sor";
  ta.dispatchEvent(new w.Event("input"));
  ok("not veriye kaydedildi", w.favleriYukle()[0].not === "Bunu pazara sor");
  ok("yazarken yeniden çizilmedi (aynı node)", w.document.querySelector("#out .not") === ta);
  ok("yazarken focus korundu", w.document.activeElement === ta);

  w.favNotSet("Notlu", "a < b & </textarea> c");
  const ls = w.localStorage.getItem("mucit_favoriler");
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_favoriler", ls);
  w2.setMod("kayit");
  ok("not kalıcı + güvenli render", w2.document.querySelector("#out .not").value === "a < b & </textarea> c");

  w2.cizFikirler([{ isim: "X", ne: "x" }]);
  ok("Yeni Fikirler'de not yok", w2.document.querySelectorAll("#out .not").length === 0);
})();

// ---- #4 Alan etiketi + filtre ----
console.log("\n#4 — Alan etiketi + filtre");
(function(){
  const w = yeniDom();
  w.favToggle({ isim: "M1", ne: "x", alan: "mutfak" });
  w.favToggle({ isim: "A1", ne: "y", alan: "araba" });
  w.favToggle({ isim: "M2", ne: "z", alan: "mutfak" });
  w.favToggle({ isim: "Eski", ne: "e" });
  w.setMod("kayit");

  const filtreler = w.document.querySelectorAll("#out .filtreler [data-f]");
  ok("filtre çubuğu çıktı", filtreler.length > 0);
  ok("Tümü + 3 alan = 4 buton", filtreler.length === 4);
  const kartSay = () => w.document.querySelectorAll("#out .card").length;
  ok("Tümü'nde 4 kart", kartSay() === 4);

  [...filtreler].find(b => b.dataset.f === "mutfak").click();
  ok("mutfak → 2 kart", kartSay() === 2);
  ok("mutfak butonu aktif", w.document.querySelector('#out [data-f="mutfak"]').classList.contains("on"));
  ok("sadece M1, M2", [...w.document.querySelectorAll("#out .card h2")].map(h => h.textContent.trim()).every(i => i.startsWith("M")));

  w.document.querySelector('#out [data-f="Sınırsız"]').click();
  ok("Sınırsız → 1 kart (Eski)", kartSay() === 1);

  w.document.querySelector('#out [data-f=""]').click();
  ok("Tümü → 4 kart", kartSay() === 4);

  const w2 = yeniDom();
  w2.favToggle({ isim: "Tek", ne: "t", alan: "mutfak" });
  w2.setMod("kayit");
  ok("tek alanda filtre çubuğu yok", w2.document.querySelectorAll("#out .filtreler").length === 0);
})();

// ---- #5 Metin arama ----
console.log("\n#5 — Metin arama");
(function(){
  const w = yeniDom();
  w.favToggle({ isim: "Akıllı Tava", ne: "yemek pişirir", alan: "mutfak" });
  w.favToggle({ isim: "Oto Şemsiye", ne: "yağmurda açılır", alan: "araba" });
  w.favToggle({ isim: "Sessiz Saat", ne: "titreşimle uyandırır", alan: "ev" });
  w.setMod("kayit");

  const ara = w.document.querySelector("#out .kayitara");
  ok("arama kutusu var", !!ara);
  const kartSay = () => w.document.querySelectorAll("#out .card").length;
  ok("başta 3 kart", kartSay() === 3);

  ara.focus(); ara.value = "tava"; ara.setSelectionRange(4, 4);
  ara.dispatchEvent(new w.Event("input"));
  ok("'tava' → 1 kart", kartSay() === 1);
  ok("doğru kart (Akıllı Tava)", w.document.querySelector("#out .card h2").textContent.includes("Akıllı Tava"));
  ok("arama sonrası focus korundu", w.document.activeElement.classList.contains("kayitara"));
  ok("imleç konumu korundu", w.document.activeElement.selectionStart === 4);

  const ara2 = w.document.querySelector("#out .kayitara");
  ara2.value = "YAĞMUR"; ara2.dispatchEvent(new w.Event("input"));
  ok("'YAĞMUR' (büyük) → açıklamada bulur", kartSay() === 1);
  ok("doğru kart (Oto Şemsiye)", w.document.querySelector("#out .card h2").textContent.includes("Oto Şemsiye"));

  const ara3 = w.document.querySelector("#out .kayitara");
  ara3.value = "xyzxyz"; ara3.dispatchEvent(new w.Event("input"));
  ok("eşleşme yok → 0 kart", kartSay() === 0);
  ok("'Eşleşen fikir yok' mesajı", !!w.document.querySelector("#out .bossonuc"));

  const ara4 = w.document.querySelector("#out .kayitara");
  ara4.value = ""; ara4.dispatchEvent(new w.Event("input"));
  ok("temizle → 3 kart", kartSay() === 3);

  w.document.querySelector('#out [data-f="mutfak"]').click();
  ok("mutfak filtresi → 1 kart", kartSay() === 1);
  const ara5 = w.document.querySelector("#out .kayitara");
  ara5.value = "saat"; ara5.dispatchEvent(new w.Event("input"));
  ok("mutfak + 'saat' → 0 (VE mantığı)", kartSay() === 0);
  const ara6 = w.document.querySelector("#out .kayitara");
  ara6.value = "tava"; ara6.dispatchEvent(new w.Event("input"));
  ok("mutfak + 'tava' → 1", kartSay() === 1);
})();

// ---- #6 Temalar (inline input) ----
console.log("\n#6 — Temalar (inline input)");
(function(){
  const w = yeniDom();
  const alan = w.document.querySelector("#alan");
  const kaynak = w.document.querySelector("#kaynak");
  const kaydetBtn = w.document.querySelector("#temaKaydet");
  const form = w.document.querySelector("#temaForm");
  const adInp = w.document.querySelector("#temaAd");
  const onay = w.document.querySelector("#temaOnay");
  const iptal = w.document.querySelector("#temaIptal");

  alan.value = ""; kaynak.value = "";
  kaydetBtn.click();
  ok("boş ayarda form açılmaz", form.hidden === true);
  ok("boş ayar kaydetmez", w.temalarYukle().length === 0);

  alan.value = "mutfak"; kaynak.value = "akıllı tava notları";
  kaydetBtn.click();
  ok("form açıldı", form.hidden === false);
  ok("kaydet butonu gizlendi", kaydetBtn.hidden === true);
  ok("ad alanı alanla dolu", adInp.value === "mutfak");

  adInp.value = "Mutfak İşleri";
  onay.click();
  ok("tema kaydedildi", w.temalarYukle().length === 1 && w.temalarYukle()[0].ad === "Mutfak İşleri");
  ok("form kapandı", form.hidden === true && kaydetBtn.hidden === false);
  ok("çip göründü", w.document.querySelectorAll("#temalar .tema").length === 1);

  alan.value = "banyo"; kaydetBtn.click();
  adInp.value = "  ";
  onay.click();
  ok("boş ad kaydetmez", w.temalarYukle().length === 1);
  iptal.click();
  ok("iptal → form kapandı", form.hidden === true);

  alan.value = "araba"; kaynak.value = "k"; kaydetBtn.click();
  adInp.value = "Araba";
  adInp.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter" }));
  ok("Enter ile kaydedildi", w.temalarYukle().some(t => t.ad === "Araba"));

  kaydetBtn.click();
  const oncekiSayi = w.temalarYukle().length;
  adInp.value = "Vazgeç";
  adInp.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape" }));
  ok("Escape → kapandı, kaydetmedi", form.hidden === true && w.temalarYukle().length === oncekiSayi);

  alan.value = "xxx"; kaynak.value = "yyy";
  [...w.document.querySelectorAll("#temalar .tema-ad")].find(s => s.textContent === "Mutfak İşleri").click();
  ok("tema yükle → alan+kaynak", alan.value === "mutfak" && kaynak.value === "akıllı tava notları");

  // aynı ad → güncelle (çoğalmaz)
  alan.value = "mutfak2"; kaynak.value = "yeni"; kaydetBtn.click();
  adInp.value = "Mutfak İşleri"; onay.click();
  ok("aynı ad → güncelledi, çoğalmadı", w.temalarYukle().filter(t => t.ad === "Mutfak İşleri").length === 1);
  ok("güncel değer", w.temalarYukle().find(t => t.ad === "Mutfak İşleri").alan === "mutfak2");

  const cip = [...w.document.querySelectorAll("#temalar .tema")].find(t => t.querySelector(".tema-ad").textContent === "Araba");
  cip.querySelector("[data-sil]").click();
  ok("tema silindi", !w.temalarYukle().some(t => t.ad === "Araba"));

  const ls = w.localStorage.getItem("mucit_temalar");
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_temalar", ls);
  w2.cizTemalar();
  ok("tema kalıcı + init'te çizilir", w2.document.querySelectorAll("#temalar .tema").length === w.temalarYukle().length);
})();

// ---- BIRLEŞİK: 6 özellik tek fikir üzerinde ----
console.log("\nBİRLEŞİK — hepsi bir arada");
(function(){
  const w = yeniDom();
  w.document.querySelector("#alan").value = "mutfak";
  w.document.querySelector("#kaynak").value = "tava notu";
  w.document.querySelector("#temaKaydet").click();
  w.document.querySelector("#temaAd").value = "Mutfak";
  w.document.querySelector("#temaOnay").click();
  ok("#6 tema kaydedildi", w.temalarYukle().length === 1);

  w.favToggle({ isim: "Akıllı Tava", ne: "yemek pişirir", neyden: "tava+sensör", alan: "mutfak" });
  w.favToggle({ isim: "Oto Şemsiye", ne: "yağmurda açılır", neyden: "şemsiye+motor", alan: "araba" });
  w.setMod("kayit");

  const bul = () => [...w.document.querySelectorAll("#out .card")].find(c => c.querySelector("h2").textContent.includes("Akıllı Tava"));
  bul().querySelector('[data-puan="4"]').click();
  bul().querySelector('[data-durum="Geliştirilecek"]').click();
  const nt = bul().querySelector(".not"); nt.value = "patent araştır"; nt.dispatchEvent(new w.Event("input"));

  const kayit = w.favleriYukle().find(f => f.isim === "Akıllı Tava");
  ok("#1+#2+#3 hepsi tek objede", kayit.puan === 4 && kayit.durum === "Geliştirilecek" && kayit.not === "patent araştır");
  ok("#4 alan etiketi korundu", kayit.alan === "mutfak");

  w.document.querySelector('#out [data-f="mutfak"]').click();
  const ara = w.document.querySelector("#out .kayitara");
  ara.value = "patent"; ara.dispatchEvent(new w.Event("input"));
  ok("#5 arama nota da bakar + #4 ile birlikte → 1 kart", w.document.querySelectorAll("#out .card").length === 1);

  const lsF = w.localStorage.getItem("mucit_favoriler"), lsT = w.localStorage.getItem("mucit_temalar");
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_favoriler", lsF);
  w2.localStorage.setItem("mucit_temalar", lsT);
  w2.cizTemalar(); w2.setMod("kayit");
  const k2 = w2.favleriYukle().find(f => f.isim === "Akıllı Tava");
  ok("yeni oturumda her şey kalıcı",
     k2.puan === 4 && k2.durum === "Geliştirilecek" && k2.not === "patent araştır" && k2.alan === "mutfak"
     && w2.temalarYukle().length === 1);
})();

// ---- uret() boru hattı: 4 aşama (üretici → eleştirmen → üst akıl → uzman heyeti + web) ----
console.log("\nuret() — 4 aşamalı boru hattı (fetch stub)");
function stubUret(w, opts = {}){
  const cag = [];          // /api/gen prompt metinleri
  const state = { n: 0, aramaCagrildi: false, patentArandi: false, enGecti: false };
  w.fetch = async (url, o) => {
    if(/frankfurter\.app/.test(url)){ state.kurCagrildi = true; return { ok: true, status: 200, json: async () => ({ rates: { TRY: 34 } }) }; }
    if(url.startsWith("/api/ara")){
      state.aramaCagrildi = true;
      if(opts.aramaHata) throw new Error("ağ yok");
      const patentSorgu = /patents\.google\.com/.test(decodeURIComponent(url));
      if(patentSorgu) state.patentArandi = true;
      else if(/[?&]en=/.test(url)) state.enGecti = true;   // genel aramaya İngilizce kelime bağlandı mı
      return { ok: true, status: 200, json: async () => ({
        sonuclar: patentSorgu
          ? (opts.patentSonuc || [{ baslik: "US1234 Akıllı Tava Patenti", ozet: "benzer patent var" }])
          : (opts.sonuclar || [{ baslik: "Mevcut Ürün X", ozet: "benzer bir şey" }])
      }) };
    }
    state.n++;
    cag.push(JSON.parse(o.body).text);
    let text;
    if(state.n === 1) text = JSON.stringify(Array.from({ length: 6 }, (_, i) => ({ isim: "Aday" + i, ne: "a", neyden: "x+y" })));
    else if(state.n === 2) text = JSON.stringify(Array.from({ length: 3 }, (_, i) => ({ isim: "Süzülmüş" + i, ne: "s", neyden: "p+q" })));
    else if(state.n === 3) text = JSON.stringify([{ isim: "Final Fikir", ne: "sonuç", neyden: "a+b", aramaEN: "smart pan sensor", diyalog: [{ kim: "Çavuş", soz: "hah" }, { kim: "Zeyneb", soz: "ikna oldum" }] }]);
    else text = JSON.stringify([{ isim: "Final Fikir", skor: "84", hukum: "güçlü dert, zayıf rakip · risk: ısıl", farklilas: "sensörü mıknatısla çıkarılabilir yap", nasil: "X+Y parçalarıyla", maliyet: "100-200 TL", benzer: "Mevcut Ürün X", talep: "aramada çok sonuç var, talep yüksek", patent: "US1234 benzer patent var", teknik: "kritik kısıt ısıl dayanım, geçer", prototip: "karton maket yap", yapiTaslari: "Arduino + DHT nem kütüphanesi; okuma kolaylaşır" }]);
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) };
  };
  return { cag, state };
}

// ---- #7 ragflow ilhamı: akıllı kaynak seçimi (anahtarsız RAG) ----
console.log("\n#7 — Akıllı kaynak seçimi (ragflow ilhamı)");
(function(){
  const w = yeniDom();
  // Kısa kaynak değişmeden döner
  ok("kısa kaynak olduğu gibi döner", w.kaynakSec("kısa bir not", "mutfak") === "kısa bir not");

  // Uzun kaynak: alanla alakalı cümleler seçilir, alakasızlar elenir
  const uzun = [
    "Mutfakta tezgah çok dağınık oluyor ve bıçaklar tehlikeli duruyor.",
    "Köpeğim parkta çok koşuyor ve sonra çok yoruluyor zavallı.",
    "Tavalar dolapta çok yer kaplıyor, mutfak düzenini kurmak zor.",
    "Hava bugün çok güzel olduğu için ailecek denize gittik.",
    "Bulaşık süngeri 3 günde mutfakta bakteri topluyor, hijyen sorun."
  ].join(" ") + " " + "z".repeat(500);   // 500+ alakasız dolgu → kaynak 'uzun' sayılır
  const sec = w.kaynakSec(uzun, "mutfak");
  ok("uzun kaynaktan alanla alakalı cümle seçildi", /tezgah|tava|bulaşık/i.test(sec));
  ok("alakasız cümleler elendi (köpek/deniz)", !/köpeğim|denize gittik/i.test(sec));
  ok("alakasız uzun dolgu elendi", !/zzzz/.test(sec));
  ok("çıktı kısaltıldı (belge promptu boğmuyor)", sec.length < uzun.length);
  ok("seçilen cümleler okuma sırasını korur", sec.indexOf("tezgah") < sec.indexOf("Bulaşık"));

  // Alan boşken de kırılmaz, baştan anlamlı kısım döner
  const s2 = w.kaynakSec(uzun, "");
  ok("alan boşken de string döner (kırılmaz)", typeof s2 === "string" && s2.length > 0);
})();

// ---- #6 fabric ilhamı: hazır prompt kalıpları (mod) ----
console.log("\n#6 — Mod kalıpları (fabric ilhamı)");
(function(){
  const w = yeniDom();
  // Çipler çizildi (Mod yok + 5 kalıp)
  const host = w.document.querySelector("#kaliplar");
  ok("mod çipleri çizildi (yok + 5 kalıp)", host.querySelectorAll(".chip.kalip").length === 6);
  ok("başta 'Mod yok' seçili", host.querySelector('[data-k=""]').classList.contains("on"));

  // Kalıp seç → highlight + kalıcı
  host.querySelector('[data-k="ucuz"]').click();
  ok("kalıp seçilince işaretlenir", w.document.querySelector('[data-k="ucuz"]').classList.contains("on"));
  ok("kalıp seçimi kalıcı (localStorage)", JSON.parse(w.localStorage.getItem("mucit_ayarlar")).kalip === "ucuz");

  // kalipVurgu seçilen kalıbın yönergesini döndürür
  ok("kalipVurgu seçili kalıbın yönergesini verir", /200 TL altı/.test(w.kalipVurgu()));

  // ureticiPrompt kalıbı enjekte eder (geriye uyumlu: kalıpsız → enjeksiyon yok)
  ok("üretici promptuna kalıp girer", /KALIP\/MOD/.test(w.ureticiPrompt("ev", [], "", null, 6, "200 TL altı olsun").kullanici));
  ok("kalıpsız üretici promptu temiz (geriye uyumlu)", !/KALIP\/MOD/.test(w.ureticiPrompt("ev", [], "").kullanici));

  // Yeni oturum: kalıcı kalıp yüklenir ve çipe yansır
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_ayarlar", JSON.stringify({ kalip: "cevre" }));
  w2.ayarYukle(); w2.kaliplarCiz();
  ok("kalıcı kalıp yeni oturumda yüklendi", w2.document.querySelector('[data-k="cevre"]').classList.contains("on"));
})();

// ---- #8 mastra ilhamı: canlı ajan zinciri + öğrenen hafıza ----
console.log("\n#8 — Canlı ajan zinciri + hafıza (mastra ilhamı)");
(function(){
  const w = yeniDom();

  // Canlı adım çizelgesi: aktif=2 → ilk ikisi bitti, 3. aktif, 4. bekliyor
  w.ajanCiz(2, "Zeyneb: \"Efendi, hayretim arttı!\"");
  const st = w.document.querySelector("#status");
  const adimlar = st.querySelectorAll(".ajanadim");
  ok("4 ajan adımı çizildi", adimlar.length === 4);
  ok("tamamlanan aşamalar 'bitti'", st.querySelectorAll(".ajanadim.bitti").length === 2);
  ok("o anki aşama 'aktif'", adimlar[2].classList.contains("aktif"));
  ok("sıradaki aşama 'bekliyor'", adimlar[3].classList.contains("bekliyor"));
  ok("adım isimleri doğru sırada (4 aşama motoru)",
     [...adimlar].map(a => a.querySelector(".ajanad").textContent).join(",") === "Üretici,Eleştirmen,Üst akıl,Uzman heyeti");
  ok("Osmanlıca atışma alt mesajı korundu", /hayretim arttı/.test(st.textContent));

  // Öğrenen hafıza: beğenilen kayıtlar üreticiye pozitif sinyal olur
  const pB = w.ureticiPrompt("mutfak", [], "", ["Akıllı Tava", "Oto Şemsiye"]);
  ok("beğenilen fikirler üretici promptuna girdi", /BEĞEN/i.test(pB.kullanici) && /Akıllı Tava/.test(pB.kullanici));
  const pS = w.ureticiPrompt("mutfak", [], "");
  ok("beğeni yoksa pozitif sinyal eklenmez (geriye uyumlu)", !/BEĞEN/i.test(pS.kullanici));

  // Hafıza rozeti: hafıza boşken görünmez
  w.ajanCiz(0, "");
  ok("hafıza boşken rozet yok", !/hafıza:/.test(w.document.querySelector("#status").textContent));
})();

// ---- #9 dify ilhamı: ayarlanabilir görsel akış motoru ----
console.log("\n#9 — Ayarlanabilir motor (dify ilhamı)");
(function(){
  const w = yeniDom();

  // Düğüm ayarları gerçek prompta bağlı: aday sayısı
  ok("üretici aday sayısı ayarlanır (3)", /3 aday/.test(w.ureticiPrompt("a", [], "", null, 3).sistem));
  ok("geçersiz sayı varsayılana düşer (6)", /6 aday/.test(w.ureticiPrompt("a", [], "", null, 99).sistem));
  // diyalog tonu
  ok("üst akıl ton=sert → sert yönerge", /SERT/.test(w.ustAkilPrompt("a", [{ isim: "x" }], "", "sert").sistem));
  ok("üst akıl ton=mizahi → mizah yönergesi", /MİZAH/i.test(w.ustAkilPrompt("a", [{ isim: "x" }], "", "mizahi").sistem));
  ok("ton=dengeli → ekstra ton yönergesi yok (geriye uyumlu)", !/(SERT|MİZAH)/i.test(w.ustAkilPrompt("a", [{ isim: "x" }], "", "dengeli").sistem));

  // Görsel akış editörü — aç/kapa yerleşik <details> ile (JS toggle yok → bozulmaz)
  const host = w.document.querySelector("#akis");
  ok("akış editörü çizildi (dify etiketi)", /Motoru ayarla/.test(host.textContent) && /dify/.test(host.textContent));
  ok("aç/kapa yerleşik <details>/<summary> ile (garanti)", !!host.querySelector("details.akisdetay > summary.akisbas"));
  ok("4 motor düğümü hep DOM'da çizili", w.document.querySelectorAll("#akis .akisik").length === 4);
  ok("kontroller var (3 seçim + 5 onay: eleme/web/anlamsal/yerel/heyet)",
     w.document.querySelectorAll("#akis .akissel").length === 3 && w.document.querySelectorAll('#akis [type="checkbox"]').length === 5);

  // Kontrol değişince ayar kalıcı kaydedilir (change tarayıcıda bubbles → delege)
  const sel = w.document.querySelector('[data-ayar="adaySayisi"]');
  sel.value = "9"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  ok("ayar değişikliği localStorage'a kalıcı yazıldı", JSON.parse(w.localStorage.getItem("mucit_ayarlar")).adaySayisi === 9);

  // Yeni oturum: kalıcı ayar yüklenir ve kontrollere yansır
  const w2 = yeniDom();
  w2.localStorage.setItem("mucit_ayarlar", JSON.stringify({ adaySayisi: 9, eleme: false, ton: "mizahi", web: false }));
  w2.ayarYukle(); w2.akisCiz();
  ok("kalıcı ayar yeni oturumda yüklendi (adaySayisi=9)", w2.document.querySelector('[data-ayar="adaySayisi"]').value === "9");
  ok("eleme kapalı ayarı kontrole yansıdı", w2.document.querySelector('[data-ayar="eleme"]').checked === false);
})();

(async function(){
  const w = yeniDom();
  const { cag, state } = stubUret(w);
  w.document.querySelector("#alan").value = "banyo";
  // beğenilen kayıt: üretim hafızasına pozitif sinyal olarak girmeli
  w.favToggle({ isim: "Sevilen Fikir", ne: "x", puan: 5 });
  await w.uret();
  ok("#8 beğenilen kayıt üretici promptuna sinyal oldu", /Sevilen Fikir/.test(cag[0]));
  w.ajanCiz(1, "");
  ok("#8 hafıza rozeti üretimden sonra fikir sayısını gösterir", /hafıza:/.test(w.document.querySelector("#status").textContent));
  ok("4 aşama da çağrıldı (üretici→eleştirmen→üst akıl→uzman)", state.n === 4);
  ok("web araması çağrıldı", state.aramaCagrildi === true);
  ok("üst aklın gizli İngilizce kelimesi aramaya bağlandı (en=)", state.enGecti === true);
  ok("aramaEN kullanıcıya gösterilmez (kartta İngilizce yok)", !/smart pan sensor/.test(w.document.querySelector("#out .card").textContent));
  ok("patent araması (Google Patents) çağrıldı", state.patentArandi === true);
  ok("2. aşama eleştirmen promptu", /KIRMIZI TAKIM/.test(cag[1]));
  ok("3. aşama üst akıl promptu", /ÜST AKLI/.test(cag[2]));
  ok("4. aşama uzman heyeti promptu", /UZMAN HEYETİSİN/.test(cag[3]));
  ok("üst akla SÜZÜLMÜŞ adaylar gitti", /Süzülmüş0/.test(cag[2]) && !/Aday0/.test(cag[2]));
  ok("uzman promptuna gerçek arama sonucu enjekte edildi", /Mevcut Ürün X/.test(cag[3]));
  ok("Frankfurter kuru çağrıldı ve prompta girdi (1$≈34₺)", state.kurCagrildi === true && /1 USD ≈ 34 TRY/.test(cag[3]));
  ok("uzman promptuna gerçek PATENT sonucu enjekte edildi", /US1234 Akıllı Tava Patenti/.test(cag[3]));
  const card = w.document.querySelector("#out .card");
  ok("üretilen fikir ekranda", card && card.querySelector("h2").textContent.includes("Final Fikir"));
  ok("üretimden sonra 'Önerilen Fikirler' başlığı görünür", w.document.querySelector("#onerilenBaslik").hidden === false);
  ok("Çavuş & Zeyneb diyaloğu korundu", w.document.querySelectorAll("#out .card .dia .msg").length === 2);
  ok("mühendislik bloğu render edildi", !!card.querySelector(".muhendislik"));
  const muhMetin = card.querySelector(".muhendislik").textContent;
  ok("Nasıl yapılır alanı var", /X\+Y parçalarıyla/.test(muhMetin));
  ok("Tahmini maliyet alanı var", /100-200 TL/.test(muhMetin));
  ok("Benzer ürünler 'web' etiketli", /web/.test(muhMetin) && /Mevcut Ürün X/.test(muhMetin));
  ok("Talep / ilgi alanı var + 'web' etiketli", /Talep \/ ilgi · web/.test(muhMetin) && /talep yüksek/.test(muhMetin));
  ok("Patent durumu alanı var + 'web' etiketli", /Patent durumu · web/.test(muhMetin) && /US1234 benzer patent/.test(muhMetin));
  ok("Teknik gerçeklik (üretim fiziği) alanı var", /Teknik gerçeklik/.test(muhMetin) && /ısıl dayanım/.test(muhMetin));
  ok("İlk prototip adımı var", /karton maket/.test(muhMetin));
  ok("#7 Açık kaynak yapı taşları alanı var (awesome-opensource-ai)", /Açık kaynak yapı taşları/.test(muhMetin) && /Arduino \+ DHT/.test(muhMetin));
  ok("Farklılaş satırı var", /Farklılaş/.test(muhMetin) && /mıknatısla/.test(muhMetin));
  const rozet = card.querySelector(".skor");
  ok("premium skor rozeti render edildi", !!rozet);
  ok("skor sayısı 84 + 'yuksek' renk", rozet && rozet.querySelector(".skorNo").textContent === "84" && rozet.classList.contains("yuksek"));
  ok("skor hükmü gösteriliyor", rozet && /güçlü dert, zayıf rakip/.test(rozet.textContent));
  card.querySelector('[data-act="fav"]').click();
  const k = w.favleriYukle()[0];
  ok("mühendislik + skor alanları kalıcı (kaydedildi)", k.nasil && k.skor === "84" && k.hukum && k.farklilas && k.teknik && k.alan === "banyo");
})().then(async () => {
  // arama başarısız olsa bile uzman heyeti çalışmalı (graceful fallback)
  console.log("\nuret() — web arama başarısız (graceful)");
  const w = yeniDom();
  const { state } = stubUret(w, { aramaHata: true });
  w.document.querySelector("#alan").value = "ev";
  await w.uret();
  ok("arama hata verse de 4 aşama tamam", state.n === 4);
  ok("arama denendi ama hata yutuldu", state.aramaCagrildi === true);
  const card = w.document.querySelector("#out .card");
  ok("fikir yine üretildi", !!card && card.querySelector("h2").textContent.includes("Final Fikir"));
  ok("mühendislik yine geldi (websiz)", !!card.querySelector(".muhendislik"));
  ok("websiz olunca 'web' etiketi YOK", !/· web/.test(card.querySelector(".muhendislik").textContent));
}).then(async () => {
  // dify: web kapalıyken /api/ara atlanır ama 4 aşama + fikir tamam
  console.log("\nuret() — dify web kapalı (arama atlanır)");
  const w = yeniDom();
  const { state } = stubUret(w);
  w.ayarSet("web", false);
  w.document.querySelector("#alan").value = "test";
  await w.uret();
  ok("web kapalı: /api/ara çağrılmadı", state.aramaCagrildi === false);
  ok("web kapalı olsa da 4 aşama çalıştı (üretici→eleştirmen→üst akıl→uzman)", state.n === 4);
  ok("web kapalı: fikir yine üretildi", !!w.document.querySelector("#out .card"));
}).then(async () => {
  // api/ara.js çok kaynaklı arama mantığı (SearXNG -> DDG -> Wikipedia), global.fetch stub
  console.log("\napi/ara.js — çok kaynaklı arama (fetch stub)");
  const handler = require("../api/ara.js");
  const cagir = (q, fetchStub, en) => new Promise(resolve => {
    global.fetch = fetchStub;
    handler({ query: { q, en } }, { status(){ return this; }, json(o){ resolve(o); } });
  });

  // İngilizce 'en' parametresi: web Türkçe (q) ile, GitHub/HN/Stack İngilizce (en) ile aranır
  const urller = [];
  await cagir("akıllı dolap", async (url) => {
    urller.push(url);
    if(/api\.datamuse\.com/.test(url)) return { ok: true, json: async () => [{ word: "cupboard" }] };
    return { ok: true, json: async () => ({ results: [] }), text: async () => "" };
  }, "smart cabinet");
  ok("web (SearXNG) Türkçe sorgu ile arandı", urller.some(u => /search\?q=/.test(u) && /ak/i.test(decodeURIComponent(u)) && !/smart\+cabinet|smart%20cabinet|smart cabinet/.test(decodeURIComponent(u))));
  ok("GitHub İngilizce (smart cabinet) ile arandı", urller.some(u => /api\.github\.com/.test(u) && /smart cabinet/.test(decodeURIComponent(u))));
  ok("GitHub Türkçe (akıllı dolap) ile DE arandı", urller.some(u => /api\.github\.com/.test(u) && /akıllı dolap/.test(decodeURIComponent(u))));
  ok("Datamuse ilişkili kelimeyle (cupboard) DE arandı", urller.some(u => /api\.github\.com/.test(u) && /cupboard/.test(decodeURIComponent(u))));
  ok("Hacker News İngilizce ile arandı", urller.some(u => /hn\.algolia\.com/.test(u) && /smart cabinet/.test(decodeURIComponent(u))));

  // SearXNG sonuç verir → DDG'ye düşmez; genel sorguda Wikipedia eklenir
  const s1 = await cagir("uv dolap", async (url) => {
    if(/format=json/.test(url) && /\/search\?q=/.test(url))
      return { ok: true, json: async () => ({ results: [{ title: "SearX Hit", content: "içerik" }] }) };
    if(/wikipedia\.org/.test(url))
      return { ok: true, json: async () => ["uv dolap", ["UV Cabinet"], ["Bir dolap türü"], ["http://x"]] };
    if(/api\.github\.com/.test(url))
      return { ok: true, json: async () => ({ items: [{ full_name: "user/akilli-dolap", description: "akıllı dolap projesi", stargazers_count: 42, forks_count: 7, pushed_at: "2024-05-01T00:00:00Z", topics: ["iot", "tarim"] }] }) };
    if(/api\.stackexchange\.com/.test(url) && /site=stackoverflow/.test(url))
      return { ok: true, json: async () => ({ items: [{ title: "dolap nem sorunu", score: 5, answer_count: 2 }] }) };
    if(/hn\.algolia\.com/.test(url))
      return { ok: true, json: async () => ({ hits: [{ title: "Show HN: Akıllı Dolap", points: 120, num_comments: 33, url: "http://x.co" }] }) };
    if(/reddit\.com\/search\.json/.test(url))
      return { ok: true, json: async () => ({ data: { children: [{ data: { title: "dolabım küf yapıyor ne yapsam", subreddit: "TurkeyHome", num_comments: 48, score: 210, selftext: "nem çok" } }] } }) };
    if(/wikidata\.org/.test(url))
      return { ok: true, json: async () => ({ search: [{ label: "akıllı dolap", description: "elektronik dolap" }] }) };
    if(/registry\.npmjs\.org/.test(url))
      return { ok: true, json: async () => ({ objects: [{ package: { name: "cabinet-sensor", description: "dolap sensör kütüphanesi" } }] }) };
    if(/api\.semanticscholar\.org/.test(url))
      return { ok: true, json: async () => ({ data: [{ title: "Humidity Sensing in Cabinets", abstract: "nem ölçüm çalışması" }] }) };
    if(/openlibrary\.org/.test(url))
      return { ok: true, json: async () => ({ docs: [{ title: "Smart Home Design", author_name: ["A. Yazar"] }] }) };
    if(/api\.conceptnet\.io/.test(url))
      return { ok: true, json: async () => ({ edges: [{ end: { label: "drying clothes" }, rel: { label: "UsedFor" } }] }) };
    if(/itunes\.apple\.com/.test(url))
      return { ok: true, json: async () => ({ results: [{ trackName: "Cabinet App", primaryGenreName: "Utilities" }] }) };
    if(/crates\.io/.test(url))
      return { ok: true, json: async () => ({ crates: [{ name: "cabinet-rs", description: "rust dolap kütüphanesi" }] }) };
    if(/site=diy/.test(url))
      return { ok: true, json: async () => ({ items: [{ title: "DIY cabinet dehumidifier", score: 12 }] }) };
    if(/export\.arxiv\.org/.test(url))
      return { ok: true, text: async () => "<feed><entry><title>Smart Cabinet Sensing</title><summary>nem ölçümü</summary></entry></feed>" };
    if(/api\.datamuse\.com/.test(url))
      return { ok: true, json: async () => [{ word: "cupboard" }, { word: "wardrobe" }] };
    return { ok: true, text: async () => "" };
  });
  ok("SearXNG sonucu parse edildi", s1.sonuclar.some(s => /SearX Hit/.test(s.baslik)));
  ok("kaynak searxng", s1.kaynak === "searxng");
  ok("genel sorguda Wikipedia (tr/en) eklendi", s1.sonuclar.some(s => /Wikipedia\((tr|en)\): UV Cabinet/.test(s.baslik)));
  ok("GitHub projesi eklendi (★ ilgi sinyali)", s1.sonuclar.some(s => /GitHub: user\/akilli-dolap.*★42/.test(s.baslik)));
  ok("GitHub topics (teknik etiketler) eklendi", s1.sonuclar.some(s => /\[iot, tarim\]/.test(s.ozet)));
  ok("GitHub canlılık sinyali (forks + son güncelleme)", s1.sonuclar.some(s => /⑂7/.test(s.baslik) && /son: 2024-05/.test(s.ozet)));
  ok("Stack Exchange sorusu eklendi (talep sinyali)", s1.sonuclar.some(s => /Soru: dolap nem sorunu/.test(s.baslik)));
  ok("Hacker News eklendi (lansman/ilgi sinyali)", s1.sonuclar.some(s => /HN: Show HN: Akıllı Dolap.*120p, 33 yorum/.test(s.baslik)));
  ok("Reddit eklendi (gerçek kullanıcı dert/talep sinyali)", s1.sonuclar.some(s => /Reddit: dolabım küf.*r\/TurkeyHome, 48 yorum/.test(s.baslik) && /oy 210/.test(s.ozet)));
  ok("arXiv eklendi (bilimsel temel)", s1.sonuclar.some(s => /arXiv: Smart Cabinet Sensing/.test(s.baslik)));
  ok("Wikidata eklendi (kavram varlığı)", s1.sonuclar.some(s => /Wikidata: akıllı dolap/.test(s.baslik)));
  ok("npm eklendi (yazılım/teknoloji sinyali)", s1.sonuclar.some(s => /npm: cabinet-sensor/.test(s.baslik)));
  ok("Semantic Scholar eklendi (geniş bilimsel)", s1.sonuclar.some(s => /Makale: Humidity Sensing/.test(s.baslik)));
  ok("Open Library eklendi (kavram olgunluğu)", s1.sonuclar.some(s => /Kitap: Smart Home Design/.test(s.baslik)));
  ok("ConceptNet eklendi (kavram ilişkisi → harman yakıtı)", s1.sonuclar.some(s => /İlişkili: drying clothes/.test(s.baslik)));
  ok("iTunes ajanı eklendi (uygulama/medya domeni)", s1.sonuclar.some(s => /Uygulama: Cabinet App/.test(s.baslik)));
  ok("crates.io ajanı eklendi (yazılım domeni)", s1.sonuclar.some(s => /crate: cabinet-rs/.test(s.baslik)));
  ok("DIY StackExchange ajanı eklendi (prototip/maker domeni)", s1.sonuclar.some(s => /DIY: DIY cabinet/.test(s.baslik)));

  // SearXNG boş → DuckDuckGo'ya düşer
  const s2 = await cagir("xyz urun", async (url) => {
    if(/format=json/.test(url)) return { ok: true, json: async () => ({ results: [] }) };
    if(/duckduckgo\.com/.test(url)) return { ok: true, text: async () =>
      '<a class="result__a" href="#">DDG Hit</a><a class="result__snippet">özet</a>' };
    if(/wikipedia\.org/.test(url)) return { ok: true, json: async () => ["xyz", [], [], []] };
    return { ok: true, text: async () => "" };
  });
  ok("SearXNG boşsa DuckDuckGo devreye girer", s2.sonuclar.some(s => /DDG Hit/.test(s.baslik)) && s2.kaynak === "ddg");

  // patent sorgusunda Wikipedia EKLENMEZ
  const s3 = await cagir("site:patents.google.com uv dolap", async (url) => {
    if(/format=json/.test(url)) return { ok: true, json: async () => ({ results: [{ title: "Patent X", content: "p" }] }) };
    if(/wikipedia\.org/.test(url)) return { ok: true, json: async () => ["q", ["OLMAMALI"], ["x"], ["y"]] };
    return { ok: true, text: async () => "" };
  });
  ok("patent sorgusunda Wikipedia/GitHub/Stack/HN/arXiv eklenmedi", !s3.sonuclar.some(s => /Wikipedia|GitHub|Soru:|HN:|arXiv:/.test(s.baslik)));

  // hepsi patlasa boş döner (kırılmaz)
  const s4 = await cagir("hata testi", async () => { throw new Error("ağ yok"); });
  ok("tüm kaynaklar patlasa boş sonuç (kırılmaz)", Array.isArray(s4.sonuclar) && s4.sonuclar.length === 0);
}).then(async () => {
  // #5 firecrawl: api/cek.js — URL → temiz metin
  console.log("\n#5 — api/cek.js URL → temiz metin (firecrawl)");
  const cek = require("../api/cek.js");
  // saf temizleyici: script/style/etiket sökülür, başlık/paragraf metni kalır
  const html = `<html><head><title>Test Başlık</title><style>.x{color:red}</style></head>
    <body><script>var a=1;</script><nav>menü çöp</nav>
    <h1>Ürün</h1><p>Bu ürün&nbsp;çok güzel.</p><p>İkinci paragraf &amp; devamı.</p></body></html>`;
  const t = cek.temizMetin(html);
  ok("script içeriği sökülür", !/var a=1/.test(t));
  ok("style içeriği sökülür", !/color:red/.test(t));
  ok("HTML etiketleri sökülür", !/<p>|<h1>/.test(t));
  ok("entity çözülür (&nbsp; &amp;)", /çok güzel/.test(t) && /& devamı/.test(t));

  // handler: fetch stub → baslik + metin döner
  const resMock = () => { let o; const r = { status(){ return r; }, json(b){ o = b; return r; }, get _(){ return o; } }; return r; };
  global.fetch = async () => ({ ok: true, text: async () => html });
  let r1 = resMock(); await cek({ query: { url: "https://ornek.com" } }, r1);
  ok("handler başlığı <title>'dan alır", r1._.baslik === "Test Başlık");
  ok("handler temiz metni döndürür", /Bu ürün çok güzel/.test(r1._.metin));

  // geçersiz url → hata
  let r2 = resMock(); await cek({ query: { url: "deneme" } }, r2);
  ok("geçersiz url reddedilir", r2._.metin === "" && /link/.test(r2._.hata));

  // ağ hatası → kırılmaz, boş metin
  global.fetch = async () => { throw new Error("ağ yok"); };
  let r3 = resMock(); await cek({ query: { url: "https://x.com" } }, r3);
  ok("ağ hatası yutulur (boş metin, kırılmaz)", r3._.metin === "");
}).then(async () => {
  // #8 browser-use: karttan canlı pazar taraması (/api/ara)
  console.log("\n#8 — Pazar taraması butonu (browser-use ilhamı)");
  const w = yeniDom();
  w.fetch = async () => ({ ok: true, json: async () => ({ sonuclar: [
    { baslik: "GitHub: user/akilli-tava (★99)", ozet: "benzer proje" },
    { baslik: "Rakip Ürün Z", ozet: "piyasada var" }
  ] }) });
  w.cizFikirler([{ isim: "Akıllı Tava", ne: "yemek pişirir", aramaEN: "smart pan" }]);
  const card = w.document.querySelector("#out .card");
  const btn = card.querySelector('[data-act="pazar"]');
  ok("karta 'Pazarı tara' butonu eklendi", !!btn);
  btn.click();
  await new Promise(r => setTimeout(r, 5));
  const wrap = card.querySelector(".pazarWrap");
  ok("pazar sonuçları kartta gösterildi", /Pazar taraması/.test(wrap.textContent) && /Rakip Ürün Z/.test(wrap.textContent));

  // sonuç yoksa niş mesajı, kırılmaz
  const w2 = yeniDom();
  w2.fetch = async () => ({ ok: true, json: async () => ({ sonuclar: [] }) });
  w2.cizFikirler([{ isim: "X", ne: "y" }]);
  const c2 = w2.document.querySelector("#out .card");
  c2.querySelector('[data-act="pazar"]').click();
  await new Promise(r => setTimeout(r, 5));
  ok("sonuç yoksa niş mesajı (kırılmaz)", /Belirgin sonuç/.test(c2.querySelector(".pazarWrap").textContent));
}).then(async () => {
  // #9 n8n: otomasyon — skor tetikli oto-kaydet + toplu üretim ayarı
  console.log("\n#9 — Otomasyon: oto-kaydet + toplu (n8n ilhamı)");
  const w = yeniDom();
  stubUret(w);
  w.ayarSet("otoKaydet", 70);            // stub skor 84 → eşik üstü → oto kaydedilmeli
  w.document.querySelector("#alan").value = "ev";
  await w.uret();
  ok("skoru eşik üstü fikir OTOMATİK kaydedildi (trigger→action)", w.favleriYukle().some(f => f.isim === "Final Fikir"));

  const w2 = yeniDom();
  stubUret(w2);
  w2.ayarSet("otoKaydet", 90);           // 90 eşiği > 84 → kaydedilmemeli
  w2.document.querySelector("#alan").value = "ev";
  await w2.uret();
  ok("eşik üstünde değilse oto-kaydet yapmaz", !w2.favleriYukle().some(f => f.isim === "Final Fikir"));

  ok("'Otomatik üret' butonu var (Fikir Üret yanında)", !!w2.document.querySelector("#genOto"));
  ok("çoklu üretim fonksiyonu var (otomatik üret)", typeof w2.uretCoklu === "function");

  // otomatik üret gerçekten arka arkaya birden fazla fikir üretir
  const w3 = yeniDom();
  stubUret(w3);
  w3.document.querySelector("#alan").value = "ev";
  await w3.uretCoklu(2);
  ok("otomatik üret arka arkaya 2 fikir üretti", w3.document.querySelectorAll("#out .card").length === 2);

  // #10 generative-ai-for-beginners: uygulama içi öğren rehberi
  console.log("\n#10 — Öğren rehberi (generative-ai-for-beginners ilhamı)");
  const wo = yeniDom();
  const og = wo.document.querySelector("#ogren");
  ok("öğren rehberi DOM'da", !!og && og.tagName.toLowerCase() === "details");
  ok("rehber katlanır <summary> ile", !!og.querySelector("summary.ogrenbas"));
  ok("rehber 4 aşamayı anlatır", /4 aşamalı/.test(og.textContent));
  ok("rehber anahtarsız ajanları anlatır", /Anahtarsız ajanlar/.test(og.textContent));
  ok("rehber özellik ipuçları içerir (Pazarı tara, Motoru ayarla)", /Pazarı tara/.test(og.textContent) && /Motoru ayarla/.test(og.textContent));
}).then(() => {
  // ---- transformers.js: tarayıcıda anlamsal embedding (saf yardımcılar + UI) ----
  console.log("\nALTYAPI — transformers.js (anlamsal embedding)");
  const w = yeniDom();
  // kosinus: aynı vektör → 1, dik → 0, ters → negatif/0 sınırı
  ok("kosinus aynı vektörde 1", Math.abs(w.kosinus([1, 0, 1], [1, 0, 1]) - 1) < 1e-9);
  ok("kosinus dik vektörde 0", Math.abs(w.kosinus([1, 0], [0, 1])) < 1e-9);
  ok("kosinus boş/uyumsuzda 0 (kırılmaz)", w.kosinus(null, [1]) === 0 && w.kosinus([1, 2], [1]) === 0);
  // enYakin: en yüksek benzerlikteki kaydı seçer
  const y = w.enYakin([1, 0, 0], [{ vec: [0, 1, 0] }, { vec: [0.9, 0.1, 0] }, { vec: [0, 0, 1] }]);
  ok("enYakin en benzer kaydı bulur (i=1)", y.i === 1 && y.skor > 0.9);
  ok("enYakin boş listede -1 (kırılmaz)", w.enYakin([1], []).i === -1);

  // Anlamsal mod onay kutusu (opt-in, varsayılan kapalı) + kalıcı
  w.akisKur ? null : null;
  const tgl = w.document.querySelector('[data-ayar="anlamsal"]');
  ok("anlamsal mod onay kutusu var (Motoru ayarla)", !!tgl);
  ok("anlamsal mod başta kapalı", tgl.checked === false);
  tgl.checked = true; tgl.dispatchEvent(new w.Event("change", { bubbles: true }));
  ok("anlamsal mod kalıcı kaydedildi", JSON.parse(w.localStorage.getItem("mucit_ayarlar")).anlamsal === true);

  // benzerleriEle (saf): geçmişe/birbirine çok benzer adayları eler
  const A = [1, 0, 0], Abenzer = [0.99, 0.01, 0], B = [0, 1, 0];
  ok("aynı batch'te çift aday elenir", JSON.stringify(w.benzerleriEle([A, Abenzer, B], [], 0.86)) === JSON.stringify([0, 2]));
  ok("geçmişe benzer aday elenir", JSON.stringify(w.benzerleriEle([Abenzer, B], [A], 0.86)) === JSON.stringify([1]));
  ok("benzer yoksa hepsi tutulur", w.benzerleriEle([A, B], [], 0.86).length === 2);
  ok("vektörü olmayan aday elenmez (kırılmaz)", w.benzerleriEle([null, A], [], 0.86).length === 2);

  // benzerNot alanı kartta render edilir
  w.cizFikirler([{ isim: "Akıllı Saksı", ne: "sular", benzerNot: "Otomatik Sulayıcı (%88 anlamca benzer)" }]);
  ok("anlamca benzer kayıt uyarısı kartta gösterilir",
     /Anlamca benzer kaydın/.test(w.document.querySelector("#out .card").textContent) && /%88/.test(w.document.querySelector("#out .card").textContent));
}).then(async () => {
  // Faz 2: anlamsal ragflow — model yokken (jsdom) keyword kaynakSec'e DÜŞER (graceful)
  const w = yeniDom();
  const uzun = ("Mutfakta tezgah dağınık ve bıçaklar tehlikeli. " +
    "Köpeğim parkta koşuyor. Tavalar dolapta yer kaplıyor mutfak düzeni zor. " +
    "Hava güzel denize gittik. Bulaşık süngeri 3 günde mutfakta bakteri topluyor. ").repeat(3) + "z".repeat(300);
  const sem = await w.kaynakSecAnlamsal(uzun, "mutfak");
  ok("anlamsal kaynak model yokken keyword'e düşer (aynı sonuç)", sem === w.kaynakSec(uzun, "mutfak"));
  ok("fallback yine de alakalı içerik döndürür", /tezgah|tava|bulaşık/i.test(sem));
  // tekrarEle: model yokken eleme yapmaz, adayları aynen döndürür (graceful)
  const tr = await w.tekrarEle([{ isim: "X", ne: "a" }, { isim: "Y", ne: "b" }]);
  ok("tekrarEle model yokken adayları aynen döndürür (fallback)", tr.length === 2);
}).then(async () => {
  // ÜST SEVİYE: araştırma ordusu üreticiye besleniyor (ConceptNet ilişkileri + gerçek dertler)
  console.log("\nÜRETİCİYE BESLEME — sahadan gerçek sinyaller");
  // ureticiPrompt ilham parametresini enjekte eder
  const wp = yeniDom();
  const pi = wp.ureticiPrompt("mutfak", [], "", null, 6, "", null, "ilişkili kavramlar: bıçak, mıknatıs");
  ok("üretici promptu sahadan sinyali içerir", /SAHADAN GERÇEK SİNYALLER/.test(pi.kullanici) && /mıknatıs/.test(pi.kullanici));
  ok("ilham yokken üretici promptu temiz (geriye uyumlu)", !/SAHADAN GERÇEK/.test(wp.ureticiPrompt("mutfak", [], "").kullanici));

  // ureticiIlham: /api/ara sonuçlarından ilişki + dert çıkarır
  const wi = yeniDom();
  wi.fetch = async (url) => {
    if(String(url).startsWith("/api/ara")) return { ok: true, json: async () => ({ sonuclar: [
      { baslik: "İlişkili: knife sharpening", ozet: "UsedFor" },
      { baslik: "DIY: mutfak tezgahı nasıl temiz tutulur", ozet: "skor 9" },
      { baslik: "GitHub: user/x", ozet: "alakasız" }
    ] }) };
    return { ok: true, json: async () => ({ sonuclar: [] }) };
  };
  const ilh = await wi.ureticiIlham("mutfak");
  ok("ureticiIlham ConceptNet ilişkisini toplar", /knife sharpening/.test(ilh));
  ok("ureticiIlham gerçek dert/soruyu toplar", /tezgahı nasıl temiz/.test(ilh));
  ok("ureticiIlham alakasız (GitHub) sinyali ilhama katmaz", !/user\/x/.test(ilh));
  wi.ayarSet("web", false);
  ok("web kapalıyken üreticiye besleme yapılmaz", (await wi.ureticiIlham("mutfak")) === "");
}).then(async () => {
  // ---- web-llm: yerel LLM (WebGPU yoksa buluta graceful fallback) ----
  console.log("\nALTYAPI — web-llm (yerel LLM)");
  const w = yeniDom();
  ok("WebGPU yokken yerel desteklenmez (jsdom)", w.yerelDestekli() === false);
  ok("yerelUret WebGPU yokken null döner (kırılmaz)", (await w.yerelUret("a", "b")) === null);
  const tgl = w.document.querySelector('[data-ayar="yerel"]');
  ok("yerel LLM onay kutusu var (Motoru ayarla)", !!tgl && tgl.checked === false);
  tgl.checked = true; tgl.dispatchEvent(new w.Event("change", { bubbles: true }));
  ok("yerel LLM ayarı kalıcı", JSON.parse(w.localStorage.getItem("mucit_ayarlar")).yerel === true);

  // yerel açık ama WebGPU yok → üretim yine BULUTA düşüp çalışır
  const w2 = yeniDom();
  const { state } = stubUret(w2);
  w2.ayarSet("yerel", true);
  w2.document.querySelector("#alan").value = "ev";
  await w2.uret();
  ok("yerel açık + WebGPU yok → buluta düşüp fikir üretildi", !!w2.document.querySelector("#out .card"));
}).then(async () => {
  // ---- Çok-ajan HEYET modu: üretici aşamasında paralel personalar ----
  console.log("\nHEYET — çok-ajan üretici (paralel persona)");
  const w = yeniDom();
  const cag = [];
  // içerik tabanlı stub (paralel çağrılara dayanıklı): prompt içeriğine göre yanıt verir
  w.fetch = async (url, o) => {
    if(String(url).startsWith("/api/ara")) return { ok: true, json: async () => ({ sonuclar: [] }) };
    if(/frankfurter/.test(url)) return { ok: true, json: async () => ({ rates: { TRY: 34 } }) };
    const text = JSON.parse(o.body).text; cag.push(text);
    let resp;
    if(/ÜST AKLI/.test(text)) resp = [{ isim: "Final Fikir", ne: "x", neyden: "a+b", diyalog: [{ kim: "Çavuş", soz: "h" }, { kim: "Zeyneb", soz: "ikna" }] }];
    else if(/UZMAN HEYET/i.test(text)) resp = [{ isim: "Final Fikir", skor: "88", hukum: "h", nasil: "n", maliyet: "m", benzer: "b", talep: "t", patent: "p", teknik: "tk", prototip: "pr" }];
    else if(/KIRMIZI TAKIM/.test(text)) resp = [{ isim: "Süz0", ne: "s", neyden: "p+q" }, { isim: "Süz1", ne: "s", neyden: "p+q" }];
    else resp = [{ isim: "Aday" + cag.length, ne: "a", neyden: "x+y" }];   // üretici (persona)
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(resp) }] } }] }) };
  };
  w.ayarSet("heyet", true);
  w.document.querySelector("#alan").value = "ev";
  await w.uret();
  const ureticiCagri = cag.filter(t => !/KIRMIZI TAKIM|ÜST AKLI|UZMAN HEYET/i.test(t));
  ok("persona ordusu havuzdan rotasyonlu seçilir (6 ajan)", w.personaSec().length === 6);
  ok("seçilen personalar benzersiz", new Set(w.personaSec()).size === 6);
  ok("heyet modunda üretici ÇOK persona ile çalıştı (≥3 paralel)", ureticiCagri.length >= 3);
  ok("üretici çağrılarına persona (BAKIŞ AÇIN) enjekte edildi", ureticiCagri.some(t => /BAKIŞ AÇIN/.test(t)));
  ok("eleştirmen heyet merceğiyle çağrıldı (4 mercek)", cag.some(t => /HEYET MODU/.test(t)));
  ok("uzman heyeti geniş heyetle çağrıldı (ek uzmanlar)", cag.some(t => /EK UZMANLAR/.test(t)));
  ok("heyet modunda yine tek final fikir üretildi", !!w.document.querySelector("#out .card"));
}).then(() => {
  console.log(`\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
  process.exit(fail ? 1 : 0);
});
