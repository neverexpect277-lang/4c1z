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
      <button class="star ${favMi(f.isim) ? "on" : ""}" data-act="fav">☆</button>
    </h2>
    <p class="ne">${escapeHtml(f.ne || "")}</p>
    ${diyalogHTML(f.diyalog)}
    ${sec("Neyden", f.neyden)}
    ${sec("Hangi derde", f.derde)}
    ${sec("Neden hâlâ yok", f.nedenYok)}
    ${f.vayBe ? `<div class="field vaybe"><b>Vay be sebebi</b>${escapeHtml(f.vayBe)}</div>` : ""}
    <div class="cardfoot">
      <button class="mini" data-act="kopya">Kopyala</button>
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
  return el;
}
function cizFikirler(list){
  out.innerHTML = "";
  if(!list || !list.length){
    out.innerHTML = `<div class="empty">Yukarıdan bir alan seç (ya da boş bırak)<br/>ve <b>Fikir Üret</b>'e bas.</div>`;
    return;
  }
  list.forEach(f => out.appendChild(fikirKart(f)));
}
function cizKayitlilar(){
  statusEl.textContent = "";
  const a = favleriYukle();
  out.innerHTML = "";
  if(!a.length){ out.innerHTML = `<div class="empty">Henüz kaydın yok.<br/>Beğendiğin fikrin ☆ yıldızına bas.</div>`; return; }
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
function flash(msg){ statusEl.textContent = msg; setTimeout(() => { if(mod==="yeni") statusEl.textContent=""; }, 1500); }

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ---- AI çağrıları (prompt.js: promptYap, jsonAyikla) ----
const POLL_MODELLER = ["openai", "mistral", "llama"]; // pollinations ücretsiz modelleri
async function cagir(alan){
  const { sistem, kullanici } = promptYap(alan);
  let son = new Error("pollinations modelleri yanıt vermedi");
  for(const model of POLL_MODELLER){
    const body = {
      messages: [
        { role: "system", content: sistem },
        { role: "user", content: kullanici }
      ],
      model,
      seed: Math.floor(Math.random() * 1e9),
      referrer: location.hostname || "4c1z",
      token: PK
    };
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 45000);
    try{
      const r = await fetch(ENDPOINT + "?token=" + encodeURIComponent(PK) + "&key=" + encodeURIComponent(PK), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      if(r.ok){
        const t = await r.text();
        if(t && t.trim()) return t;
      }else{
        son = new Error("HTTP " + r.status); son.status = r.status;
      }
    }catch(e){ son = e; }
    finally{ clearTimeout(to); }
  }
  throw son;
}

async function cagirGemini(alan){
  const { sistem, kullanici } = promptYap(alan);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 30000);
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

let calisiyor = false;
async function uret(){
  if(calisiyor) return;
  if(mod !== "yeni") setMod("yeni");
  calisiyor = true;
  $("#gen").disabled = true;
  out.innerHTML = "";

  const alan = alanInput.value.trim();
  const mesajlar = ["Çavuş ve Zeyneb istişare ediyor…","Çavuş sıradan fikirleri eliyor…","Zeyneb \"vay be\" diyor…","Birleştiriyor, icat ediyor…"];
  let mi = 0;
  statusEl.innerHTML = `<span class="spin"></span>${mesajlar[0]}`;
  const dongu = setInterval(() => { mi=(mi+1)%mesajlar.length; statusEl.innerHTML = `<span class="spin"></span>${mesajlar[mi]}`; }, 2200);

  let fikirler = null;
  const DENEME = 3;
  for(let deneme = 1; deneme <= DENEME && !fikirler; deneme++){
    // önce Google Gemini, olmazsa pollinations
    try{ fikirler = jsonAyikla(await cagirGemini(alan)); }catch(e){}
    if(!fikirler){ try{ fikirler = jsonAyikla(await cagir(alan)); }catch(e){} }
    if(!fikirler && deneme < DENEME){
      clearInterval(dongu);
      statusEl.innerHTML = `<span class="spin"></span>Çavuş ürün tarıyor…`;
      await new Promise(res => setTimeout(res, 3000));
    }
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
