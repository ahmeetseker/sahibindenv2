# Module Summary Bento — Design Spec

**Date:** 2026-04-28
**Branch context:** `feat/page-transition-skeletons`
**Status:** Approved for plan

## Özet

`AssistantModal` ("Nereye gidelim?") üzerinden bir modül seçildiğinde, **direkt asıl sayfayı açmak yerine** önce o modüle özel **4 kartlı bento summary** ekranı açılır. Her kart, asıl sayfanın belirli bir görünüm/filtre kombinasyonuna **deep-link** sağlar. Header'da küçük bir "Sayfaya git" butonu modülün varsayılan görünümüne, "ESC GERİ DÖN" pill'i ise Hub modal'ına geri döner.

Hedefler:
- Kullanıcıya modülün anlık özetini sunmak (KPI + chart + dağılım + liste).
- Modülün alt bölümlerine tek tıkla erişim sağlamak (deep-link).
- Mevcut tasarım dilini (dark/glass, font-serif başlık, font-mono caption, mintgreen accent) korumak.
- Viewport-fit (no scroll, ≥768px ekranda).

Hedef olmayanlar:
- URL routing eklemek (mevcut app state-based).
- Backend persistence (saved filter setleri, otomasyon kuralları statik kalır).
- Card içi sub-row tıklama (faz 2).
- Real-time veri akışı (mock + derived yeterli).

---

## 1. Mimari & State akışı

### 1.1 Yeni state (`infinite-grid-integration.tsx`)

```ts
type SummaryEntryId =
  | 'listings' | 'categories' | 'customers'
  | 'finance' | 'reports' | 'profile';

const [activeSummary, setActiveSummary] = useState<SummaryEntryId | null>(null);
const [pageDeepLink, setPageDeepLink] = useState<DeepLink | null>(null);
```

### 1.2 Akış

```
AssistantModal "Nereye gidelim?"
   │ user "İlanları aç"
   ▼
onPickModule(entryId)               (modal kapanır)
   │
   ▼
setActiveSummary(entryId)           ◄─── ESC ile Hub geri açılır
   │
   ▼
<ModuleSummary entry={config[entryId]}
   onCardClick={(deepLink) => {
      setActiveSummary(null);
      setPageDeepLink(deepLink);
      setActiveDock(config[entryId].target);
   }}
   onPrimary={() => {                 // "Sayfaya git" pill
      setActiveSummary(null);
      setActiveDock(config[entryId].target);
   }}
   onClose={() => {                   // ESC / GERİ DÖN
      setActiveSummary(null);
      setAssistantOpen(true);
   }}
/>
   │
   ▼
<ListingsPage initial={pageDeepLink} />   (deep-link consume edilir, sonra reset)
```

### 1.3 Modal → Summary entry mapping

`assistant-modules-screen.tsx` mevcut `onPickModule(target: string)` signature'ı `onPickModule(entryId: SummaryEntryId)` olur. Kategoriler & İlanlar artık ayrı entry → ayrı summary, ama ikisinin `target` alanı `'listings'` olarak kalır.

| Entry id | Modal title | Target page |
|---|---|---|
| `listings` | İlanlar | `listings` |
| `categories` | Kategoriler | `listings` |
| `customers` | Müşteriler | `customers` |
| `finance` | Finans | `finance` |
| `reports` | Raporlar | `reports` |
| `profile` | Ayarlar | `profile` |

### 1.4 Deep-link tipleri

```ts
type ListingsDeepLink = {
  view?: 'table' | 'map';
  filter?: 'Tümü' | 'Aktif' | 'Taslak' | 'Pasif';
  tag?: string;
  sort?: 'views';
};
type CustomersDeepLink = {
  filter?: 'Tümü' | 'Sıcak' | 'Ilık' | 'Soğuk';
  stage?: 'İlk temas' | 'Gezildi' | 'Teklif' | 'Kaparo';
};
type FinanceDeepLink = {
  status?: 'Görüşme' | 'Teklif' | 'Kaparo' | 'Tapu tamam';
};
type ReportsDeepLink = {
  tab?: 'Performans' | 'Satış' | 'Müşteri' | 'Bölge';
};
type ProfileDeepLink = {
  shortcut?: 'general' | 'team' | 'workshop' | 'integration' | 'security' | 'notifications';
};
type DeepLink =
  | ListingsDeepLink | CustomersDeepLink
  | FinanceDeepLink | ReportsDeepLink | ProfileDeepLink;
```

### 1.5 Deep-link consume mekanizması

İlgili page komponentleri opsiyonel `initial?: DeepLink` prop kabul eder. İlk `useState` çağrılarında bu prop'u default olarak kullanır.

```ts
// listings.tsx içinde örnek
const [view, setView] = useState<'table'|'map'>(initial?.view ?? 'table');
const [filter, setFilter] = useState<'Tümü'|ListingStatus>(initial?.filter ?? 'Tümü');
```

**Re-mount stratejisi:** Aynı modüle tekrar deep-link ile dönüldüğünde (örn. listings summary'den iki farklı karta art arda gitme) `activeDock` aynı kaldığı için page yeniden mount olmaz, dolayısıyla `useState` initial'ı yeniden okunmaz. Bunu önlemek için render branch'inde page komponentine `key={pageDeepLink ? JSON.stringify(pageDeepLink) : 'default'}` verilir; deep-link her değiştiğinde page yeniden mount olur.

```tsx
{activeDock === 'listings' && (
  <ListingsPage
    key={pageDeepLink ? JSON.stringify(pageDeepLink) : 'listings-default'}
    initial={pageDeepLink as ListingsDeepLink | null}
  />
)}
```

`pageDeepLink` consume edildikten sonra (page mount'unun bir sonraki tick'inde) `useEffect` ile `setPageDeepLink(null)` çağrılır — böylece bir sonraki "Hub'dan aynı modülü doğrudan aç" akışında stale değer kalmaz.

---

## 2. Bento layout

### 2.1 Grid

Tüm modüllerde aynı 4-slot template (tutarlılık + viewport-fit garanti):

```
┌──────────────────────────────┬───────────┐
│      A — Hero                │   B —     │
│      cols 1-8, rows 1-4      │   KPI     │
├──────────────┬───────────────┤   tall    │
│   C — Mini   │   D — Mini    │   cols    │
│   1-4, 5-6   │   5-8, 5-6    │   9-12    │
└──────────────┴───────────────┴───────────┘
```

### 2.2 CSS

```css
.summary-bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 12px;
  height: calc(100dvh - 220px);
  min-height: 460px;
}
.slot-hero      { grid-column: 1 / 9;  grid-row: 1 / 5; }
.slot-kpi-tall  { grid-column: 9 / 13; grid-row: 1 / 7; }
.slot-mini-a    { grid-column: 1 / 5;  grid-row: 5 / 7; }
.slot-mini-b    { grid-column: 5 / 9;  grid-row: 5 / 7; }

@media (max-width: 768px) {
  .summary-bento {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
    gap: 10px;
  }
}
@media (max-height: 460px) {
  .summary-bento { overflow-y: auto; }
}
```

### 2.3 Kart varyantları

| Tip | Slot | İçerik | Tasarım |
|---|---|---|---|
| **chart** | hero | bar/line + ay etiketleri | `MiniChart` / `RevenueLineChart` reuse |
| **list** | hero/mini | 4-5 satır, mono timestamp + serif title + sağ tag pill | `divide-y border-border/30` |
| **kpi** | kpi-tall | Büyük serif sayı + delta indicator | `font-serif text-7xl font-light tabular-nums` + `▲ % EMERALD MONO` |
| **distribution** | mini | label + value + percentage rows | mono labels, tabular-nums values |
| **shortcut** | mini | İkon + başlık + kısa açıklama | hover: slight tilt |

### 2.4 Görsel dil (her kart)

- `bg-background/30 backdrop-blur-md border-border/40 rounded-2xl`.
- Sol üst: `<span class="size-1.5 rounded-full bg-emerald-500/70" />` (active dot).
- Title: `font-serif text-xl font-light` + ikinci kelime `font-medium italic`.
- Sağ üst: hover'da `→` arrow opacity 0→1 (deep-link sinyali).
- Hover: `-translate-y-0.5` + border opacity artışı + cursor-pointer.

### 2.5 Header (PageShell adapte)

- Sol: `<h1 class="font-serif text-5xl font-light">` + alt mono meta.
- Sağ: yatay sırayla `[Sayfaya git →]  [ESC GERİ DÖN]` — sol pill secondary stil (`border-border/40 bg-background/30`, mono uppercase, daha az görsel ağırlık), sağ pill primary stil (resimdeki gibi `border-border/70 bg-background/40`). Aralarında `gap-2`.
- Header altı: `border-b border-border/40` separator.

---

## 3. Modül başına kart içerikleri

### 3.1 `listings` — İlanlar
**Header:** "Arsa *portföyü*" · `{counts.aktif} AKTİF İLAN · 8 YENİ BU HAFTA`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | chart | Görüntülenme akışı (son 30 gün line) | `{view:'table'}` |
| KPI | kpi | Aktif: `{counts.aktif}` · ▲ 8 YENİ BU HAFTA | `{filter:'Aktif'}` |
| Mini-A | distribution | Stok dağılımı · TİPE GÖRE (İmarlı/Villa/Tarla/Zeytinlik %) | `{view:'table'}` |
| Mini-B | list | Öne çıkan arsalar · SON 7 GÜN (3 satır en yüksek `views`) | `{view:'table', sort:'views'}` |

### 3.2 `categories` — Kategoriler (target: listings)
**Header:** "Kategori *atlası*" · `ARSA TİPİ · BÖLGE · ETİKET`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | chart | Bölgesel yoğunluk (bar: Ayvalık/Datça/Cunda/Söke/Alaçatı ilan sayısı) | `{view:'map'}` |
| KPI | kpi | Tip sayısı: `{4}` · İMARLI · TARLA · VİLLA · ZEYTİNLİK | `{view:'table'}` |
| Mini-A | list | Etiket bulutu (en popüler 5 distinct `tag`) | `{view:'table', tag:<top>}` |
| Mini-B | shortcut | Filtre setleri (2 önset) | `{view:'table', filter:'Taslak'}` |

### 3.3 `customers` — Müşteriler
**Header:** "Müşteri *defteri*" · `{counts.all} KAYITLI MÜŞTERİ · CRM ENTEGRE`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | chart | Yeni kayıt akışı · AYLIK · SON 12 AY (bar) | `{filter:'Tümü'}` |
| KPI | kpi | Kayıtlı: `{counts.all}` · ▲ N SON 30 GÜN | `{filter:'Tümü'}` |
| Mini-A | distribution | Aktif görüşmeler · AŞAMAYA GÖRE | `{stage:'İlk temas'}` |
| Mini-B | list | Sıcak müşteriler (3 satır segment=Sıcak) | `{filter:'Sıcak'}` |

### 3.4 `finance` — Finans
**Header:** "Finans & *Ciro*" · `SON 12 AY · OTOMATİK SENKRON`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | chart | Yıllık ciro · ₺ MİLYON · KDV HARİÇ (bar) | `{}` |
| KPI | kpi | Portföy · GÜNCEL DEĞER · `₺X.XM` · ▲ 12.4% GEÇEN YILA GÖRE | `{}` |
| Mini-A | distribution | Ödeme yöntemi · 12 AY (Havale-EFT/Nakit/Kredi/Takas %) | `{}` |
| Mini-B | list | Bekleyen ödemeler (3 satır status≠"Tapu tamam") | `{status:'Kaparo'}` |

### 3.5 `reports` — Raporlar
**Header:** "Rapor *atölyesi*" · `24 OTOMATİK RAPOR · 5 BUGÜN`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | list | Son üretilen raporlar · OTOMATİK · 7 GÜN (4 satır) | `{tab:'Performans'}` |
| KPI | kpi | Üretilen · TOPLAM · 30 GÜN · `{142}` · ▲ 24 YENİ BU HAFTA | `{tab:'Performans'}` |
| Mini-A | list | Otomasyon · AKTİF ZAMANLAYICI (3 satır) | `{tab:'Satış'}` |
| Mini-B | distribution | Rapor tipleri (Performans/Satış/Müşteri/Bölge sayım) | `{tab:'Müşteri'}` |

### 3.6 `profile` — Atölye Ayarları
**Header:** "Atölye *ayarları*" · `9 ENTEGRASYON · TÜMÜ SAĞLIKLI`

| Slot | Tip | İçerik | DL |
|---|---|---|---|
| Hero | list | Entegrasyonlar · BAĞLI SERVİSLER (5 satır + "canlı" pill) | `{shortcut:'integration'}` |
| KPI | kpi | Otomasyon · AKTİF KURAL · `{14}` · ▲ 3 YENİ BU AY | `{shortcut:'general'}` |
| Mini-A | distribution | Ekip · AKTİF KULLANICI (Yönetici 2 / Emlakçı 5 / Destek 3) | `{shortcut:'team'}` |
| Mini-B | shortcut | Güvenlik & oturumlar (3 cihaz · son 7 gün) | `{shortcut:'security'}` |

### 3.7 Veri kaynakları

- **Live (derived):** `useStore()` üzerinden `listings`, `customers`, `transactions`. Sayımlar (counts.aktif, counts.all vb.), öne çıkanlar (sort by views), sıcak müşteriler (filter by segment), bekleyen ödemeler (filter by status) memoize edilmiş selector'larla `summary-data.ts`'te tanımlanır.
- **Static (config):** Entegrasyon listesi, otomasyon zamanlayıcıları, etiket bulutu sample'ları, region listesi, KPI delta sayıları (örn. "▲ 12.4% GEÇEN YILA GÖRE", "▲ 24 YENİ BU HAFTA") — `summary-config.ts` içinde sabit. Mevcut sayfalarda da statik olarak görsellerden gelmektedir.

---

## 4. Animasyon & etkileşim

- ModuleSummary container: `initial={opacity:0, scale:0.96}`, `animate={opacity:1, scale:1}`, `transition={{duration:0.35, ease:[0.22,1,0.36,1]}}`.
- Cards: stagger fade-up (`y:12 → 0`), 60ms aralıklı.
- Card hover: `whileHover={{y:-2}}` + arrow opacity 0→1.
- Card click: hızlı scale 0.98 → page swap.
- Exit: container fade-out 200ms; `setActiveDock` exit'ten sonra çağrılır.
- Animasyon sırasında container `pointer-events: none` (race koşulu önlemi).

---

## 5. Erişilebilirlik

- ModuleSummary `<section role="region" aria-label={`${entry.title} özeti`}>`.
- ESC pill `<button aria-label="Geri dön (ESC)">`.
- "Sayfaya git" `<button aria-label={`${target} sayfasına git`}>`.
- Kartlar `<button>` (semantic), `aria-describedby` ile meta okunur.
- Mount sonrası ilk kart autofocus.
- `prefers-reduced-motion` framer-motion default desteği yeterli; özel tweak yok.

---

## 6. Edge case'ler

- **Boş veri**: derived array'ler boşsa kart "—" placeholder gösterir, deep-link aktif kalır.
- **Mobile (<768px)**: bento → tek sütun stack; viewport-fit garantisi kalkar; dikey scroll'a izin verilir; header `font-serif text-3xl`.
- **Çok düşük viewport (<460px height)**: container `overflow-y-auto` fallback.
- **Hub'a dön → tekrar aynı modülü seç**: `pageDeepLink` her summary açılışında null'a reset.
- **Race koşulu (animasyon sırasında çift tıklama)**: container `pointer-events: none` aktif animasyon süresince.
- **Page deep-link consume**: page mount sonrası `useEffect` ile `setPageDeepLink(null)`.

---

## 7. Test planı

- **Vitest unit (`summary-config.test.ts`):** Her entry tam 4 kartlı, target geçerli, deep-link şema uyumlu.
- **Vitest komponent (`module-summary.test.tsx`):** Mount → 4 kart render. Card click → `onCardClick(deeplink)` doğru argümanla çağrılır. ESC → `onClose` çağrılır.
- **Manual smoke:** 6 entry × 4 kart click + ESC + "Sayfaya git" akışları. Dark/light tema. Mobile (<768px) stack davranışı.

---

## 8. Yeni / değişen dosyalar

**Yeni:**
```
src/components/ui/module-summary/
├── module-summary.tsx       (ana component, header + grid orkestratör)
├── bento-card.tsx           (kart wrapper + 5 tip variant)
├── summary-config.ts        (6 entry × 4 kart konfigürasyonu)
├── summary-data.ts          (useStore'dan derived selectors)
└── types.ts                 (SummaryEntryId, SummaryCard, DeepLink union)
```

**Değişen:**
- `src/components/ui/infinite-grid-integration.tsx`: `activeSummary` + `pageDeepLink` state, render branch.
- `src/components/ui/assistant/assistant-modules-screen.tsx`: target → entryId, MODULES sabit listesi yeniden tiplensin.
- `src/components/ui/assistant/assistant-modal.tsx`: `onPickModule(entryId)` signature.
- `src/components/pages/listings.tsx`: opsiyonel `initial?: ListingsDeepLink` prop, `useState` initial'larında consume.
- `src/components/pages/customers.tsx`: opsiyonel `initial?: CustomersDeepLink` prop.
- `src/components/pages/finance.tsx`: opsiyonel `initial?: FinanceDeepLink` prop.
- `src/components/pages/reports.tsx`: opsiyonel `initial?: ReportsDeepLink` prop, tab state initial.
- `src/components/pages/profile.tsx`: opsiyonel `initial?: ProfileDeepLink` prop, mount'ta `shortcut` set edilirse ilgili modal'a scroll/focus.

---

## 9. Açık sorular (faz 2 için)

- Card içi sub-row interaction (örn. Müşteriler "Aktif görüşmeler" satırına direkt tık).
- "Filtre setleri" backend persistence.
- Entry başına farklı bento layout opsiyonu (şimdilik tek template).
- Per-card analytics tracking event'leri.
- 1-4 numerik shortcut'larla kart seçimi.
