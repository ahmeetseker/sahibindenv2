# Sayfa Geçiş Donmasının Çözümü: Atom İzolasyonu + Skeleton Sistemi

**Tarih:** 2026-04-28
**Durum:** Tasarım — kullanıcı onayı bekleniyor
**İlgili dosyalar:** `src/components/ui/infinite-grid-integration.tsx`, `src/components/pages/*`, `src/components/ui/dashboard-home.tsx`

## 1. Problem

Header dock'tan sayfa değiştirildiğinde belirgin bir donma/takılma yaşanıyor ve içerik yüklenirken componentler yer değiştiriyor.

### Kök neden analizi

`InfiniteGrid` parent component'i hem yıldırım/elektron animasyon state'ini (`electronPositions`, `atomBolts`) hem de **9 sayfanın koşullu render'ını** içeriyor.

`infinite-grid-integration.tsx:223,239` her `requestAnimationFrame` tick'inde React `setState` çağırıyor:

- `setElectronPositions` → ~60 kez/saniye
- `setAtomBolts` → ~14 kez/saniye (70ms throttle)

React kuralı gereği parent'taki her setState **tüm çocuk ağacın reconcile edilmesine** yol açar. Aktif sayfa (örn. `ListingsPage` 542 satır) parent'ın çocuğu olduğundan, sayfa içeriği sürekli reconcile ediliyor — DOM değişmese bile React tüm tree'yi geziyor. Bu, sayfa geçişi sırasında ana thread'i tıkıyor.

### İkincil faktörler

- **Mount maliyeti:** Yeni sayfa mount olduğunda `useMemo` (filter/sort), `framer-motion` `initial→animate` animasyonları, recharts/leaflet init aynı anda çalışıyor.
- **Layout shift:** İçerik mount sürecinde adım adım yerleşiyor — kullanıcı bunu "componentler yerinden oynuyor" olarak hissediyor.

### Sorun OLMAYAN şeyler

- `gridOffsetX`/`gridOffsetY` → `useMotionValue` (React re-render yapmaz, sadece DOM style günceller).
- `setNow` (saat) → 30 saniye aralıklı, etkisiz.

## 2. Hedef

1. Sayfa değişimlerinde donma hissinin ortadan kalkması.
2. İçerik gelmeden önce yer tutucu skeleton'lar görünmesi → layout shift sıfır.
3. Genel sayfa geçiş akışının pürüzsüz olması.

## 3. Tasarım

İki bağımsız katman:

### Katman 1 — Atom Button izolasyonu

**Amaç:** Yıldırım animasyon state'ini sayfaları içeren parent'tan ayırarak gereksiz reconcile'ı yok etmek.

**Nasıl:**
- `src/components/ui/atom-button.tsx` adında yeni bir component oluştur.
- `InfiniteGrid`'deki şu state ve effect'ler bu component'e taşınır:
  - `electronPositions`, `atomBolts`, `atomHover` state'leri
  - `atomHoverRef`
  - `requestAnimationFrame` döngüsünü içeren `useEffect`
  - SVG render bloğu (atom + bolt path'leri + filter tanımları)
  - `generateBoltPath`, `generateJaggedEllipsePath`, `midpointDisplace`, `pointsToPath` yardımcı fonksiyonları (atom'a özgü olduğu için bu modüle taşınır)
  - `Vec2` tipi (atom'a özgü, ortak değil)
- `AtomButton` props arayüzü:
  ```ts
  interface AtomButtonProps {
    onClick: () => void;
  }
  ```
- `InfiniteGrid` içinde tek satır kullanım:
  ```tsx
  <AtomButton onClick={() => setAssistantOpen(true)} />
  ```

**Sonuç:** Yıldırım her frame setState çağırsa bile sadece `AtomButton` re-render edilir. Sayfaları içeren parent etkilenmez.

**Beklenen kazanım:** Donmanın %70-80'i (yıldırım kaynaklı kısmı) bu tek değişiklikle çözülür.

### Katman 2 — Skeleton Sistemi (Karma yaklaşım)

**Amaç:** Sayfa mount maliyetini ve framer-motion animasyon birikimini kullanıcıdan saklamak; içerik gelene kadar yer tutmak.

#### 2.1 Ortak `PageSkeletonShell`

Tüm sayfalar `PageShell` kullandığı için header iskeleti tek bir ortak component:

```
src/components/pages/skeletons/page-skeleton-shell.tsx
```

İskelet yapısı:
- `PageShell` ile aynı dış container (`mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32`).
- Header'da: eyebrow için 80px genişliğinde gri çizgi, başlık için 320px × 48px gri blok, açıklama için 480px × 14px gri çizgi.
- Tailwind `animate-pulse` kullanılır (framer-motion DEĞİL — ek render yükü olmasın).

```tsx
interface PageSkeletonShellProps {
  children?: ReactNode;
  showActions?: boolean;
}
```

`children` slot'una sayfa-spesifik content skeleton geçirilir.

#### 2.2 Sayfa-spesifik content skeletonları

Her sayfa için ayrı bir skeleton component'i. Hepsi `src/components/pages/skeletons/` altında.

| Sayfa | Skeleton dosyası | İçerik (yaklaşık) |
|---|---|---|
| Overview | `dashboard-home-skeleton.tsx` | 4 stat kartı + 2 chart kutusu + dock kısayol grid |
| Listings | `listings-skeleton.tsx` | Filtre bar + 8 satırlı tablo iskeleti + AI suggestion 3 kart |
| Customers | `customers-skeleton.tsx` | Filtre bar + 8 satırlı tablo iskeleti |
| Finance | `finance-skeleton.tsx` | 3 KPI kartı + 1 büyük chart kutusu + tablo |
| Reports | `reports-skeleton.tsx` | 4 chart kutusu (mini) |
| Calendar | `calendar-skeleton.tsx` | 7×6 grid kutuları |
| Messages | `messages-skeleton.tsx` | Sol liste (8 öğe) + sağ konuşma alanı placeholder |
| Search | `search-skeleton.tsx` | Arama bar + 6 sonuç kartı |
| Profile | `profile-skeleton.tsx` | Profil header + 4 ayar bölümü kartı |

Her skeleton component'i:
- Yalnızca div + tailwind kullanır (motion yok).
- `animate-pulse` ile soluk-belirgin geçiş.
- Gri renk tokenları: `bg-foreground/[0.06]` (light) ve dark mode otomatik (Tailwind `bg-foreground` zaten temaya göre değişir).

#### 2.3 Geçiş mekanizması

`InfiniteGrid` içindeki render bloğu şu şekilde değişir:

```tsx
const [pageReady, setPageReady] = useState<Record<string, boolean>>({
  overview: true, // ilk açılış sayfası için skeleton göstermeye gerek yok
});

useEffect(() => {
  if (pageReady[activeDock]) return;
  let id2 = 0;
  const id1 = requestAnimationFrame(() => {
    id2 = requestAnimationFrame(() => {
      setPageReady((p) => ({ ...p, [activeDock]: true }));
    });
  });
  return () => {
    cancelAnimationFrame(id1);
    cancelAnimationFrame(id2);
  };
}, [activeDock, pageReady]);

// Render
const isReady = pageReady[activeDock];

{!isReady && <PageSkeletonForRoute route={activeDock} />}
{isReady && <PageForRoute route={activeDock} />}
```

`PageSkeletonForRoute` ve `PageForRoute` switch-case ile sayfa key'ine göre doğru component'i seçer.

**Frame akışı (somut):**

1. **Frame 0:** `setActiveDock('listings')` → `pageReady['listings']` `false` → skeleton render edilir, paint olur.
2. **Frame 1 (ilk rAF):** Skeleton ekranda. `useEffect` çalıştı, ikinci rAF kuyruğa girdi.
3. **Frame 2 (ikinci rAF):** `setPageReady` çağrılır. Bu, gerçek `<ListingsPage />` mount'unu tetikler. Mount maliyeti (useMemo, framer-motion init) burada ödenir — ekrandaki skeleton görüntüsü kullanıcıyı oyalar.
4. **Frame 3+:** Mount tamamlanır, gerçek sayfa paint olur. `framer-motion` `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}` ile skeleton üzerine fade-in. Conditional render gereği skeleton DOM'dan çıkarılır (zaten gerçek sayfa onun üzerine yazıldığı için flicker yok).

İki rAF hile değil, kritik: tek rAF'da skeleton ile setState'i aynı browser çerçevesine sıkıştırırsak skeleton paint olmadan setState batch'leniyor olabilir; iki rAF ile skeleton'un kesinlikle paint olduğu garanti edilir.

**Cache mantığı:** Bir sayfa bir kez "ready" olduktan sonra `pageReady[key] = true` olarak kalır. Aynı sayfaya tekrar gidildiğinde skeleton gösterilmez. **Not:** Koşullu render gereği sayfa unmount oldukça içerik state'i kaybolur ve tekrar mount edildiğinde aslında baştan render olur. Ancak ikinci kez mount'un performansı kullanıcı için ilk kezden farklı değildir — buradaki "cache" yalnızca skeleton göstermeme kararıdır, içeriği saklamaz. Bu kabul ediliyor çünkü asıl darboğaz parent re-render'ı (atom izolasyonu çözüyor) ve ilk mount UX'i (skeleton çözüyor); ikinci mount zaten kullanıcı için "tıklama → görüntü" döngüsü olarak akıcı algılanır.

**Alternatif düşünüldü ve reddedildi:** Her sayfa değişiminde sıfırdan skeleton göstermek. Reddedildi çünkü cache'lenmiş bir sayfaya dönüşte bile skeleton göstermek "yapay yavaşlatma" hissi verir.

**Hızlı tıklama davranışı:** Kullanıcı skeleton görünürken başka bir dock ikonuna tıklarsa `useEffect` dependency'si `activeDock` değiştiği için cleanup çalışır, eski rAF'lar iptal edilir, yeni sayfa için yeni skeleton + rAF zinciri başlar. Yarış durumu yok.

#### 2.4 Layout uyumu kuralı

Skeleton ile gerçek sayfa **aynı dış container'ı** kullanmalı (`PageShell` veya manuel olarak aynı padding/max-width). Aksi halde geçiş anında kayma olur. Bu yüzden tüm content skeleton'ları `PageSkeletonShell` içinde render edilir (PageShell ile birebir hizalı).

## 4. Mimari özet

```
InfiniteGrid (parent)
├── Header / Dock
├── <AtomButton />  ← İZOLE: kendi state'i, kendi rAF'ı
├── <AssistantModal />
├── pageReady state (sayfa cache)
└── Page slot
    ├── isReady ? <ListingsPage /> : <ListingsSkeleton />
    ├── isReady ? <DashboardHome /> : <DashboardHomeSkeleton />
    └── ... (9 sayfa)

src/components/ui/atom-button.tsx          [YENİ]
src/components/pages/skeletons/
  page-skeleton-shell.tsx                  [YENİ]
  dashboard-home-skeleton.tsx              [YENİ]
  listings-skeleton.tsx                    [YENİ]
  customers-skeleton.tsx                   [YENİ]
  finance-skeleton.tsx                     [YENİ]
  reports-skeleton.tsx                     [YENİ]
  calendar-skeleton.tsx                    [YENİ]
  messages-skeleton.tsx                    [YENİ]
  search-skeleton.tsx                      [YENİ]
  profile-skeleton.tsx                     [YENİ]
```

## 5. Veri akışı

1. Kullanıcı dock'ta bir ikona tıklar → `setActiveDock('listings')`.
2. `InfiniteGrid` yeniden render olur. `pageReady['listings']` `false` olduğundan `<ListingsSkeleton />` boyar (tek frame, ucuz).
3. `useEffect` çalışır → iki rAF sonra `pageReady['listings'] = true`.
4. Sayfa yeniden render olur, bu sefer gerçek `<ListingsPage />` mount edilir.
5. `framer-motion` `opacity: 0 → 1` (150ms) ile içerik skeleton üzerine fade-in olur.
6. Skeleton conditional render ile DOM'dan kaldırılır.

## 6. Hata durumları

- **`pageReady` cache'i bozulursa:** `pageReady` sadece in-memory state, kalıcı değil. Sayfa refresh'inde sıfırlanır — bu kabul edilebilir.
- **`activeDock` bilinmeyen bir değer alırsa:** Mevcut kodda zaten 9 sabit key var, switch'te `default` durumunda hiçbir şey render etmemek (mevcut davranış). Skeleton switch'i de aynı `default: null` mantığını izler.
- **Kullanıcı çok hızlı tıklarsa (skeleton'lar arasında geçiş):** rAF callback'leri eskiyse `pageReady` yanlış key için set edilmez çünkü closure'da güncel `activeDock` yakalanır. `useEffect` dependency'sine `activeDock` eklenir, eski effect cleanup edilir.

## 7. Performans beklentileri

| Metrik | Önce | Sonra |
|---|---|---|
| Sayfa geçişinde "donma" hissi | Belirgin | Hissedilmez |
| Yıldırım animasyonu sayfa render tetikler mi? | Evet (60+/sn) | Hayır |
| Layout shift sayfa mount'ta | Var (içerik adım adım yerleşir) | Yok (skeleton aynı yeri tutar) |
| İlk paint süresi (perceived) | Mount tamamlanması | İlk frame'de skeleton |

## 8. Test stratejisi

- **Manuel UX testi:** Her sayfa arasında 2'şer kez geçiş yap; donma var mı, layout shift var mı, skeleton görünüyor mu?
- **DevTools Performance:** Sayfa geçişinde ana thread bloklarını ölçmek için recording al; "Long Task" sayısının azaldığını doğrula.
- **React DevTools Profiler:** Atom izolasyonu sonrası `InfiniteGrid` re-render sayısının saniyede 60'tan ~0'a düştüğünü doğrula.
- **Vitest:** Skeleton component'leri için snapshot test (her biri için 1 snapshot, basit). `pageReady` state geçiş mantığı için unit test (mock useEffect ile 2 rAF sonra ready olduğunu doğrula).

## 9. Kapsam dışı

- Sayfaları gerçekten lazy-load etmek (`React.lazy` + dynamic import). Şimdiki sorun mount maliyeti değil parent re-render. İleride bundle boyutu büyürse ayrı bir spec açılabilir.
- `generateBoltPath` random hesaplamasını web worker'a taşımak. Atom izolasyonu zaten yeterli kazancı sağlar.
- Skeleton'lara shimmer (kayan ışık) animasyonu eklemek. `animate-pulse` yeterli, shimmer ek CSS keyframe maliyeti getirir.
- Sayfaları memoize etmek (`React.memo`). Atom izole edildikten sonra parent'ın re-render frekansı zaten düşük; memo gereksiz karmaşıklık.

## 10. Açık olmayan tek nokta

Yok. Tasarım `activeDock` state mekanizmasını koruyor (router yok, mevcut yapıyla uyumlu).
