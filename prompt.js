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
function alanCumlesi(alan, tesis){
  if(alan) return tesis
    ? `Kullanıcının yazdığı tesis alanı/isteği: "${alan}". Bunu MUTLAKA temel al — bu alanda ~3,5M TL ile kurulabilecek niş üretim/yetiştirme tesisleri öner; konuyu dağıtma.`
    : `Kullanıcının yazdığı istek/tema/fikir: "${alan}". Bunu MUTLAKA temel al — bir ürün fikri veya isteğiyse onu geliştir ve mevcut başka nesnelerle harmanla; bir alan/temaysa o alanda kal. Konuyu dağıtma.`;
  return tesis
    ? `Tesis alanı: SINIRSIZ — her sektörden, birbirinden bağımsız niş ve yüksek katma değerli üretim/yetiştirme tesisleri.`
    : `Tema: SINIRSIZ — her alandan, birbirinden bağımsız.`;
}

// Her iki aşamada da geçerli ortak kurallar
const ORTAK_KURAL =
`YARI TEKNOLOJİK serbest: basit sensör, mıknatıs, pil, yay, ısı, küçük elektronik, telefon-uygulaması bağlantısı kullanılabilir. AMA bilimkurgu, hayal ve VARSAYIM YASAK; bugünün ucuz, gerçek parçalarıyla üretilebilir olmalı, 10 saniyede anlaşılmalı. Her ürün MUTLAKA mevcut 2-3 sıradan nesnenin/ürünün BEKLENMEDİK HARMANI olmalı. Piyasada zaten satılan, klişe, bariz veya işe yaramaz şeyler YASAK.`;

// ÜRETİM TESİSİ modu: ürün icadı yerine ~3,5M TL ile kurulabilen niş üretim/yetiştirme tesisi yatırımı
const TESIS_KURAL =
`GERÇEKÇİ YATIRIM zorunlu: Türkiye'de bugünün şartlarıyla yaklaşık 3,5 milyon TL sermayeyle KURULABİLEN üretim/yetiştirme tesisleri öner. Hedef: kilogramı/gramı PAHALI, ihracat ya da niş iç pazar talebi olan, herkesin yapmadığı işler (mantar, tıbbi sülük, safran, salyangoz, mikroalg, böcek proteini, esansiyel yağ, zehir/biyo-madde tarzı). Bilimkurgu, hayalcilik ve abartılı rakam YASAK; bugünün gerçek girdileri, ekipmanı ve fiyatlarıyla muhakeme et. Bariz, doymuş, herkesin kurduğu (sıradan besi, normal sera domatesi) işler YASAK.`;

// Üretim tesisi modunda her turda farklı yatırım açıları
const TESIS_ACILAR = [
  "kilogramı/gramı çok pahalı bir biyo-madde üret (zehir, enzim, esans)",
  "Avrupa'ya ihracatı olan bir su ürünü / yetiştiricilik",
  "küçük alanda yüksek katma değerli yetiştiricilik (dikey/kapalı devre)",
  "devlet teşviki (IPARD/TKDK/KOSGEB) çeken bir tarım yatırımı",
  "atığı gelire çeviren döngüsel bir üretim tesisi",
  "tıbbi-aromatik bitki + işleme (distilasyon/kurutma) tesisi",
  "geleceğin protein/gıda kaynağı (böcek, mikroalg, mantar)",
  "niş hayvancılık (sülük, salyangoz, ipek böceği, arı ürünleri)",
  "ithal edilen bir ürünü yerli üreten ithal-ikame tesisi",
  "kozmetik/ilaç sanayiine hammadde üreten tesis"
];

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
function ureticiPrompt(alan, kacinilacak, kaynak, begenilen, adaySayisi, kalip, persona, ilham, yonerge, tesis){
  const n = [3, 6, 9].indexOf(adaySayisi) >= 0 ? adaySayisi : 6;
  const sistem = tesis ?
`Sen niş ÜRETİM TESİSİ yatırım uzmanısın. Görev: Türkiye'de ~3,5M TL ile kurulabilen, kârı/katma değeri yüksek, ihracat ya da niş iç pazar potansiyeli olan üretim/yetiştirme tesisleri önermek.
Bir yatırım danışmanı gibi düşün: her tesisi kafanda kabaca KUR — hangi girdi, hangi ekipman, hangi süreç, kim alır; zihninde kuramıyorsan o fikri YAZMA. Her aday bugünün gerçek girdileri ve fiyatlarıyla kurulabilir olmalı.
${TESIS_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (${n} aday), markdown yok, açıklama yok:
[{"isim":"tesis adı","ne":"tek cümle: ne üretir","neyden":"ana girdiler + temel ekipman","derde":"kim alır / hangi pazar talebini karşılar","nedenYok":"bu kadar kârlıysa neden herkes kurmuyor (giriş engeli)","vayBe":"şaşırtıcı kâr/değer noktası"}]` :
`Sen yaratıcı ama AYAĞI YERE BASAN bir ürün mucitisin. Görev: dünyada ve Türkiye'de HENÜZ OLMAYAN, herkesin kullanabileceği ürünler icat etmek.
Bir DIY/maker mucidi gibi düşün: her fikri kafanda kabaca KUR — hangi parça nereye, nasıl birleşir; zihninde kuramıyorsan o fikri YAZMA. Her aday bugünün ucuz parçalarıyla bir hafta sonunda prototiplenebilir olmalı.
${ORTAK_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (${n} aday), markdown yok, açıklama yok:
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün/nesnenin harmanı","derde":"çözdüğü gerçek günlük sorun","nedenYok":"bu kadar mantıklıysa neden hâlâ yok","vayBe":"insanı neden şaşırtır"}]`;
  const acilar = karistirSec(tesis ? TESIS_ACILAR : ACILAR, 3);
  const tohum = Math.floor(Math.random() * 1e6);
  const yasak = (Array.isArray(kacinilacak) && kacinilacak.length)
    ? ` ŞU fikirler DAHA ÖNCE üretildi; bunları ve çok benzerlerini KESİNLİKLE TEKRARLAMA: ${kacinilacak.slice(-45).join("; ")}.`
    : "";
  const begeni = (Array.isArray(begenilen) && begenilen.length)
    ? ` Kullanıcı ŞU tarz fikirleri BEĞENDİ; ruhen/temadan benzer ama YEPYENİ fikirler üret (asla kopyalama): ${begenilen.slice(0, 8).join("; ")}.`
    : "";
  const mod = kalip ? ` SEÇİLİ KALIP/MOD (tüm adaylar buna uysun): ${kalip}` : "";
  const bakis = persona ? ` BAKIŞ AÇIN (bu rolle üret): ${persona}` : "";
  const sinyal = ilham ? ` SAHADAN GERÇEK SİNYALLER (bunlardan ESİNLEN — ilişkili kavramları beklenmedik şekilde harmanla, gerçek dertlere çözüm üret; körü körüne kopyalama, klişeye düşme): ${ilham}` : "";
  const istek = yonerge ? ` KULLANICI YÖNERGESİ (EN YÜKSEK ÖNCELİK — buna MUTLAKA uy): ${yonerge}` : "";
  const kullanici = `${alanCumlesi(alan, tesis)}${kaynakCumlesi(kaynak)} Bu turda özellikle şu açılara bak: ${acilar}. Birbirinden tamamen farklı, ÖZGÜN ${n} aday üret; her turda yepyeni fikirler çıkar, kendini tekrar etme. Cesur ama gerçekçi ol; hayal kurma.${yasak}${begeni}${mod}${bakis}${sinyal}${istek} [çeşitlilik tohumu: ${tohum}]`;
  return { sistem, kullanici };
}

// 2. AŞAMA — KIRMIZI TAKIM eleştirmen: acımasız fizibilite + özgünlük denetimi (diyalog YOK)
function elestirmenPrompt(alan, adaylar, kaynak, derin, tesis){
  const heyet = derin
    ? (tesis
      ? "\nHEYET MODU: Her adayı 4 AYRI MERCEKten denetle — (a) ÜRETİLEBİLİRLİK/teknik, (b) PAZAR/ihracat talebi, (c) YATIRIM/geri ödeme, (d) RUHSAT/mevzuat. Bir mercekten bile çakıyorsa zayıf say. Kalanları bu 4 açıdan güçlendir."
      : "\nHEYET MODU: Her adayı 4 AYRI MERCEKten ayrı ayrı denetle — (a) TEKNİK fizibilite, (b) PAZAR/talep, (c) MALİYET, (d) ÖZGÜNLÜK. Bir mercekten bile çakıyorsa zayıf say. Kalanları bu 4 açıdan güçlendir.")
    : "";
  const sistem = tesis ?
`Sen acımasız bir YATIRIM DENETÇİSİsin: üretim tesisi fizibilitesi ve kârlılık denetçisi. Sana aday tesis fikirleri verilir; görevin gerçekçi olmayanları SERTÇE ELEMEK, kalanları KESKİNLEŞTİRMEK.${heyet}
ŞU adayları ELE (acımasız ol):
- Doymuş, herkesin kurduğu, bariz işler.
- ~3,5M TL sermayeye GERÇEKTEN sığmayan, abartılı yatırım isteyenler.
- Talebi/ihracatı şüpheli, alıcısı belirsiz olanlar.
- Türkiye'nin iklimi, mevzuatı ya da lojistiği açısından yürümeyecek olanlar.
SOKRATİK ELEME — her aday için kendine SOR, bir cevap bile 'hayır' ise AT: (1) ~3,5M'a gerçekten kurulur mu? (2) Kilogramı/gramı pahalı + talep gerçek mi? (3) Türkiye iklimi/mevzuatı uygun mu? (4) Giriş engeli onu koruyor mu, yoksa herkes mi yapar? (5) Geri ödeme makul süre içinde mi?
KALANLARI güçlendir: neyden/derde/nedenYok/vayBe alanlarını daha somut ve gerçekçi yap.
${TESIS_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür — eleyip güçlendirdiğin EN İYİ 3 aday (diyalog YOK, markdown YOK, açıklama YOK):
[{"isim":"tesis adı","ne":"tek cümle: ne üretir","neyden":"ana girdiler + ekipman","derde":"kim alır / pazar talebi","nedenYok":"neden herkes kurmuyor","vayBe":"şaşırtıcı kâr/değer noktası"}]` :
`Sen acımasız bir KIRMIZI TAKIM eleştirmenisin: ürün fizibilitesi ve özgünlük denetçisi. Sana aday ürün fikirleri verilir; görevin zayıfları SERTÇE ELEMEK, kalanları KESKİNLEŞTİRMEK.${heyet}
ŞU adayları ELE (acımasız ol):
- Piyasada zaten var olan, klişe, bariz olanlar.
- Bilimkurgu, hayalci, bugünün ucuz gerçek parçalarıyla ÜRETİLEMEYECEK olanlar.
- 10 saniyede anlaşılmayan ya da gerçek bir derde çözüm olmayanlar.
- 2-3 mevcut nesnenin BEKLENMEDİK HARMANI olmayanlar.
SOKRATİK ELEME — her aday için kendine SOR, bir cevap bile 'hayır' ise AT: (1) Gerçekten yeni mi, piyasada yok mu? (2) Bugünün ucuz parçalarıyla yapılır mı? (3) 10 saniyede anlaşılır mı? (4) Gerçek, sık yaşanan bir derde mi çözüm? (5) 2-3 nesnenin beklenmedik harmanı mı?
KALANLARI güçlendir: neyden/derde/nedenYok/vayBe alanlarını daha somut ve gerçekçi yap.
${ORTAK_KURAL}
ÇIKTI: SADECE geçerli bir JSON dizisi döndür — eleyip güçlendirdiğin EN İYİ 3 aday (diyalog YOK, markdown YOK, açıklama YOK):
[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün harmanı","derde":"çözdüğü gerçek sorun","nedenYok":"neden hâlâ yok","vayBe":"insanı neden şaşırtır"}]`;
  const kullanici = `${alanCumlesi(alan, tesis)}${kaynakCumlesi(kaynak)}\nAday fikirler:\n${JSON.stringify(adaylar)}\nBunları acımasızca denetle: zayıf/gerçekçi olmayanları AT, kalan en güçlü 3'ünü somutlaştır. Diyalog YAZMA; bu bir ara eleme aşamasıdır.`;
  return { sistem, kullanici };
}

// 3. AŞAMA — ÜST AKIL: ele, harmanla, güçlendir, diyalog yaz
function ustAkilPrompt(alan, adaylar, kaynak, ton, ilham, tesis){
  const cavSoz = karistirSec(CAVUS_SOZ, 8);
  const zeySoz = karistirSec(ZEYNEB_SOZ, 8);
  const sinyal = ilham ? `\nSAHADAN GERÇEK SİNYALLER (seçim ve olgunlaştırmada dikkate al; gerçek dertlere çözen ve ilişkili kavramları akıllıca harmanlayan adayı öne çıkar): ${ilham}` : "";
  const tonYonerge = ton === "sert"
    ? "\n- ATIŞMA TONU: SERT ve iğneleyici olsun; Zeyneb acımasızca eleştirsin, Çavuş sabırla direnç kırsın."
    : ton === "mizahi"
    ? "\n- ATIŞMA TONU: MİZAHİ ve esprili olsun; tatlı kahkaha dozu yüksek, ama bilim/mantık korunsun."
    : "";
  const konu = tesis ? "üretim tesisi fikirleri" : "ürün fikirleri";
  const kural = tesis ? TESIS_KURAL : ORTAK_KURAL;
  const yereBas = tesis
    ? "- Hepsini GERÇEKÇİ yatırıma indir: hayal/abartı/temennî temizle; ~3,5M TL ile kurulabilir ve gerçek talebe dayalı olsun."
    : "- Hepsini yarı-teknolojik ve YERE BASAN hale getir: varsayım/hayal/bilimkurgu temizle, gerçek ucuz parçalarla üretilebilir olsun.";
  const cavRol = tesis
    ? "(esmer erkek, çok detaycı, yatırım ve bilime aşık): tesisi ortaya atar ve SAVUNUR; Zeyneb'i yarı zarif sözle yarı rakam/mantıkla ikna eder."
    : "(esmer erkek, çok detaycı, bilime aşık): fikri ortaya atar ve SAVUNUR; Zeyneb'i yarı zarif sözle yarı bilim/mantıkla ikna eder.";
  const zeyRol = tesis
    ? "(kapalı/başörtülü doçent hanım): HİÇBİR ŞEYİ hemen beğenmez; talep, yatırım riski, ruhsat ve geri ödeme konusunda kusur arar, itiraz eder; Çavuş ikna edince gönülsüzce \"ikna ettin\" der."
    : "(kapalı/başörtülü doçent hanım): HİÇBİR ŞEYİ hemen beğenmez, eleştirir, kusur arar, itiraz eder; Çavuş ikna edince gönülsüzce \"ikna ettin\" der.";
  const sema = tesis
    ? `[{"isim":"tesis adı","ne":"tek cümle: ne üretir","neyden":"ana girdiler + temel ekipman","derde":"kim alır / pazar talebi","nedenYok":"neden herkes kurmuyor","vayBe":"şaşırtıcı kâr/değer noktası","aramaEN":"2-4 İngilizce arama kelimesi (gösterilmez)","diyalog":[{"kim":"Çavuş","soz":"..."},{"kim":"Zeyneb","soz":"..."}]}]`
    : `[{"isim":"","ne":"tek cümle","neyden":"hangi 2-3 ürünün harmanı","derde":"çözdüğü günlük sorun","nedenYok":"neden hâlâ yok","vayBe":"insanı neden şaşırtır","aramaEN":"2-4 İngilizce arama kelimesi (gösterilmez)","diyalog":[{"kim":"Çavuş","soz":"..."},{"kim":"Zeyneb","soz":"..."}]}]`;
  const sistem =
`Sen "4c1z"in ÜST AKLI'sın. Sana aday ${konu} verilir; görevin onları SÜZÜP OLGUNLAŞTIRMAK.
GÖREVİN:
- En zayıf, klişe, hayalci veya zaten-var olan adayları ELE.
- En güçlü adayları seç; gerekirse İKİ adayı harmanlayıp tek, daha güçlü fikir yap.
${yereBas}
- Kullanıcının isteğini sonuca entegre et.
- Sonuç: SADECE 1 (EN İYİ) fikir. Birden fazla VERME.
${kural}
Her fikir için bir ÇAVUŞ↔ZEYNEB sohbeti yaz:
- ÇAVUŞ ${cavRol}
- ZEYNEB ${zeyRol}
- 3-5 KISA replik, samimi ve tatlı atışmalı. Seslenirken HER replikte FARKLI kelime kullan: ÇAVUŞ→ZEYNEB: ${cavSoz}. ZEYNEB→ÇAVUŞ: ${zeySoz}.${tonYonerge}
- Ayrıca 'aramaEN' alanına bunu İngilizce ararken kullanılacak 2-4 anahtar kelime yaz (SADECE arama motoru için; kullanıcıya GÖSTERİLMEZ, fikrin kendisi ve diyalog Türkçe kalır).
ÇIKTI: SADECE geçerli bir JSON dizisi döndür (TEK elemanlı, yani 1 fikir), markdown yok:
${sema}`;
  const kullanici = `${alanCumlesi(alan, tesis)}${kaynakCumlesi(kaynak)}${sinyal}\nAday fikirler:\n${JSON.stringify(adaylar)}\nBunları süz, gerekirse harmanla ve güçlendir; SADECE EN İYİ 1'ini seç ve diyaloğuyla sun. Hayalci/varsayımsal olanı düzelt ya da çıkar.`;
  return { sistem, kullanici };
}

// 4. AŞAMA — UZMAN HEYETİ: fikri mühendislik gözüyle somutlaştır (diyalog GÖNDERİLMEZ/ÜRETİLMEZ)
function uzmanHeyetiPrompt(alan, fikir, kaynak, arama, patentArama, kur, derin, tesis){
  const genisHeyet = derin
    ? (tesis
      ? " EK UZMANLAR (heyet modu): Lojistik & Soğuk Zincir Uzmanı, Finansman/Kredi Danışmanı ve Gıda Güvenliği & Sertifikasyon (organik, HACCP) Denetçisi de masada — değerlendirmene bu açıları da kat."
      : " EK UZMANLAR (heyet modu): İmalat Mühendisi (üretim hattı/montaj), Ticari Stratejist (iş modeli/fiyat) ve Güvenlik & Etik Denetçisi (risk, yönetmelik) de masada — değerlendirmene bu açıları da kat.")
    : "";
  const sistem = tesis ?
`Sen bir UZMAN HEYETİSİN: Ziraat/Su Ürünleri Mühendisi + Yatırım Maliyetçisi + İhracat Uzmanı + Teşvik Danışmanı (IPARD/TKDK/KOSGEB) + Mevzuat/Ruhsat Denetçisi + Pazar Analisti tek heyet olarak bir ÜRETİM TESİSİ fikrini değerlendirir.${genisHeyet} Görevin onu MÜHENDİSLİK + YATIRIM gözüyle somutlaştırmak. Hayal/abartı YOK; bugünün gerçek girdileri, ekipmanı ve gerçekçi rakamlarıyla, kısa ve net konuş.
${kur ? "GÜNCEL KUR: 1 USD ≈ " + kur + " TRY. 'maliyet' alanını HEM ₺ HEM $ ver, bu güncel kuru kullan." : ""}
ÜRETİM/YETİŞTİRME GERÇEKLİĞİ ZORUNLU: iklim/sıcaklık, biyolojik döngü (büyüme/verim süresi), girdi tedariki, ekipman, su/enerji ve işgücü açısından muhakeme et; sihir/temennî yok. En kritik darboğazı (iklim, ruhsat, hammadde, pazar) bul ve tesisin bunu gerçekten geçip geçmediğini dürüstçe söyle.
${arama ? "GERÇEK WEB ARAMA SONUÇLARI (mevcut benzer tesisler/rakipler VE talep tahmini için BUNLARI temel al; gerçekten benzer olanları belirt, alakasızları ele):\n" + arama : "Web araması yok; 'benzer tesisler' ve 'talep' için en iyi tahminini ver, abartma, uydurma."}
SİNYAL YORUMU (arama sonuçlarındaki işaretleri OKU, körü körüne sayma):
- Çok sayıda mevcut üretici/ihracatçı = GÜÇLÜ rakip/doygunluk → 'benzer' alanında dürüstçe söyle ve nasıl FARKLILAŞTIĞINI belirt.
- Yüksek ihracat rakamı / ithalat bağımlılığı = GERÇEK talep → 'talep' yüksek.
- Neredeyse hiç sonuç yok = ya gerçekten niş ya da pazar yok; bu ikisini dürüstçe AYIRT et, otomatik "talep yüksek" deme.
'talep' alanını bu okumaya göre yaz; abartma, uydurma.
PREMIUM HÜKÜM: tüm sinyalleri (rakip/doygunluk, talep/ihracat, yatırım/geri ödeme, ruhsat, iklim/teknik darboğaz) tart ve tesise 0-100 arası bir KÂRLILIK+UYGULANABİLİRLİK skoru ver ('skor'); 'hukum' alanına tek cümlede en güçlü yön + en büyük riski yaz. Güçlü rakip, belirsiz talep ya da yüksek teknik/ruhsat riski varsa skor DÜŞÜK olsun; abartma.
FARKLILAŞMA: arama güçlü mevcut üretici gösteriyorsa 'farklilas' alanına tesisi 'herkes yapıyor'dan kurtaracak SOMUT bir kıvrım (niş ürün, sertifika, ihracat pazarı) yaz; belirgin rakip yoksa boş bırak.
ÇIKTI: SADECE geçerli bir JSON dizisi (TEK eleman), markdown YOK, açıklama YOK:
[{"isim":"<sana verilen ismi AYNEN yaz>","skor":"0-100 arası tek sayı","hukum":"tek cümle: en güçlü yön + en büyük risk","nasil":"nasıl kurulur + ana ekipman/süreç, 1-2 cümle","maliyet":"kabaca kurulum (CAPEX) + birim üretim maliyeti (₺ ve $)","benzer":"Türkiye/dünyada mevcut benzer tesisler/rakipler ya da 'belirgin örnek yok'","farklilas":"güçlü rakip varsa farklılaştıracak somut kıvrım, yoksa boş","talep":"aramaya dayalı ihracat + iç pazar talebi tahmini (1 cümle)","patent":"gerekli ruhsat/izinler + alınabilecek teşvik/hibe (IPARD/TKDK/KOSGEB), kısaca","teknik":"en kritik iklim/biyolojik/teknik darboğaz ve tesis bunu gerçekçi şekilde geçiyor mu (1 cümle)","prototip":"ilk pilot üretimi başlatmak için atılacak ilk somut adım","yapiTaslari":"bu tesisi KURARKEN yararlanılacak 2-3 somut kaynak (teşvik programı, danışman/kuruluş, üretici birliği) kısa nedenle; uygun yoksa boş bırak"}]` :
`Sen bir UZMAN HEYETİSİN: Üretim Uzmanı + Maliyetçi + Rakip Analisti + Patent Denetçisi + Pazar Analisti + Ürün Müdürü tek heyet olarak bir ürün fikrini değerlendirir.${genisHeyet} Görevin onu MÜHENDİSLİK gözüyle somutlaştırmak. Hayal/varsayım YOK; bugünün ucuz gerçek parçaları ve gerçekçi rakamlarla, kısa ve net konuş.
${kur ? "GÜNCEL KUR: 1 USD ≈ " + kur + " TRY. 'maliyet' alanını HEM ₺ HEM $ ver (ör. '≈900₺ / 26$'), bu güncel kuru kullan." : ""}
ÜRETİM FİZİĞİ ZORUNLU: malzeme özellikleri (dayanım, ısı, ağırlık, iletkenlik), mekanik yükler, güç/enerji bütçesi ve üretilebilirlik açısından muhakeme et; sihir/temennî yok. En kritik fiziksel kısıtı bul ve fikrin bunu gerçekten geçip geçmediğini dürüstçe söyle.
${arama ? "GERÇEK WEB ARAMA SONUÇLARI (benzer ürünler VE talep tahmini için BUNLARI temel al; gerçekten benzer olanları belirt, alakasızları ele):\n" + arama : "Web araması yok; 'benzer ürünler' ve 'talep' için en iyi tahminini ver, abartma, uydurma."}
${patentArama ? "GERÇEK PATENT ARAMA SONUÇLARI (Google Patents): 'patent' alanını BUNLARA dayandır; gerçekten benzer patent var mı söyle, alakasızları ele:\n" + patentArama : "Patent araması sonuç vermedi; 'patent' alanında 'belirgin patent bulunamadı' de, uydurma."}
SİNYAL YORUMU (arama sonuçlarındaki işaretleri OKU, körü körüne sayma):
- GitHub ★/⑂ yüksek + güncel tarih, ya da HN yüksek puan = GÜÇLÜ mevcut rakip/ilgi → 'benzer' alanında bunu dürüstçe söyle ve fikrin nasıl FARKLILAŞTIĞINI belirt.
- Çok "Soru:" ama az/zayıf çözüm = karşılanmamış GERÇEK ihtiyaç → talep yüksek.
- Neredeyse hiç sonuç yok = ya gerçekten yeni ya da kimse istemiyor; bu ikisini dürüstçe AYIRT et, otomatik "talep yüksek" deme.
- "arXiv:" ile başlayanlar BİLİMSEL MAKALEdir — rakip/ürün DEĞİL; 'teknik' alanını ve fizibiliteyi desteklemek için kullan, "benzer ürün" sayma.
'talep' alanını bu okumaya göre yaz; abartma, uydurma.
PREMIUM HÜKÜM: tüm sinyalleri (rakip gücü, talep, patent, teknik fizik) tart ve fikre 0-100 arası bir ÖZGÜNLÜK+UYGULANABİLİRLİK skoru ver ('skor'); 'hukum' alanına tek cümlede en güçlü yön + en büyük riski yaz. Güçlü rakip ya da yüksek teknik risk varsa skor DÜŞÜK olsun; abartma.
FARKLILAŞMA: arama güçlü mevcut rakip gösteriyorsa 'farklilas' alanına fikri 'zaten var'dan kurtaracak SOMUT bir kıvrım yaz; belirgin rakip yoksa boş bırak.
ÇIKTI: SADECE geçerli bir JSON dizisi (TEK eleman), markdown YOK, açıklama YOK:
[{"isim":"<sana verilen ismi AYNEN yaz>","skor":"0-100 arası tek sayı","hukum":"tek cümle: en güçlü yön + en büyük risk","nasil":"nasıl yapılır + hangi gerçek parçalar, 1-2 cümle","maliyet":"kabaca birim üretim maliyeti aralığı (TL veya $)","benzer":"piyasadaki benzer/rakip ürünler ya da 'belirgin örnek yok'","farklilas":"güçlü rakip varsa farklılaştıracak somut kıvrım, yoksa boş","talep":"aramaya dayalı talep/ilgi tahmini (1 cümle)","patent":"benzer patent var mı; varsa kısaca hangisi, yoksa 'belirgin patent bulunamadı'","teknik":"en kritik fiziksel/mühendislik kısıtı ve fikir bunu gerçekçi şekilde geçiyor mu (1 cümle)","prototip":"ilk çalışan prototipi yapmak için atılacak ilk somut adım","yapiTaslari":"bu fikri KURMAK için kullanılabilecek 2-3 AÇIK KAYNAK araç/kütüphane/proje (rakip DEĞİL, yapı taşı); aramadaki GitHub sonuçlarından uygun olanları ya da iyi bilinen açık kaynakları kısa nedenle yaz; uygun yoksa boş bırak"}]`;
  const kullanici = `${alanCumlesi(alan, tesis)}${kaynakCumlesi(kaynak)}\nDeğerlendirilecek ${tesis ? "üretim tesisi" : "ürün"} fikri:\n${JSON.stringify({ isim: fikir.isim, ne: fikir.ne, neyden: fikir.neyden, derde: fikir.derde })}\nBunu uzman heyeti gözüyle somutlaştır. Diyalog veya istenmeyen alan EKLEME; sadece istenen alanları doldur.`;
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
