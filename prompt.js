// İki aşamalı "üst akıl": 1) aday üretici  2) süzücü/harmanlayıcı üst akıl.
// Ayrıca Çavuş & Zeyneb sözleri ve cevaptan JSON ayıklama.
const CAVUS_SOZ = ["yârenim","Zeyneb'cim","nazenînim","cânım","gülüm","gülizârım","gözümün nûru","kıymetlim","efendim","hânımefendi","gönül sultanım","bir tânem","hemdemim","refîkam","yâr-ı vefâdârım","dânişmend hanım","âlime hanım","ârife hanım","irfan ehli","fâzıla hanım","gül yüzlüm","ay yüzlüm","mehlikâ","cevherim","incim","dürdânem","bahtiyârım","devletlim","saâdetim","gönlümün tâcı","fikir yoldaşım","sohbet yârânım","mârifet hazinesi","hikmet pınarım","ilmin gülü","nükte ustası","zarâfet timsâli","letâfetli hanım","nâzenîn-i zamân","gül-i ranâ","bülbülüm","tatlı dillim","sultanım","gönül dostum","vefâlı yârenim","zekâ küpüm","edâlı hanım","kâmile hanım","gözüm","cânımın içi"];
const ZEYNEB_SOZ = ["Çavuş'um","yiğidim","efendim","üstâdım","ârif Çavuş","mârifet ehli","dânişmendim","âlim efendi","fâzıl efendi","hikmet sâhibi","zekâ deryâsı","irfan ehli","gönül dostum","yârânım","hemdemim","sohbet üstâdı","kıymetli dostum","azîz dostum","civanmertim","âlicenâbım","necîb efendi","kerîm efendi","fütüvvet ehli","mert yârenim","gözü pek Çavuş","cesur yârenim","dil ehli","nükte-dânım","letâfet sâhibi","zarîf efendi","himmetli dostum","gayretli yârenim","fikir pehlivanım","mantık ustası","teferruât üstâdı","detay dervişi","ilim âşığı","hakîkat eri","gönlü zengin dostum","erdemli yârenim","âsil efendi","vefâlı dostum","sadâkatli yârenim","hünerli Çavuş'um","mâhir efendi","kâmil insan","gayûr efendi","çelebim","beyefendi"];
const karistirSec = (arr,n) => [...arr].sort(()=>Math.random()-0.5).slice(0,n).join(", ");

// Kullanıcının elle yazdığı metni yorumla: tema mı, kendi fikri/isteği mi
function alanCumlesi(alan){
  return alan
    ? `Kullanıcının yazdığı istek/tema/fikir: "${alan}". Bunu MUTLAKA temel al — bir ürün fikri veya isteğiyse onu geliştir ve mevcut başka nesnelerle harmanla; bir alan/temaysa o alanda kal. Konuyu dağıtma.`
    : `Tema: SINIRSIZ — her alandan, birbirinden bağımsız.`;
}

// Her iki aşamada da geçerli ortak kurallar
const ORTAK_KURAL =
`YARI TEKNOLOJİK serbest: basit sensör, mıknatıs, pil, yay, ısı, küçük elektronik, telefon-uygulaması bağlantısı kullanılabilir. AMA bilimkurgu, hayal ve VARSAYIM YASAK; bugünün ucuz, gerçek parçalarıyla üretilebilir olmalı, 10 saniyede anlaşılmalı. Her ürün MUTLAKA mevcut 2-3 sıradan nesnenin/ürünün BEKLENMEDİK HARMANI olmalı. Piyasada zaten satılan, klişe, bariz veya işe yaramaz şeyler YASAK.`;

// 1. AŞAMA — aday üretici (diyalog yok, sade ve hızlı)
function ureticiPrompt(alan){
  const sistem =
`Sen yaratıcı ama AYAĞI YERE BASAN bir ürün mucitisin. Görev: dünyada ve Türkiye'de HENÜZ OLMAYAN, herkesin kullanabileceği ürünler icat etmek.
${ORTAK_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (6 aday), markdown yok, açıklama yok:
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün/nesnenin harmanı","derde":"çözdüğü gerçek günlük sorun","nedenYok":"bu kadar mantıklıysa neden hâlâ yok","vayBe":"insanı neden şaşırtır"}]`;
  const kullanici = `${alanCumlesi(alan)} Birbirinden tamamen farklı 6 aday üret. Cesur ama gerçekçi ol; hayal kurma.`;
  return { sistem, kullanici };
}

// 2. AŞAMA — ÜST AKIL: ele, harmanla, güçlendir, diyalog yaz
function ustAkilPrompt(alan, adaylar){
  const cavSoz = karistirSec(CAVUS_SOZ, 8);
  const zeySoz = karistirSec(ZEYNEB_SOZ, 8);
  const sistem =
`Sen "4c1z"in ÜST AKLI'sın. Sana aday ürün fikirleri verilir; görevin onları SÜZÜP OLGUNLAŞTIRMAK.
GÖREVİN:
- En zayıf, klişe, hayalci veya zaten-var olan adayları ELE.
- En güçlü adayları seç; gerekirse İKİ adayı harmanlayıp tek, daha güçlü fikir yap.
- Hepsini yarı-teknolojik ve YERE BASAN hale getir: varsayım/hayal/bilimkurgu temizle, gerçek ucuz parçalarla üretilebilir olsun.
- Kullanıcının isteğini sonuçlara entegre et.
- Sonuç: EN İYİ 3 fikir.
${ORTAK_KURAL}
Her fikir için bir ÇAVUŞ↔ZEYNEB sohbeti yaz:
- ÇAVUŞ (esmer erkek, çok detaycı, bilime aşık): fikri ortaya atar ve SAVUNUR; Zeyneb'i yarı zarif sözle yarı bilim/mantıkla ikna eder.
- ZEYNEB (kapalı/başörtülü doçent hanım): HİÇBİR ŞEYİ hemen beğenmez, eleştirir, kusur arar, itiraz eder; Çavuş ikna edince gönülsüzce "ikna ettin" der.
- 3-5 KISA replik, samimi ve tatlı atışmalı. Seslenirken HER replikte FARKLI kelime kullan: ÇAVUŞ→ZEYNEB: ${cavSoz}. ZEYNEB→ÇAVUŞ: ${zeySoz}.
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (EN İYİ 3 fikir), markdown yok:
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün harmanı","derde":"çözdüğü günlük sorun","nedenYok":"neden hâlâ yok","vayBe":"insanı neden şaşırtır","diyalog":[{"kim":"Çavuş","soz":"..."},{"kim":"Zeyneb","soz":"..."}]}]`;
  const kullanici = `${alanCumlesi(alan)}\nAday fikirler:\n${JSON.stringify(adaylar)}\nBunları süz, gerekirse harmanla ve güçlendir; EN İYİ 3'ünü diyaloğuyla sun. Hayalci/varsayımsal olanı düzelt ya da çıkar.`;
  return { sistem, kullanici };
}

function jsonAyikla(txt){
  if(!txt) return null;
  let t = txt.replace(/```json/gi,"").replace(/```/g,"").trim();
  const i = t.indexOf("[");
  if(i === -1) return null;
  t = t.slice(i);
  // 1) tam diziyi dene
  const j = t.lastIndexOf("]");
  if(j > 0){
    try{
      const arr = JSON.parse(t.slice(0, j+1));
      if(Array.isArray(arr)){ const ok = arr.filter(x => x && x.isim); if(ok.length) return ok; }
    }catch(e){}
  }
  // 2) kurtarma: cevap yarıda kesilmişse dengeli {} taramasıyla tam kartları al
  const out = [];
  let derinlik = 0, bas = -1;
  for(let k = 0; k < t.length; k++){
    if(t[k] === "{"){ if(derinlik === 0) bas = k; derinlik++; }
    else if(t[k] === "}"){ derinlik--; if(derinlik === 0 && bas !== -1){
      try{ const o = JSON.parse(t.slice(bas, k+1)); if(o && o.isim) out.push(o); }catch(e){}
      bas = -1;
    }}
  }
  return out.length ? out : null;
}
