# AI Chat Asistanı — Tasarım Dokümanı

**Tarih:** 2026-04-27
**Konu:** Komut paleti modalındaki "Yapay zekâ önerileri" ekranını gerçek bir sohbet (chat) deneyimine dönüştürmek; lokal kural-tabanlı bir niyet motoruyla store verisinden cevap üretmek.

## 1. Hedef ve Kapsam

Mevcut modal (`src/components/ui/infinite-grid-integration.tsx:606-846`) iki modlu çalışıyor:

- `modules`: "Nereye gidelim?" başlığı + 6 modül kartı.
- `suggestions`: "Ne bulmama yardım edeyim?" başlığı + 6 sabit AI öneri kartı + büyük textarea + chip'ler. Form gönderimi şu an hiçbir şey yapmıyor.

Bu doküman şunu önerir:

- `suggestions` modu **tamamen kaldırılır** (sabit öneri kartları ve onların layout'u dahil).
- Yerine yeni bir `chat` modu eklenir. Modal açıldığında varsayılan `modules` ekranı gelir; alt input'a focus/click olunca `chat` ekranı açılır.
- Chat ekranı sol kenar çubuğunda kalıcı sohbet geçmişi listesi, ana alanda mesaj akışı ve composer barındırır.
- Cevaplar lokal bir kural-tabanlı niyet motoru tarafından, store verisinden (`listings`, `customers`, `transactions`, `events`, `conversations`) üretilir; düz metin yanı sıra kart ve grafik blokları içerir.
- Sohbet geçmişi `localStorage` üzerinden kalıcı tutulur.

Kapsam dışı: gerçek LLM çağrısı, sunucu tarafı, çok dilli destek, sesli giriş.

## 2. Modal Akışı

| Aksiyon | Sonuç |
|---|---|
| Modal aç (`⌘K` veya AI butonu) | `modules` ekranı görünür. |
| Modules ekranındaki bir modül kartına tıkla | İlgili dock sayfasına gider, modal kapanır. |
| Modules ekranının alt input'una focus/click | `chat` ekranına geçer. Mevcut sohbet (varsa son aktif session) yüklenir, yoksa yeni session başlatılır. Composer odağa alınır, varsa input'a yazılan ön metin composer'a taşınır. |
| Chat ekranındaki "← Modüller" butonu | `modules` ekranına döner. Aktif session korunur. |
| Sidebar'da bir sohbete tıkla | O session aktif olur, mesajlar yüklenir. |
| Sidebar'da "+ Yeni sohbet" | Yeni boş session açılır ve aktif olur. |
| Sidebar'da bir sohbet üzerine hover → × | Onay diyalogu olmadan o session silinir. |
| Composer'a yaz, Enter (Shift+Enter satır) veya gönder butonu | Kullanıcı mesajı eklenir, niyet motoru çalışır, asistan mesajı eklenir. |
| ESC | Modal kapanır. Aktif session id korunur, modal tekrar açılınca chat moduna geri dönülürse aynı session yüklenir. |

## 3. Modal Layout

Modal genişliği `min(960px, calc(100% - 2rem))` → `min(1080px, calc(100% - 2rem))`. Yükseklik mevcut `min(640px, calc(100% - 3rem))` korunur.

```
┌─────────────────────────────────────────────────────────┐
│ [← Modüller]   Atölye Asistanı           [× Kapat]      │  header (chat modunda)
├──────────────┬──────────────────────────────────────────┤
│ + Yeni sohbet│                                          │
│              │   [Karşılama mesajı + 4 chip]            │
│ BUGÜN        │                                          │
│ • Çanakkale… │   [Kullanıcı: sağda kompakt]             │
│ • Kaparolar  │                                          │
│ DÜN          │   [Asistan: solda, kart/grafik blokları] │
│ • Mehmet'e…  │                                          │
│              │                                          │
│ ÖNCEKİ       │                                          │
│ • Bu hafta…  │                                          │
│              ├──────────────────────────────────────────┤
│              │ [✦] [Bana sor…              ] [⌘↵] [→]   │  composer
└──────────────┴──────────────────────────────────────────┘
   220px               ana alan
```

Modules ekranı layout'u şu anki haliyle korunur, sadece "suggestions" mod'u ve form'un mevcut iki branch'i temizlenir (büyük textarea + öneri kartları). Modules input'u tetikleyici input olarak kalır.

## 4. Niyet Motoru

### 4.1 Akış

```
metin → normalize → (paralel) {extractors} → score(intents) → handler(params, store) → AssistantResponse
```

`engine.classify(text, store)` saf fonksiyon, her zaman bir `AssistantResponse` döner.

### 4.2 Niyet Kategorileri

| Niyet | Tetikleyici örnek | Çıkarılan parametreler | Cevap blokları |
|---|---|---|---|
| `listing.search` | "Çanakkale'de deniz manzaralı 2M altı arsa" | loc, tags, priceMin/Max, areaMin/Max, status | text + listings + suggest |
| `customer.search` | "sıcak müşterilerim", "Ayvalık ile ilgilenenler" | segment, stage, interestKeyword | text + customers + suggest |
| `transaction.summary` | "bu ayki kaparolar", "toplam ciro" | status, aggregate | text + stat + transactions + (chart: mini) |
| `event.list` | "bu hafta randevular", "Cuma ne var" | day, type | text + events |
| `match.find` | "ARS-0142'ye uygun müşteri", "Mehmet'e uygun arsa" | pivot ('listing'\|'customer'), id | text + listings veya customers + suggest |
| `count.stats` | "kaç aktif ilan var", "okunmamış mesaj sayısı" | entity, filter | text + stat + (chart: mini opsiyonel) |
| `greeting` | "selam", "ne yapabilirsin" | — | text + suggest (yetenek chip'leri) |
| `unknown` | eşleşmesiz | — | text (yumuşak fallback) + suggest |

### 4.3 Parametre Çıkarıcıları

`src/lib/assistant/extractors.ts` içinde saf fonksiyonlar:

- `extractLocation(text)`: store içeriğinden derlenmiş lokasyon kelime havuzunu (Çanakkale, Ayvalık, Datça, Bodrum, Alaçatı, Marmaris, Söke, Ayvacık, Cunda) tarar; ilk eşleşmeyi döner.
- `extractPriceRange(text)`: `"2M"`, `"2 milyon"`, `"₺1.5M"`, `"800K"`, `"1-2M arası"` gibi kalıpları yakalayan regex grubu. Modifierlar: "altı/altında" → `priceMax`, "üstü/üstünde" → `priceMin`. Aralık ifadesi → ikisi.
- `extractAreaRange(text)`: `"1000m²"`, `"5 dönüm"` (=5000 m²), `"2.000 m²"` kalıpları. Modifierlar `priceRange` ile aynı.
- `extractTags(text)`: tag set'i (Deniz manzaralı, Koy önü, Zeytinlik, Yola cephe, Merkez, Villa imarlı) ve sinonim haritası (`"deniz manzarası" → "Deniz manzaralı"`, `"villa imarı" → "Villa imarlı"`).
- `extractSegment(text)` / `extractStage(text)`: kelime havuzları.
- `extractDay(text)`: kısa (`Pzt..Paz`) ve uzun (`pazartesi..pazar`) gün isimleri + `bugün`/`yarın`/`bu hafta`.
- `extractIds(text)`: `ARS-\d{3,4}`, `CUS-\d{3}`, `TX-\d{4}` regex'leri + isim eşlemesi (store.customers içinden, `mehmet → CUS-001`).

Hepsi saf, kolay test edilir.

### 4.4 Sınıflandırma

Her niyetin tetikleyici kelime listesi vardır (`listing.search`: ["arsa", "ilan", "satılık", "öner", "bul", "göster"]; `transaction.summary`: ["ciro", "kaparo", "tapu", "satış", "ödeme"]; vb.). `score(text)` her niyetin kelimeleriyle ham frekans skorunu üretir. Ek olarak çıkarılan parametre tipleri skoru artırır: bir ID görüldüyse `match.find`, bir gün görüldüyse `event.list` skorlarına +2 bonus eklenir. En yüksek skor < 1 ise `unknown` döner. Eşitlikte deterministik öncelik sırası: `match.find > transaction.summary > event.list > listing.search > customer.search > count.stats > greeting > unknown`.

### 4.5 Cevap Şeması

```ts
type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'listings'; ids: string[] }
  | { kind: 'customers'; ids: string[] }
  | { kind: 'transactions'; ids: string[] }
  | { kind: 'events'; ids: string[] }
  | { kind: 'stat'; label: string; value: string; delta?: string }
  | { kind: 'chart'; chart: 'mini' | 'line' | 'funnel'; data: ChartData; caption?: string }
  | { kind: 'suggest'; chips: string[] };

interface AssistantResponse {
  intent: string;
  text: string;       // baş açıklama satırı
  blocks: AssistantBlock[];
}
```

Liste blokları **id taşır**, store değişiminde geçmiş bozulmaz; render zamanı kayıp id'ler "kayıp kayıt" stub'ı ile gösterilir.

### 4.6 "Düşünme" Gecikmesi

Asistan mesajı eklenmeden önce composer'a düşen 350-700 ms arası rastgele süre boyunca thread sonunda "yazıyor…" üç-nokta animasyonu gösterilir. Bu, gerçek hesaplama anlık olduğu halde sohbete doğal bir ritim verir.

## 5. Render Katmanı

Yeni klasör: `src/components/ui/assistant/`.

| Dosya | Görev |
|---|---|
| `assistant-modal.tsx` | Mod yönetimi (`'modules' \| 'chat'`), modal kabuğu, header dinamiği. Mevcut modal blok'tan ayrıştırılır. |
| `assistant-modules-screen.tsx` | Mevcut modules ekran içeriği taşınır. |
| `assistant-chat-screen.tsx` | Sidebar + thread + composer kompozisyonu. |
| `chat-sidebar.tsx` | Yeni sohbet, gruplu liste (Bugün/Dün/Önceki), seçili durumu, hover-sil. |
| `chat-thread.tsx` | Mesaj listesi, scroll-to-bottom, typing indicator. `role="log" aria-live="polite"`. |
| `chat-message.tsx` | User: sağda, taş tonlu kompakt baloncuk. Assistant: solda, header'sız geniş alan, içine block render. |
| `chat-composer.tsx` | Auto-grow textarea (1→5 satır), Enter gönder / Shift+Enter satır, gönder butonu, ⌘↵ kbd. |
| `assistant-blocks/text-block.tsx` | Düz metin paragrafı. |
| `assistant-blocks/listings-block.tsx` | Listing kartları (id, lokasyon, alan, fiyat, etiket, status); kart tıklanınca `setActiveDock('listings')`. |
| `assistant-blocks/customers-block.tsx` | Müşteri kartları (ad, ilgi, bütçe, segment, stage); tıklanınca `setActiveDock('customers')`. |
| `assistant-blocks/transactions-block.tsx` | İşlem satırları (id, müşteri, ilan, tutar, tarih, status). |
| `assistant-blocks/events-block.tsx` | Gün+saat+başlık+lokasyon. |
| `assistant-blocks/stat-block.tsx` | Büyük rakam + label + opsiyonel delta. |
| `assistant-blocks/chart-block.tsx` | `chart` alanına göre `MiniChart` / `RevenueLineChart` / `FunnelChart` sarmalar. |
| `assistant-blocks/suggest-block.tsx` | Chip'ler; tıklanınca composer'ı doldurmadan doğrudan gönderir. |

Stil mevcut paterni izler: monospace başlıklar, `border-border/60`, `bg-background/40`, taş renk paleti, `backdrop-blur-md`. Yeni token / global stil eklenmez.

## 6. Store Değişiklikleri

`src/lib/store.tsx` içine eklenir:

```ts
export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks?: AssistantBlock[];
  intent?: string;
  createdAt: string;        // ISO
}

export interface AssistantSession {
  id: string;
  title: string;             // ilk user mesajından türetilir, max 40 karakter
  createdAt: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
}

interface StoreState {
  // ... mevcut alanlar
  assistantSessions: AssistantSession[];
  activeAssistantSessionId: string | null;
}

interface StoreActions {
  // ... mevcut aksiyonlar
  startAssistantSession: () => string;
  setActiveAssistantSession: (id: string) => void;
  appendAssistantMessage: (sessionId: string, msg: Omit<AssistantChatMessage, 'id' | 'createdAt'>) => void;
  renameAssistantSession: (id: string, title: string) => void;
  deleteAssistantSession: (id: string) => void;
  clearAssistantSessions: () => void;
}
```

`STORAGE_KEY`: `"atelier-store-v2"` → `"atelier-store-v3"`. Migrasyon: yeni anahtar boşsa eski anahtar denenir, parse edilip yeni alanlara default boş diziler eklenip yazılır; eski anahtar silinmez (kullanıcı geri dönerse veri kalsın).

## 7. Karşılama, Boş Sonuç, Hata Hâlleri

- **Karşılama** (yeni session, mesaj yok): Asistan rolünde tek mesaj. Metin: `Merhaba ${profile.name.split(' ')[0]}, ne arıyoruz?`. Bloklar: `suggest` chip'leri (`Çanakkale deniz manzaralı arsa`, `Bu hafta randevular`, `Sıcak müşterilerim`, `Bu ayki kaparolar`).
- **Boş sonuç** (filtre eşleşmedi): "Bu kriterlere uyan kayıt yok." + alternatif chip'ler (kriterleri gevşeten varyantlar).
- **Hata yok**: Tüm akış lokal; engine her zaman geçerli bir response döner. Try/catch / fallback'lara gerek yok.

## 8. Erişilebilirlik

- Modal mevcut `role="dialog" aria-modal="true"` korunur; başlık değişiminde `aria-label` `Atölye Modülleri` ↔ `Atölye Asistanı`.
- Thread `role="log" aria-live="polite"`; yeni mesajlar otomatik okutulur.
- Sidebar `<nav aria-label="Sohbet geçmişi">`.
- Composer textarea'sının `aria-label`'ı "Asistan'a sor".
- Klavye: Tab ile sidebar → thread → composer dolaşılır. Sidebar maddesinde Enter session açar, Delete tuşu siler.

## 9. Kapsam Dışı / Yapılmayacaklar

- Gerçek LLM çağrısı.
- Sohbeti dışa aktarma, paylaşma, arama (geçmiş içinde grep).
- Çoklu dil. Sadece Türkçe.
- `search.tsx:99` üzerindeki ayrı arama input'u — farklı sayfa, dokunulmaz.
- Sesli giriş, dosya yükleme.

## 10. Test Stratejisi (Kabul Kriterleri)

- `extractors.ts`: Her bir extractor için en az 4 birim testi (pozitif + sınır + negatif + ikinci dilbilim). Saf fonksiyonlar olduğu için Vitest ile direkt çağrılır.
- `engine.test.ts`: Senaryolar — temsili bir cümle her niyet için doğru `intent`'i ve beklenen blok şemasını üretir. Karışık ifadelerde deterministik öncelik sırası test edilir.
- Manuel UI kabul:
  1. Modal aç → modules ekranı.
  2. Input'a tıkla → chat ekranı, karşılama mesajı + 4 chip.
  3. "Çanakkale'de deniz manzaralı arsa öner" yaz → en az 1 listing kartı + suggest chip'leri.
  4. "bu ayki kaparolar" → stat blokları + işlem listesi + mini chart.
  5. "Cuma ne var" → events listesi.
  6. "ARS-0142'ye uygun müşteri" → en az 1 customer kartı.
  7. Modalı kapat, yeniden aç, input'a tıkla → aynı session yüklü, mesajlar duruyor.
  8. Yeni sohbet aç, mesaj at, sidebar'da iki entry görünüyor; eskiye tıkla → eski mesajlar geliyor.
  9. Sayfayı yenile → sidebar ve mesajlar kalıcı.
  10. Hover ile bir session sil → kayboldu, aktif session boşsa karşılama gelir.

## 11. Dosya İndeksi

Yeni:
- `src/lib/assistant/types.ts`
- `src/lib/assistant/normalize.ts`
- `src/lib/assistant/extractors.ts`
- `src/lib/assistant/intents.ts`
- `src/lib/assistant/engine.ts`
- `src/lib/assistant/replies.ts`
- `src/components/ui/assistant/assistant-modal.tsx`
- `src/components/ui/assistant/assistant-modules-screen.tsx`
- `src/components/ui/assistant/assistant-chat-screen.tsx`
- `src/components/ui/assistant/chat-sidebar.tsx`
- `src/components/ui/assistant/chat-thread.tsx`
- `src/components/ui/assistant/chat-message.tsx`
- `src/components/ui/assistant/chat-composer.tsx`
- `src/components/ui/assistant/assistant-blocks/{text,listings,customers,transactions,events,stat,chart,suggest}-block.tsx`

Değişen:
- `src/lib/store.tsx` — yeni state/aksiyon, STORAGE_KEY bump + migrasyon.
- `src/components/ui/infinite-grid-integration.tsx` — modal blok'u `<AssistantModal />` ile değiştirilir; `assistantMode='suggestions'` ve ona ait state/dizi/render kaldırılır; `assistantSuggestions` ve `assistantChips` (chat-tarafına 4 karşılama chip'i kalır) kaldırılır.

Toplam yeni dosya: ~17. Değişen: 2. `infinite-grid-integration.tsx` 902 satırdan ~600 satıra iner; modal mantığı kendi modülüne taşındığı için okunabilirlik artar.
