# Tasarım Sistemi — Atölye / Sahibindenv2

Bu doküman projenin görsel kimliğini sabitlemek içindir. Yeni bir bileşen veya
sayfa eklerken **buradaki kurallara uy**. Hex/HSL/sınıf adları değiştirme,
istisnai durumda burayı güncelle.

---

## 1. Felsefe

- **Sıcak, kâğıt hissi.** Steril beyaz / saf siyah yok. Light modda krem,
  dark modda yumuşak kahverengi.
- **Açık tonlar ağırlıklı.** Hem light hem dark modda **arka plan
  ağırlığı açık taraftadır**. Koyu lekeler (kart üstü kart üstü kart)
  yığma — havadar bırak. Boşluk sayfanın bir parçasıdır.
- **Dark mod insanı yormamalı.** Saf siyah (`#000`) yasak — tabanımız
  açık warm brown (`#3A322A` civarı). "Mağara" hissi vermeyecek; ekrana
  uzun süre bakmak gözü kasmamalı.
- **Glassmorphism** sınırlı yerlerde (FAB, asistan paneli, dock). Tüm
  arayüzü cam yapma — okunaklılığı bozar.
- **İtalik kullanma.** Hiçbir yerde. Vurgu istiyorsan **font weight**
  (medium/semibold) veya **renk** (terracotta accent) kullan, eğri yazı
  değil.

---

## 2. Renk paleti

CSS değişkenleri `src/index.css` içinde tanımlı, **hep oradan oku**.
Tailwind sınıfları: `bg-background`, `text-foreground`, `border-border`,
`text-muted-foreground`, `bg-card`, `text-accent`, vs.

### Light (default) — açık, havadar

| Token | HSL | Yaklaşık hex | Kullanım |
|---|---|---|---|
| `--background` | `36 38% 98%` | #FBF8F2 | Sayfa zemini (açık warm cream) |
| `--foreground` | `28 14% 22%` | #3F362D | Ana yazı (warm ink, saf siyah değil) |
| `--card` | `36 40% 100%` | #FFFCF7 | Kart yüzeyi (zeminden hafifçe daha parlak) |
| `--muted` | `34 22% 95%` | #F2EDE3 | Yumuşak arka plan |
| `--muted-foreground` | `28 8% 48%` | #847B70 | İkincil yazı (warm gray) |
| `--border` | `32 20% 90%` | #E5DCCD | Ayraç çizgi |
| `--accent` | `22 60% 50%` | #CC6A33 | Terracotta vurgu |

### Dark — yumuşak warm brown, açık ağırlıklı

| Token | HSL | Yaklaşık hex | Kullanım |
|---|---|---|---|
| `--background` | `28 10% 22%` | #3D352D | Sayfa zemini (orta-açık warm brown) |
| `--foreground` | `36 28% 92%` | #F1E8D6 | Ana yazı (parlak cream) |
| `--card` | `28 10% 26%` | #463D34 | Kart yüzeyi (zeminden 1 ton açık) |
| `--muted` | `28 10% 28%` | #4B4239 | Yumuşak arka plan |
| `--muted-foreground` | `32 18% 76%` | #C9BDA8 | İkincil yazı (yüksek okunaklı tan) |
| `--border` | `28 10% 34%` | #5B5145 | Ayraç çizgi |
| `--accent` | `22 65% 62%` | #DD8854 | Parlak terracotta |

### Yasaklar

- ❌ `bg-white` / `bg-black` direkt kullanma. Token'ları kullan.
- ❌ Saf `#000` arka plan. Dark modda zemin **açık warm brown** (~#3D352D).
- ❌ Dark mod için `--background` HSL lightness değerini **20%'in altına
  düşürme**. Mağara hissi yasak.
- ❌ `text-gray-*` yerine **`text-muted-foreground`**.
- ❌ Mavi sky-* / indigo-* gibi soğuk tonlar UI için kullanılmaz. (Veri
  görselinde gerekirse — örn. grafikte — sınırlı.)
- ❌ Üst üste 3'ten fazla koyu yüzey katmanı (kart üstü kart üstü kart).
  Açık zeminin nefes almasına izin ver.

---

## 3. Tipografi

`@theme inline` üzerinden font-family değişkenleri:

| Token | Font | Tailwind sınıfı | Kullanım |
|---|---|---|---|
| `--font-sans` | **Inter** | `font-sans` (default) | Tüm gövde, UI, butonlar |
| `--font-serif` | **Lora** | `font-serif` | Sadece panel başlıkları, kart başlıkları (h1/h3) |
| `--font-mono` | **JetBrains Mono** | `font-mono` | Etiketler, kbd, küçük caps yazılar |

Inter ve Lora Google Fonts'tan `index.html` üzerinden yüklenir.

### Kurallar
- **Gövde metni → font-sans.** Her zaman.
- **Başlıklar (h1/h2/h3) → font-serif.** Light weight (300–500). Hafif
  letter-spacing negatif (`tracking-tight`).
- **Mono yazılar küçük yazılır:** uppercase, `tracking-[0.16em]`,
  `text-[10px]`, `text-muted-foreground`. Bölüm etiketleri ve KBD için.
- **İtalik (`italic`):** Sadece serif başlık içinde **vurgu kelimesinde**.
  Gövde metninde italik kullanma.

### Boyut iskeleti
| Eleman | Boyut | Weight |
|---|---|---|
| Panel başlık (h1) | `text-3xl md:text-[42px]` | 300 (light) |
| Kart başlık (h3) | `text-lg` | 500 |
| Gövde | `text-sm` | 400 |
| Caption / mono | `text-[10px]` uppercase tracking-[0.16em] | 500 |

---

## 4. Glassmorphism

Cam efektine **özel CSS değişkenleri** kullanılır (yeniden hesaplama yapma):

```css
--glass-tint        /* yarı saydam tint katmanı */
--glass-highlight   /* iç üst kenar parlaması */
--glass-highlight-soft
--glass-shadow      /* dış yumuşak gölge */
--glass-text        /* cam üzerinde okunaklı yazı rengi */
```

İki üretim noktası:
1. **`<GlassEffect>`** (`src/components/ui/liquid-glass.tsx`) — dock/FAB
   için liquid glass + SVG distortion filter. **Bunu değiştirme.**
2. **`<GlassButton>`** (`src/components/ui/glass-button.tsx`) — paneller
   içinde 3D cam buton. CSS sınıfları `.glass-button*` (`index.css`'te).

### Kurallar
- Backdrop blur asgari **14px**, doygunluk **180%** (mevcut değerler).
- Cam alanların **arka planında** mutlaka bir bulanıklık yaratacak içerik
  olmalı (gradient, grid, görsel). Düz tek renk üstüne cam koyma.
- Light/dark için ayrı `--glass-*` değer setleri vardır — yeni cam
  bileşeninde de bu değişkenleri çağır, hardcode'lama.
- `prefers-reduced-transparency` ve `prefers-contrast` media query
  fallback'leri korunmalı.

---

## 5. Vurgu rengi — Kahve ↔ Krem (bakır/turuncu YOK)

Vurgu rengi **temayı tersine çevirir**:
- **Light modda:** `--accent` = koyu kahve (`#4F4034` civarı). Krem zemin
  üstünde dramatik bir okuma ağırlığı verir.
- **Dark modda:** `--accent` = krem (`#ECE2D0` civarı). Açık warm brown
  zemin üstünde sakin bir vurgu yaratır.

`--accent-foreground` her zaman ters yön: light'ta krem, dark'ta dark
brown. Yani submit butonu light modda `bg-accent text-accent-foreground` =
**dark brown buton + krem yazı**, dark modda **krem buton + dark brown
yazı**.

### Pattern
- Submit / primary buton: `bg-accent text-accent-foreground hover:opacity-90`
- Vurgu yazısı: `text-stone-800 dark:text-stone-200` (Tailwind palette
  eşleniği — token kullanmak istemediğinde).
- Lozenge / tag arkaplanı: `bg-stone-700/10 dark:bg-stone-200/10`.
- Focus ring: `border-stone-700/50 dark:border-stone-300/50` +
  `ring-2 ring-stone-500/10`.

### Yasaklar
- ❌ `orange-*`, `amber-*`, `red-*`, `terracotta` ton **vurgu olarak**
  kullanma. Bakır/turuncu hissi istemiyoruz.
- ❌ `indigo-*`, `sky-*`, `blue-*`, `teal-*` — soğuk renkler UI vurgusu
  olarak kullanılmaz.

---

## 6. Köşe yarıçapları

- Buton/badge: `rounded-xl` (12px)
- Kart: `rounded-2xl` (16px)
- Panel/modal: `rounded-xl` (12px)
- Pill / chip: `rounded-full`
- Mini icon kutu (avatar/lozenge): `rounded-lg` (8px)

---

## 7. Mevcut özel bileşenler

Korumalı, davranışını veya görünümünü bozma:

| Bileşen | Dosya | Notlar |
|---|---|---|
| Atom FAB | `infinite-grid-integration.tsx` | 3D SVG, scale pulse, dark/light `currentColor` |
| GlassButton | `glass-button.tsx` + `index.css` | `.glass-button*` sınıfları zorunlu |
| GlassDock | `liquid-glass.tsx` | Tasarım Apple Liquid Glass |
| Asistan paneli | `infinite-grid-integration.tsx` | `assistantOpen/Mode` state — modules ↔ suggestions |

Bunları yeniden yazma. **Genişletmek** istiyorsan prop ekle.

---

## 8. Yeni bileşen eklerken kontrol listesi

- [ ] Renkler `bg-*` / `text-*` token'ları ile mi (hardcoded hex yok)?
- [ ] Light + dark modda kontrast yeterli mi (en az 4.5:1 gövdede)?
- [ ] Saf siyah/beyaz kullandın mı? **Hayır** olmalı.
- [ ] Italik gövde metninde mi? **Hayır** olmalı.
- [ ] Font-family override yaptın mı? **Sadece** `font-serif` veya
      `font-mono` ile, başka değer girme.
- [ ] Glass kullanıyorsan `--glass-*` değişkenleri mi (yeni shadow icat
      etmedin değil mi)?
- [ ] Köşe yarıçapı listesindekilerden mi?
- [ ] Mavi/indigo soğuk ton girdin mi (UI'da)? **Hayır** olmalı.
