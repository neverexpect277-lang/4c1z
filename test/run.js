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
  const state = { n: 0, aramaCagrildi: false, patentArandi: false };
  w.fetch = async (url, o) => {
    if(url.startsWith("/api/ara")){
      state.aramaCagrildi = true;
      if(opts.aramaHata) throw new Error("ağ yok");
      const patentSorgu = /patents\.google\.com/.test(decodeURIComponent(url));
      if(patentSorgu) state.patentArandi = true;
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
    else if(state.n === 3) text = JSON.stringify([{ isim: "Final Fikir", ne: "sonuç", neyden: "a+b", diyalog: [{ kim: "Çavuş", soz: "hah" }, { kim: "Zeyneb", soz: "ikna oldum" }] }]);
    else text = JSON.stringify([{ isim: "Final Fikir", nasil: "X+Y parçalarıyla", maliyet: "100-200 TL", benzer: "Mevcut Ürün X", patent: "US1234 benzer patent var", prototip: "karton maket yap" }]);
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) };
  };
  return { cag, state };
}
(async function(){
  const w = yeniDom();
  const { cag, state } = stubUret(w);
  w.document.querySelector("#alan").value = "banyo";
  await w.uret();
  ok("4 aşama da çağrıldı (üretici→eleştirmen→üst akıl→uzman)", state.n === 4);
  ok("web araması çağrıldı", state.aramaCagrildi === true);
  ok("patent araması (Google Patents) çağrıldı", state.patentArandi === true);
  ok("2. aşama eleştirmen promptu", /KIRMIZI TAKIM/.test(cag[1]));
  ok("3. aşama üst akıl promptu", /ÜST AKLI/.test(cag[2]));
  ok("4. aşama uzman heyeti promptu", /UZMAN HEYETİSİN/.test(cag[3]));
  ok("üst akla SÜZÜLMÜŞ adaylar gitti", /Süzülmüş0/.test(cag[2]) && !/Aday0/.test(cag[2]));
  ok("uzman promptuna gerçek arama sonucu enjekte edildi", /Mevcut Ürün X/.test(cag[3]));
  ok("uzman promptuna gerçek PATENT sonucu enjekte edildi", /US1234 Akıllı Tava Patenti/.test(cag[3]));
  const card = w.document.querySelector("#out .card");
  ok("üretilen fikir ekranda", card && card.querySelector("h2").textContent.includes("Final Fikir"));
  ok("Çavuş & Zeyneb diyaloğu korundu", w.document.querySelectorAll("#out .card .dia .msg").length === 2);
  ok("mühendislik bloğu render edildi", !!card.querySelector(".muhendislik"));
  const muhMetin = card.querySelector(".muhendislik").textContent;
  ok("Nasıl yapılır alanı var", /X\+Y parçalarıyla/.test(muhMetin));
  ok("Tahmini maliyet alanı var", /100-200 TL/.test(muhMetin));
  ok("Benzer ürünler 'web' etiketli", /web/.test(muhMetin) && /Mevcut Ürün X/.test(muhMetin));
  ok("Patent durumu alanı var + 'web' etiketli", /Patent durumu · web/.test(muhMetin) && /US1234 benzer patent/.test(muhMetin));
  ok("İlk prototip adımı var", /karton maket/.test(muhMetin));
  card.querySelector('[data-act="fav"]').click();
  const k = w.favleriYukle()[0];
  ok("mühendislik alanları kalıcı (kaydedildi)", k.nasil && k.maliyet && k.benzer && k.patent && k.prototip && k.alan === "banyo");
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
}).then(() => {
  console.log(`\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
  process.exit(fail ? 1 : 0);
});
