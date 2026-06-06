# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan.

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## ÇALIŞMA KURALLARI

### VARSAYIM YASAĞI
- Belirsiz her şeyi ÖNCE sor, sonra yaz
- Dosya yolu, versiyon, kütüphane net değilse → DUR, SOR
- "Muhtemelen şunu istiyorsunuzdur" → YASAK

### KOD YAZMADAN ÖNCE ONAY AL
1. Ne yapacağını 3-5 madde listele
2. Hangi dosyaları değiştireceğini söyle
3. "Onaylıyor musunuz?" diye sor
4. Onay gelmeden tek satır kod yazma

### KÜÇÜK ADIMLAR
- Tek seferde 1 iş yap
- Her adımdan sonra dur, geri bildirim bekle
- "Şimdi X'i de yapayım mı?" diye sor, yapma

### MEVCUT KODU KORU
- Görmediğin kodu silme veya değiştirme
- Refactor talep edilmemişse yapma
- Sadece istenen değişikliği yap

### HATA YÖNETİMİ
- Aynı hatayı 2 kez deneme
- 2. denemede dur: "Bu çalışmıyor çünkü X. Alternatif: Y veya Z. Hangisini deneyelim?" de
- Varsayım yapma — varsayım yasak

### TOKEN TASARRUFU
- "Tabii ki!", "Harika!", "Anladım, şimdi..." gibi dolgu cümleler yasak
- Giriş cümlesi yazma, direkt kodu ver
- Yorum satırı sadece karmaşık mantıkta yaz
- Zaten var olan kodu tekrar gösterme, sadece değişen kısmı göster

### CLAUDE CODE KOMUTLARI (Yasin Arsal reels)

- **ULTRATHINK**: Prompt sonuna eklenince derin düşünme moduna geçer
- **/compact**: Uzun sohbeti sıkıştırır, token tasarrufu
- **/model opusplan**: Plan modunda Opus 4.8, normal işte Sonnet 4.6
