// İki aşamalı "üst akıl": 1) aday üretici  2) süzücü/harmanlayıcı üst akıl.
// Ayrıca Çavuş & Zeyneb sözleri ve cevaptan JSON ayıklama.
const CAVUS_SOZ = ["yârenim","Zeyneb'cim","nazenînim","cânım","gülüm","gülizârım","gözümün nûru","kıymetlim","efendim","hânımefendi","gönül sultanım","bir tânem","hemdemim","refîkam","yâr-ı vefâdârım","dânişmend hanım","âlime hanım","ârife hanım","irfan ehli","fâzıla hanım","gül yüzlüm","ay yüzlüm","mehlikâ","cevherim","incim","dürdânem","bahtiyârım","devletlim","saâdetim","gönlümün tâcı","fikir yoldaşım","sohbet yârânım","mârifet hazinesi","hikmet pınarım","ilmin gülü","nükte ustası","zarâfet timsâli","letâfetli hanım","nâzenîn-i zamân","gül-i ranâ","bülbülüm","tatlı dillim","sultanım","gönül dostum","vefâlı yârenim","zekâ küpüm","edâlı hanım","kâmile hanım","gözüm","cânımın içi"];
const ZEYNEB_SOZ = ["Çavuş'um","yiğidim","efendim","üstâdım","ârif Çavuş","mârifet ehli","dânişmendim","âlim efendi","fâzıl efendi","hikmet sâhibi","zekâ deryâsı","irfan ehli","gönül dostum","yârânım","hemdemim","sohbet üstâdı","kıymetli dostum","azîz dostum","civanmertim","âlicenâbım","necîb efendi","kerîm efendi","fütüvvet ehli","mert yârenim","gözü pek Çavuş","cesur yârenim","dil ehli","nükte-dânım","letâfet sâhibi","zarîf efendi","himmetli dostum","gayretli yârenim","fikir pehlivanım","mantık ustası","teferruât üstâdı","detay dervişi","ilim âşığı","hakîkat eri","gönlü zengin dostum","erdemli yârenim","âsil efendi","vefâlı dostum","sadâkatli yârenim","hünerli Çavuş'um","mâhir efendi","kâmil insan","gayûr efendi","çelebim","beyefendi"];
const karistirSec = (arr,n) => [...arr].sort(()=>Math.random()-0.5).slice(0,n).join(", ");

// Girişte Çavuş'un Zeyneb'i Osmanlıca karşılaması (50 cümle)
const KARSILAMA = [
  "Zeyneb'im, hoş geldin; kudûmunla meclisimiz şenlendi.",
  "Sefâ geldin nazenînim, bezm-i irfânımıza nûr saçtın.",
  "Teşrîfin başımıza tâc oldu Zeyneb Hanım, safâlar getirdin.",
  "Dîdârınla gönül hânemiz münevver oldu, hoş geldin sultânım.",
  "Hoş geldin ey ârife hanım, ilmimiz seninle behçet buldu.",
  "Kudûmun mübârek olsun Zeyneb'im, dergâhımız şereflendi.",
  "Safâ geldin gülizârım, gülşenimiz dîdârınla açıldı.",
  "Bezmimize teşrîf ettin, hoş geldin ey dânişmend hanım.",
  "Vuslatın bayram oldu bize, sefâlar getirdin nazenînim.",
  "Hoş geldin cânım, mahfilimiz nûrunla aydınlandı.",
  "Teşrîf-i âlîniz başımız üstüne Zeyneb Hanım, safâ geldiniz.",
  "Gönlümüzün sultânı geldi; hoş geldin, sefâlar getirdin.",
  "Dîvânımıza kadem bastın, münevver eyledin ey âlime hanım.",
  "Hoş geldin gözümün nûru, hasretimiz vuslata erdi.",
  "Sefâ geldin ey irfan ehli, meclis kelâmınla tatlandı.",
  "Kudûmunla gülşen-i sohbet açıldı, hoş geldin gülüm.",
  "Teşrîfin neş'e getirdi hânemize, safâ geldin nazenînim.",
  "Hoş geldin fâzıla hanım, ilim meclisimiz şâd oldu.",
  "Dîdârın bayram, kelâmın şeker; sefâlar getirdin Zeyneb'im.",
  "Safâ geldin sultânım, dergâh-ı irfânımız münevver oldu.",
  "Hoş geldin ey mârifet hazinesi, bezmimiz cevherlendi.",
  "Kademlerine güller serdik, hoş geldin nazenîn-i zamân.",
  "Teşrîf eyledin mahfilimizi, safâ geldin ey ârife hanım.",
  "Hoş geldin gönül sultânım, hasret defteri kapandı bugün.",
  "Vücûdun gülşene bahâr getirdi, sefâ geldin gülizârım.",
  "Hoş geldin ilmin gülü, sohbetimiz seninle kemâle erdi.",
  "Kudûmun devlet, dîdârın saâdet; safâlar getirdin Zeyneb'im.",
  "Teşrîfinle dîvân-ı muhabbet kuruldu, hoş geldin sultânım.",
  "Hoş geldin ey letâfet timsâli, meclis zarâfetinle süslendi.",
  "Sefâ geldin nazenînim, gönül kâşânemiz şereflendi.",
  "Hoş geldin cânımın içi, hasretin sona erdi nihâyet.",
  "Kademin başım üstüne ey âlime hanım, safâlar getirdin.",
  "Teşrîf-i hümâyûnun mübârek, hoş geldin gönül sultânım.",
  "Sefâ geldin ey hikmet pınarı, irfanımız seninle çağladı.",
  "Hoş geldin gülüm, gülşen-i sohbetimiz bülbülsüz kalmazdı.",
  "Dîdârınla zulmet dağıldı, sefâ geldin ey nûr-ı dîde.",
  "Hoş geldin nazenînim, meclis-i ilmimiz münevver oldu.",
  "Kudûmun gülbang oldu gönülde, safâlar getirdin Zeyneb Hanım.",
  "Teşrîf ettin bezmimizi, hoş geldin ey dânişmend sultân.",
  "Hoş geldin gözümün nûru, vuslatın gönle şifâ oldu.",
  "Sefâ geldin ey zarâfet sâhibi, mahfilimiz behçet buldu.",
  "Hoş geldin sultânım, kademinle hânemiz cennete döndü.",
  "Dîvânımız seninle tamam oldu, safâ geldin nazenînim.",
  "Hoş geldin ârife hanım, kelâmın gönüllere derman.",
  "Kudûmunla bahâr geldi gönle, hoş geldin gülizârım.",
  "Teşrîfin saâdet, sohbetin devlet; sefâlar getirdin Zeyneb'im.",
  "Hoş geldin ilim deryâsı, meclisimiz incilerle doldu.",
  "Sefâ geldin gönül sultânım, hasret bahârı vuslata erdi.",
  "Hoş geldin ey fâzıla hanım, irfan bezmimiz şereflendi.",
  "Kademin mübârek, dîdârın münevver; hoş geldin nazenînim."
];

// Kullanıcının elle yazdığı metni yorumla: tema mı, kendi fikri/isteği mi
function alanCumlesi(alan){
  return alan
    ? `Kullanıcının yazdığı istek/tema/fikir: "${alan}". Bunu MUTLAKA temel al — bir ürün fikri veya isteğiyse onu geliştir ve mevcut başka nesnelerle harmanla; bir alan/temaysa o alanda kal. Konuyu dağıtma.`
    : `Tema: SINIRSIZ — her alandan, birbirinden bağımsız.`;
}

// Her iki aşamada da geçerli ortak kurallar
const ORTAK_KURAL =
`YARI TEKNOLOJİK serbest: basit sensör, mıknatıs, pil, yay, ısı, küçük elektronik, telefon-uygulaması bağlantısı kullanılabilir. AMA bilimkurgu, hayal ve VARSAYIM YASAK; bugünün ucuz, gerçek parçalarıyla üretilebilir olmalı, 10 saniyede anlaşılmalı. Her ürün MUTLAKA mevcut 2-3 sıradan nesnenin/ürünün BEKLENMEDİK HARMANI olmalı. Piyasada zaten satılan, klişe, bariz veya işe yaramaz şeyler YASAK.`;

// Çeşitlilik için rastgele bakış açıları (her turda farklı fikir çıksın)
const ACILAR = [
  "beklenmedik iki ev eşyasını birleştir",
  "bir israfı (su, yemek, enerji, zaman) önle",
  "yaşlılar veya engelliler için bir işi kolaylaştır",
  "çocuklu ailelerin bir sıkıntısını çöz",
  "tek elle veya çok hızlı kullanım sağla",
  "küçük bir yere sığsın, taşınabilir olsun",
  "bir şeyi temiz/düzenli tutmayı kolaylaştır",
  "kazayı/tehlikeyi önleyen güvenlik ürünü",
  "gözle görülür para tasarrufu sağla",
  "seyahat/araba/dışarı için pratik bir çözüm",
  "evcil hayvan sahiplerinin bir derdini çöz",
  "mutfakta zaman kazandıran bir alet",
  "kişisel bakım/sağlık için basit bir yardımcı",
  "bir nesneyi yeniden kullanılabilir/çevreci yap",
  "ofis/okul masasında bir karmaşayı çöz",
  "yağmur/soğuk/sıcak gibi hava derdine çare"
];

// Kaynak metin (NotebookLM gibi) varsa fikirleri ona dayandır
function kaynakCumlesi(kaynak){
  return kaynak
    ? ` KAYNAK METİN (kullanıcının verdiği belge/not): """${kaynak}""" Fikirleri MUTLAKA bu kaynağa DAYANDIR; içindeki gerçek ihtiyaçları, kısıtları ve bilgileri kullan. Kaynakta olmayan şey UYDURMA.`
    : "";
}

// 1. AŞAMA — aday üretici (diyalog yok, sade ve hızlı)
function ureticiPrompt(alan, kacinilacak, kaynak){
  const sistem =
`Sen yaratıcı ama AYAĞI YERE BASAN bir ürün mucitisin. Görev: dünyada ve Türkiye'de HENÜZ OLMAYAN, herkesin kullanabileceği ürünler icat etmek.
${ORTAK_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (6 aday), markdown yok, açıklama yok:
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün/nesnenin harmanı","derde":"çözdüğü gerçek günlük sorun","nedenYok":"bu kadar mantıklıysa neden hâlâ yok","vayBe":"insanı neden şaşırtır"}]`;
  const acilar = karistirSec(ACILAR, 3);
  const tohum = Math.floor(Math.random() * 1e6);
  const yasak = (Array.isArray(kacinilacak) && kacinilacak.length)
    ? ` ŞU fikirler DAHA ÖNCE üretildi; bunları ve çok benzerlerini KESİNLİKLE TEKRARLAMA: ${kacinilacak.slice(-45).join("; ")}.`
    : "";
  const kullanici = `${alanCumlesi(alan)}${kaynakCumlesi(kaynak)} Bu turda özellikle şu açılara bak: ${acilar}. Birbirinden tamamen farklı, ÖZGÜN 6 aday üret; her turda yepyeni fikirler çıkar, kendini tekrar etme. Cesur ama gerçekçi ol; hayal kurma.${yasak} [çeşitlilik tohumu: ${tohum}]`;
  return { sistem, kullanici };
}

// 2. AŞAMA — KIRMIZI TAKIM eleştirmen: acımasız fizibilite + özgünlük denetimi (diyalog YOK)
function elestirmenPrompt(alan, adaylar, kaynak){
  const sistem =
`Sen acımasız bir KIRMIZI TAKIM eleştirmenisin: ürün fizibilitesi ve özgünlük denetçisi. Sana aday ürün fikirleri verilir; görevin zayıfları SERTÇE ELEMEK, kalanları KESKİNLEŞTİRMEK.
ŞU adayları ELE (acımasız ol):
- Piyasada zaten var olan, klişe, bariz olanlar.
- Bilimkurgu, hayalci, bugünün ucuz gerçek parçalarıyla ÜRETİLEMEYECEK olanlar.
- 10 saniyede anlaşılmayan ya da gerçek bir derde çözüm olmayanlar.
- 2-3 mevcut nesnenin BEKLENMEDİK HARMANI olmayanlar.
KALANLARI güçlendir: neyden/derde/nedenYok/vayBe alanlarını daha somut ve gerçekçi yap.
${ORTAK_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür — eleyip güçlendirdiğin EN İYİ 3 aday (diyalog YOK, markdown YOK, açıklama YOK):
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün harmanı","derde":"çözdüğü gerçek sorun","nedenYok":"neden hâlâ yok","vayBe":"insanı neden şaşırtır"}]`;
  const kullanici = `${alanCumlesi(alan)}${kaynakCumlesi(kaynak)}\nAday fikirler:\n${JSON.stringify(adaylar)}\nBunları acımasızca denetle: zayıf/klişe/yapılamaz olanları AT, kalan en güçlü 3'ünü somutlaştır. Diyalog YAZMA; bu bir ara eleme aşamasıdır.`;
  return { sistem, kullanici };
}

// 3. AŞAMA — ÜST AKIL: ele, harmanla, güçlendir, diyalog yaz
function ustAkilPrompt(alan, adaylar, kaynak){
  const cavSoz = karistirSec(CAVUS_SOZ, 8);
  const zeySoz = karistirSec(ZEYNEB_SOZ, 8);
  const sistem =
`Sen "4c1z"in ÜST AKLI'sın. Sana aday ürün fikirleri verilir; görevin onları SÜZÜP OLGUNLAŞTIRMAK.
GÖREVİN:
- En zayıf, klişe, hayalci veya zaten-var olan adayları ELE.
- En güçlü adayları seç; gerekirse İKİ adayı harmanlayıp tek, daha güçlü fikir yap.
- Hepsini yarı-teknolojik ve YERE BASAN hale getir: varsayım/hayal/bilimkurgu temizle, gerçek ucuz parçalarla üretilebilir olsun.
- Kullanıcının isteğini sonuca entegre et.
- Sonuç: SADECE 1 (EN İYİ) fikir. Birden fazla VERME.
${ORTAK_KURAL}
Her fikir için bir ÇAVUŞ↔ZEYNEB sohbeti yaz:
- ÇAVUŞ (esmer erkek, çok detaycı, bilime aşık): fikri ortaya atar ve SAVUNUR; Zeyneb'i yarı zarif sözle yarı bilim/mantıkla ikna eder.
- ZEYNEB (kapalı/başörtülü doçent hanım): HİÇBİR ŞEYİ hemen beğenmez, eleştirir, kusur arar, itiraz eder; Çavuş ikna edince gönülsüzce "ikna ettin" der.
- 3-5 KISA replik, samimi ve tatlı atışmalı. Seslenirken HER replikte FARKLI kelime kullan: ÇAVUŞ→ZEYNEB: ${cavSoz}. ZEYNEB→ÇAVUŞ: ${zeySoz}.
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (TEK elemanlı, yani 1 fikir), markdown yok:
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün harmanı","derde":"çözdüğü günlük sorun","nedenYok":"neden hâlâ yok","vayBe":"insanı neden şaşırtır","diyalog":[{"kim":"Çavuş","soz":"..."},{"kim":"Zeyneb","soz":"..."}]}]`;
  const kullanici = `${alanCumlesi(alan)}${kaynakCumlesi(kaynak)}\nAday fikirler:\n${JSON.stringify(adaylar)}\nBunları süz, gerekirse harmanla ve güçlendir; SADECE EN İYİ 1'ini seç ve diyaloğuyla sun. Hayalci/varsayımsal olanı düzelt ya da çıkar.`;
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
