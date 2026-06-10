# 4c1z — AI Ürün Fikri Üreteci

**Canlı:** https://4c1z.vercel.app

Dünyada ve Türkiye'de olmayan, yarı-teknolojik, herkesin kullanabileceği **yeni ürün fikirleri** üretir. Her fikri **Çavuş & Zeyneb** karakterleri Osmanlıca seslenişlerle tatlı bir atışmayla tartışır.

## Nasıl çalışır — 4 aşamalı premium üst akıl
```
üretici (6 aday, DIY-maker düşünme)
   → kırmızı-takım eleştirmen (Sokratik eleme → en iyi 3)
   → üst akıl (en iyi 1 + Çavuş↔Zeyneb diyaloğu)
   → uzman heyeti (web destekli mühendislik)
```

## Anahtarsız ajan ordusu (hiçbir API anahtarı gerekmez)
Web arama (SearXNG + DuckDuckGo + Wikipedia tr/en) · GitHub (★/fork/topics) · Stack Exchange · Hacker News · Reddit (gerçek kullanıcı dert/talep sinyali) · Google Patents · arXiv · Datamuse kelime genişletme · Frankfurter güncel USD→TRY kuru. İngilizce arama perde arkasında çalışır, çıktı %100 Türkçe.

## Her fikir kartında
Premium **skor (0-100)** + hüküm · Nasıl yapılır · Tahmini maliyet (₺/$) · Benzer ürünler · Talep/ilgi · Patent durumu · Teknik gerçeklik (üretim fiziği) · Farklılaş · İlk prototip adımı · Açık kaynak yapı taşları.

## Özellikler
Kaydet (★) + durum/puan/not · alan filtresi + metin arama · isimli temalar · **mod kalıpları** (fabric ilhamı: ucuz prototip / yüksek teknoloji / sosyal fayda / çevre / eğlence — tek tıkla üretimi o tarza yönlendirir) · "Önerilen Fikirler" katlanabilir kutusu · kaynak alanı (NotebookLM mantığı) · **URL'den kaynak çekme** (firecrawl ilhamı: kaynak kutusuna link yapıştır → "Linki çek" → sayfa sunucudan temiz metne dönüşür, `/api/cek`, anahtarsız) · **akıllı kaynak seçimi** (ragflow ilhamı: uzun belge cümlelere bölünür, alanla en alakalı kısımlar seçilip beslenir — belge promptu boğmaz, anahtarsız RAG) · **canlı ajan zinciri + öğrenen hafıza** (mastra ilhamı: 4 aşama ekranda adım adım ilerler; beğenilen kayıtlar üreticiye pozitif sinyal olur, geçmiş fikirler tekrarlanmaz) · **ayarlanabilir akış motoru** (dify ilhamı: 4 aşamayı düzenlenebilir akış olarak gör; aday sayısı, eleme, diyalog tonu, web araması düğümden ayarlanır; ayrıca otomasyon: "Otomatik üret" butonu (arka arkaya çok fikir) + skor tetikli oto-kaydet — n8n ilhamı; ayarlar kalıcı) · **anlamsal mod (deneysel)** (transformers.js ilhamı: tarayıcıda embedding — anahtarsız/sunucusuz; üretilen fikre anlamca benzer kaydı tespit eder + adayları anlamca tekrar-eler (aynı ürünü vermez) + kaynağı anlamca seçer; isim değil anlam karşılaştırır; model yoksa keyword moduna düşer) · **yerel LLM (deneysel)** (web-llm ilhamı: WebGPU'lu cihazda tarayıcıda tam LLM, sıfır API; yoksa buluta düşer) · **heyet modu (çok ajan)** (swarm/agent-framework deseni: üretici 10 personalık ajan ordusu, her turda 6'sı paralel (mucit, tasarımcı, girişimci, mühendis, sürdürülebilirlik, erişilebilirlik, ev ekonomisti, oyun tasarımcısı, sağlık, doğa) — eleştirmen 4 mercek, uzman heyeti geniş; daha çeşitli + derin, opt-in) · PWA (telefona kurulur) · **kartta canlı pazar taraması** (browser-use ilhamı: "Pazarı tara" → fikre özel web/rakip taraması, /api/ara ajan ordusu) · **uygulama içi öğren rehberi** (generative-ai-for-beginners ilhamı: "Nasıl çalışır?" — 4 aşama, ajanlar ve ipuçları) · kalıcı oturum (localStorage).

## Teknik
Saf vanilla JS + Vercel serverless (`api/gen` Gemini, `api/poll` Pollinations, `api/ara` çok-kaynaklı arama, `api/cek` URL→metin). Backend/veritabanı yok. 235 jsdom testi (`npm test`).

---

## İlham / Faydalı 10 Repo

1. **[comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)** — Düğüm tabanlı görsel AI görüntü üretim hattı. Ürün görseli üretmek istersen en güçlü açık kaynak.
2. **[mastra-ai/mastra](https://github.com/mastra-ai/mastra)** — TypeScript AI ajan framework'ü (Python değil; JS stack'ine en yakın). Ajan, workflow, hafıza, RAG; Vercel'de çalışır.
3. **[langgenius/dify](https://github.com/langgenius/dify)** — Görsel LLM uygulama builder'ı: sürükle-bırak ajan/RAG/workflow.
4. **[infiniflow/ragflow](https://github.com/infiniflow/ragflow)** — Derin belge anlama + RAG motoru. "Kaynak" özelliğinin kurumsal versiyonu.
5. **[mendableai/firecrawl](https://github.com/mendableai/firecrawl)** — Web sitelerini LLM'e hazır temiz metne çevirir (URL → markdown). "Kaynağa URL yapıştır" için.
6. **[danielmiessler/fabric](https://github.com/danielmiessler/fabric)** — AI prompt "pattern" çerçevesi; hazır fikir-üret/özetle/eleştir kalıpları.
7. **[alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai)** — Gerçekten açık kaynak AI projeleri/model/araç listesi.
8. **[browser-use/browser-use](https://github.com/browser-use/browser-use)** — Web'i kendi gezen AI ajanı. Otomatik rakip/pazar taraması için.
9. **[n8n-io/n8n](https://github.com/n8n-io/n8n)** — AI düğümlü iş akışı otomasyonu; 400+ entegrasyon.
10. **[microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners)** — Microsoft'un ücretsiz "sıfırdan generative AI uygulaması" kursu.
