# AI Chat Asistanı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Komut paleti modalındaki AI öneri ekranını gerçek bir sohbet deneyimine çevir; lokal kural-tabanlı bir niyet motoruyla store verisinden cevap üret; sohbet geçmişini kalıcı tut.

**Architecture:** `src/lib/assistant/` altında saf TS modüller (types, normalize, extractors, intents, engine, replies); `src/components/ui/assistant/` altında modal kabuğu + chat ekranı + 8 cevap bloğu. Store'a `assistantSessions`/`activeAssistantSessionId` eklenir, STORAGE_KEY v2→v3 migrasyonlu. Mevcut `infinite-grid-integration.tsx` modalı dışarı taşınır, `suggestions` modu silinir.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, framer-motion, lucide-react, Recharts (mevcut grafikler için), Vitest (kurulacak).

**Spec:** `docs/superpowers/specs/2026-04-27-ai-chat-asistan-design.md`

---

## File Structure

**Yeni:**

```
src/lib/assistant/
  types.ts              # AssistantBlock, AssistantResponse, ChatMessage, ChatSession
  normalize.ts          # Türkçe metin normalizasyonu
  extractors.ts         # Saf parametre çıkarıcılar
  intents.ts            # Niyet listesi + handler'lar
  engine.ts             # classify(text, store) → AssistantResponse
  replies.ts            # Şablon metinler (greeting/unknown/empty)
  __tests__/
    normalize.test.ts
    extractors.test.ts
    engine.test.ts

src/components/ui/assistant/
  assistant-modal.tsx               # Mod yönetimi + modal kabuk
  assistant-modules-screen.tsx      # Mevcut modules görünümü taşıdı
  assistant-chat-screen.tsx         # Sidebar + thread + composer
  chat-sidebar.tsx
  chat-thread.tsx
  chat-message.tsx
  chat-composer.tsx
  assistant-blocks/
    index.ts                        # Block dispatcher
    text-block.tsx
    listings-block.tsx
    customers-block.tsx
    transactions-block.tsx
    events-block.tsx
    stat-block.tsx
    chart-block.tsx
    suggest-block.tsx
```

**Değişen:**

- `src/lib/store.tsx` — `AssistantSession`/`AssistantChatMessage` ekle, aksiyonlar, STORAGE_KEY bump + migrasyon.
- `src/components/ui/infinite-grid-integration.tsx` — modal blok'unu `<AssistantModal />` ile değiştir; `assistantMode='suggestions'`, `assistantSuggestions`, `assistantChips` ile birlikte ilgili JSX'i kaldır.
- `package.json`, `vite.config.ts` — Vitest kurulumu (Task 1).

---

## Task 1: Vitest test altyapısı

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Vitest ve jsdom kur**

```bash
npm i -D vitest @vitest/ui jsdom @testing-library/jest-dom
```

- [ ] **Step 2: `package.json` scripts'e test ekle**

`scripts` bloğunu şöyle güncelle:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: `vite.config.ts`'e test bloğu ekle**

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Üstüne `/// <reference types="vitest" />` ekle (en üst satıra).

- [ ] **Step 4: `src/test-setup.ts` oluştur**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Sanity test**

`src/lib/assistant/__tests__/sanity.test.ts` oluştur:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Çalıştır: `npm test`. Beklenen: 1 passed.

- [ ] **Step 6: Sanity'yi sil ve commit (repo git ise)**

```bash
rm src/lib/assistant/__tests__/sanity.test.ts
```

Repo git değilse commit adımını atla. (Bu repoda git yok; tüm commit adımlarında "git initialize edilirse" notu geçerlidir.)

---

## Task 2: Tip tanımları (`types.ts`)

**Files:**
- Create: `src/lib/assistant/types.ts`

- [ ] **Step 1: Tip dosyasını oluştur**

```ts
export type IntentName =
  | 'listing.search'
  | 'customer.search'
  | 'transaction.summary'
  | 'event.list'
  | 'match.find'
  | 'count.stats'
  | 'greeting'
  | 'unknown';

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface AreaRange {
  min?: number; // m²
  max?: number;
}

export interface ExtractedParams {
  location?: string;
  priceRange?: PriceRange;
  areaRange?: AreaRange;
  tags?: string[];
  segment?: 'Sıcak' | 'Ilık' | 'Soğuk';
  stage?: 'İlk temas' | 'Görüşme' | 'Teklif' | 'Kaparo' | 'Tapu';
  day?: 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';
  eventType?: 'saha' | 'tapu' | 'gorusme';
  ids?: { listings: string[]; customers: string[]; transactions: string[] };
  interestKeyword?: string;
}

export type ChartKind = 'mini' | 'line' | 'funnel';

export interface ChartDatum {
  label: string;
  value: number;
}

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'listings'; ids: string[] }
  | { kind: 'customers'; ids: string[] }
  | { kind: 'transactions'; ids: string[] }
  | { kind: 'events'; ids: string[] }
  | { kind: 'stat'; label: string; value: string; delta?: string }
  | { kind: 'chart'; chart: ChartKind; data: ChartDatum[]; caption?: string }
  | { kind: 'suggest'; chips: string[] };

export interface AssistantResponse {
  intent: IntentName;
  text: string;
  blocks: AssistantBlock[];
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks?: AssistantBlock[];
  intent?: IntentName;
  createdAt: string; // ISO
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 3: Normalize utility + testleri

**Files:**
- Create: `src/lib/assistant/normalize.ts`
- Create: `src/lib/assistant/__tests__/normalize.test.ts`

- [ ] **Step 1: Failing test yaz**

`__tests__/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalize } from '../normalize';

describe('normalize', () => {
  it('lowercases and removes diacritics', () => {
    expect(normalize('ÇANAKKALE')).toBe('canakkale');
    expect(normalize('İzmir')).toBe('izmir');
    expect(normalize('Şehir')).toBe('sehir');
    expect(normalize('Görüşme')).toBe('gorusme');
  });

  it('collapses whitespace and trims', () => {
    expect(normalize('  iki   kelime  ')).toBe('iki kelime');
  });

  it('expands common money/area shortcuts', () => {
    expect(normalize('2M altı')).toContain('2000000');
    expect(normalize('800K')).toContain('800000');
    expect(normalize('5 dönüm')).toContain('5000 m');
  });

  it('preserves digits and punctuation that matter', () => {
    expect(normalize('ARS-0142 hakkında')).toContain('ars-0142');
  });
});
```

- [ ] **Step 2: Run test, fail bekle**

```bash
npm test -- normalize
```

Beklenen: FAIL (Cannot find module '../normalize').

- [ ] **Step 3: `normalize.ts` yaz**

```ts
const TR_MAP: Record<string, string> = {
  'ç': 'c', 'Ç': 'c',
  'ğ': 'g', 'Ğ': 'g',
  'ı': 'i', 'I': 'i', 'İ': 'i',
  'ö': 'o', 'Ö': 'o',
  'ş': 's', 'Ş': 's',
  'ü': 'u', 'Ü': 'u',
};

function stripDiacritics(s: string): string {
  return s
    .split('')
    .map((c) => TR_MAP[c] ?? c)
    .join('')
    .toLowerCase();
}

function expandShortcuts(s: string): string {
  // 2M / 1.5M / 800K → 2000000 / 1500000 / 800000
  let out = s.replace(/(\d+(?:[.,]\d+)?)\s*m\b/gi, (_m, num: string) => {
    const v = parseFloat(num.replace(',', '.'));
    return String(Math.round(v * 1_000_000));
  });
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*k\b/gi, (_m, num: string) => {
    const v = parseFloat(num.replace(',', '.'));
    return String(Math.round(v * 1_000));
  });
  // "X milyon" / "X bin"
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*milyon\b/gi, (_m, num: string) => {
    const v = parseFloat(num.replace(',', '.'));
    return String(Math.round(v * 1_000_000));
  });
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*bin\b/gi, (_m, num: string) => {
    const v = parseFloat(num.replace(',', '.'));
    return String(Math.round(v * 1_000));
  });
  // "5 dönüm" → "5000 m" (1 dönüm = 1000 m²)
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*donum\b/gi, (_m, num: string) => {
    const v = parseFloat(num.replace(',', '.'));
    return `${Math.round(v * 1000)} m`;
  });
  return out;
}

export function normalize(input: string): string {
  const stripped = stripDiacritics(input);
  const expanded = expandShortcuts(stripped);
  return expanded.replace(/\s+/g, ' ').trim();
}
```

- [ ] **Step 4: Run test, pass bekle**

```bash
npm test -- normalize
```

Beklenen: 4 passed.

---

## Task 4: Extractors + testleri

**Files:**
- Create: `src/lib/assistant/extractors.ts`
- Create: `src/lib/assistant/__tests__/extractors.test.ts`

Tek dosyada tüm çıkarıcılar; her biri testlenir.

- [ ] **Step 1: Failing test yaz**

`__tests__/extractors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  extractLocation,
  extractPriceRange,
  extractAreaRange,
  extractTags,
  extractSegment,
  extractStage,
  extractDay,
  extractEventType,
  extractIds,
} from '../extractors';
import { normalize } from '../normalize';

const n = (s: string) => normalize(s);

describe('extractLocation', () => {
  it('detects Çanakkale', () => {
    expect(extractLocation(n('Çanakkale\'de arsa öner'))).toBe('Çanakkale');
  });
  it('detects Ayvalık', () => {
    expect(extractLocation(n('Ayvalık zeytinlik'))).toBe('Ayvalık');
  });
  it('returns undefined when no location', () => {
    expect(extractLocation(n('arsa öner'))).toBeUndefined();
  });
});

describe('extractPriceRange', () => {
  it('parses "2M altı" as max', () => {
    expect(extractPriceRange(n('2M altı'))).toEqual({ max: 2_000_000 });
  });
  it('parses "1M üstü" as min', () => {
    expect(extractPriceRange(n('1M üstü'))).toEqual({ min: 1_000_000 });
  });
  it('parses "1-2M arası"', () => {
    expect(extractPriceRange(n('1-2M arası'))).toEqual({ min: 1_000_000, max: 2_000_000 });
  });
  it('returns undefined when no price', () => {
    expect(extractPriceRange(n('arsa'))).toBeUndefined();
  });
});

describe('extractAreaRange', () => {
  it('parses "2.000 m² üstü"', () => {
    expect(extractAreaRange(n('2.000 m² üstü'))).toEqual({ min: 2000 });
  });
  it('parses "5 dönüm" as 5000 m²', () => {
    expect(extractAreaRange(n('5 dönüm'))).toBeDefined();
  });
});

describe('extractTags', () => {
  it('detects deniz manzaralı', () => {
    expect(extractTags(n('deniz manzaralı arsa'))).toContain('Deniz manzaralı');
  });
  it('detects zeytinlik', () => {
    expect(extractTags(n('Ayvalık zeytinlik'))).toContain('Zeytinlik');
  });
  it('detects synonym "villa imarı" → "Villa imarlı"', () => {
    expect(extractTags(n('villa imarı'))).toContain('Villa imarlı');
  });
});

describe('extractSegment', () => {
  it('detects sıcak', () => {
    expect(extractSegment(n('sıcak müşterilerim'))).toBe('Sıcak');
  });
});

describe('extractStage', () => {
  it('detects kaparo', () => {
    expect(extractStage(n('kaparo aşamasındakiler'))).toBe('Kaparo');
  });
});

describe('extractDay', () => {
  it('detects Cuma', () => {
    expect(extractDay(n('Cuma ne var'))).toBe('Cum');
  });
  it('detects bugün as today day code', () => {
    // bugün → herhangi bir gün; sadece tanımlı olduğunu test edelim
    expect(extractDay(n('bugün ne var'))).toBeDefined();
  });
});

describe('extractEventType', () => {
  it('detects tapu', () => {
    expect(extractEventType(n('tapu randevuları'))).toBe('tapu');
  });
});

describe('extractIds', () => {
  it('detects listing id', () => {
    expect(extractIds(n('ARS-0142 için')).listings).toContain('ARS-0142');
  });
  it('detects customer id', () => {
    expect(extractIds(n('CUS-001 ile')).customers).toContain('CUS-001');
  });
});
```

- [ ] **Step 2: Run test, fail bekle**

```bash
npm test -- extractors
```

Beklenen: FAIL.

- [ ] **Step 3: `extractors.ts` yaz**

```ts
import type { ExtractedParams, PriceRange, AreaRange } from './types';

const LOCATIONS: Array<{ key: string; canonical: string }> = [
  { key: 'canakkale', canonical: 'Çanakkale' },
  { key: 'ayvalik', canonical: 'Ayvalık' },
  { key: 'datca', canonical: 'Datça' },
  { key: 'bodrum', canonical: 'Bodrum' },
  { key: 'alacati', canonical: 'Alaçatı' },
  { key: 'marmaris', canonical: 'Marmaris' },
  { key: 'soke', canonical: 'Söke' },
  { key: 'ayvacik', canonical: 'Ayvacık' },
  { key: 'cunda', canonical: 'Cunda' },
  { key: 'mugla', canonical: 'Muğla' },
  { key: 'izmir', canonical: 'İzmir' },
  { key: 'aydin', canonical: 'Aydın' },
  { key: 'balikesir', canonical: 'Balıkesir' },
];

export function extractLocation(text: string): string | undefined {
  for (const loc of LOCATIONS) {
    if (text.includes(loc.key)) return loc.canonical;
  }
  return undefined;
}

const NUM_RE = '(\\d+(?:[.,]\\d+)?|\\d{1,3}(?:[.,]\\d{3})+)';

function parseNum(raw: string): number {
  // "2.000.000" or "2,000,000" → 2000000
  const cleaned = raw.replace(/\./g, '').replace(/,/g, '');
  return parseInt(cleaned, 10);
}

export function extractPriceRange(text: string): PriceRange | undefined {
  // normalize zaten "2M" → "2000000" yaptı, yani sadece numbers + altı/üstü/arası bakacağız.
  // Range: "1000000-2000000 arasi"
  const range = new RegExp(`${NUM_RE}\\s*-\\s*${NUM_RE}\\s*(?:arasi|arası)?`).exec(text);
  if (range) {
    const a = parseNum(range[1]);
    const b = parseNum(range[2]);
    if (a >= 100_000 && b >= 100_000) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  // "X alti" → max
  const max = new RegExp(`${NUM_RE}\\s*(?:alti|altinda)`).exec(text);
  if (max) {
    const v = parseNum(max[1]);
    if (v >= 100_000) return { max: v };
  }
  // "X ustu" → min
  const min = new RegExp(`${NUM_RE}\\s*(?:ustu|ustunde)`).exec(text);
  if (min) {
    const v = parseNum(min[1]);
    if (v >= 100_000) return { min: v };
  }
  return undefined;
}

export function extractAreaRange(text: string): AreaRange | undefined {
  // m² işareti normalize sonrası "m" oluyor
  const range = new RegExp(`${NUM_RE}\\s*-\\s*${NUM_RE}\\s*m`).exec(text);
  if (range) {
    return { min: Math.min(parseNum(range[1]), parseNum(range[2])), max: Math.max(parseNum(range[1]), parseNum(range[2])) };
  }
  const min = new RegExp(`${NUM_RE}\\s*m[^a-z]?\\s*(?:ustu|ustunde)`).exec(text);
  if (min) return { min: parseNum(min[1]) };
  const max = new RegExp(`${NUM_RE}\\s*m[^a-z]?\\s*(?:alti|altinda)`).exec(text);
  if (max) return { max: parseNum(max[1]) };
  // Bare "X m" with no qualifier — exact, takes ±20% as range
  const bare = new RegExp(`${NUM_RE}\\s*m\\b`).exec(text);
  if (bare) {
    const v = parseNum(bare[1]);
    if (v >= 100) return { min: Math.floor(v * 0.8), max: Math.ceil(v * 1.2) };
  }
  return undefined;
}

const TAGS: Array<{ patterns: string[]; canonical: string }> = [
  { patterns: ['deniz manzarali', 'deniz manzarasi', 'deniz manzara'], canonical: 'Deniz manzaralı' },
  { patterns: ['koy onu', 'koyonu'], canonical: 'Koy önü' },
  { patterns: ['zeytinlik', 'zeytin bahcesi'], canonical: 'Zeytinlik' },
  { patterns: ['yola cephe', 'yol cephe'], canonical: 'Yola cephe' },
  { patterns: ['merkez', 'merkezde'], canonical: 'Merkez' },
  { patterns: ['villa imarli', 'villa imari'], canonical: 'Villa imarlı' },
];

export function extractTags(text: string): string[] {
  const out: string[] = [];
  for (const tag of TAGS) {
    if (tag.patterns.some((p) => text.includes(p))) {
      if (!out.includes(tag.canonical)) out.push(tag.canonical);
    }
  }
  return out;
}

export function extractSegment(text: string): ExtractedParams['segment'] {
  if (/\bsicak\b/.test(text)) return 'Sıcak';
  if (/\bilik\b/.test(text)) return 'Ilık';
  if (/\bsoguk\b/.test(text)) return 'Soğuk';
  return undefined;
}

export function extractStage(text: string): ExtractedParams['stage'] {
  if (/\bilk temas\b/.test(text)) return 'İlk temas';
  if (/\bgorusme\b/.test(text)) return 'Görüşme';
  if (/\bteklif\b/.test(text)) return 'Teklif';
  if (/\bkaparo\b/.test(text)) return 'Kaparo';
  if (/\btapu\b/.test(text)) return 'Tapu';
  return undefined;
}

const DAY_MAP: Record<string, ExtractedParams['day']> = {
  'pazartesi': 'Pzt', 'pzt': 'Pzt',
  'sali': 'Sal', 'sal': 'Sal',
  'carsamba': 'Çar', 'car': 'Çar',
  'persembe': 'Per', 'per': 'Per',
  'cuma': 'Cum', 'cum': 'Cum',
  'cumartesi': 'Cmt', 'cmt': 'Cmt',
  'pazar': 'Paz', 'paz': 'Paz',
};

export function extractDay(text: string): ExtractedParams['day'] {
  if (/\bbugun\b/.test(text)) return weekdayCode(new Date().getDay());
  if (/\byarin\b/.test(text)) return weekdayCode((new Date().getDay() + 1) % 7);
  for (const key of Object.keys(DAY_MAP)) {
    const re = new RegExp(`\\b${key}\\b`);
    if (re.test(text)) return DAY_MAP[key];
  }
  return undefined;
}

function weekdayCode(jsDay: number): ExtractedParams['day'] {
  // JS: 0=Sun..6=Sat. Bizim: Pzt..Paz
  const map: ExtractedParams['day'][] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return map[jsDay];
}

export function extractEventType(text: string): ExtractedParams['eventType'] {
  if (/\btapu\b/.test(text)) return 'tapu';
  if (/\bsaha\b/.test(text)) return 'saha';
  if (/\bgorusme\b/.test(text)) return 'gorusme';
  return undefined;
}

export function extractIds(text: string): NonNullable<ExtractedParams['ids']> {
  const listings = Array.from(text.matchAll(/\bars-(\d{3,4})\b/gi)).map((m) => `ARS-${m[1]}`.toUpperCase());
  const customers = Array.from(text.matchAll(/\bcus-(\d{3,4})\b/gi)).map((m) => `CUS-${m[1]}`.toUpperCase());
  const transactions = Array.from(text.matchAll(/\btx-(\d{3,4})\b/gi)).map((m) => `TX-${m[1]}`.toUpperCase());
  return { listings, customers, transactions };
}
```

- [ ] **Step 4: Run test, pass bekle**

```bash
npm test -- extractors
```

Beklenen: tüm 14+ test passes.

---

## Task 5: Replies (şablonlar)

**Files:**
- Create: `src/lib/assistant/replies.ts`

- [ ] **Step 1: Şablonları yaz**

```ts
const GREETINGS = [
  'Merhaba! Sana arsa, müşteri, finans ve takvim konusunda yardımcı olabilirim.',
  'Merhaba. Sorunu yaz; veriden bakarım.',
];

const GREETING_CHIPS = [
  'Çanakkale deniz manzaralı arsa öner',
  'Bu hafta randevular',
  'Sıcak müşterilerim',
  'Bu ayki kaparolar',
];

const UNKNOWN_PREFIX = [
  'Tam olarak çıkaramadım, şunlar arasında bir tane mi olmalı?',
  'Soruyu net çözemedim. Aşağıdakilerden birini deneyebilirsin:',
];

const UNKNOWN_CHIPS = [
  'Aktif ilanlar',
  'Bu ay tapu tamamlananlar',
  'Ayvalık zeytinlik ₺1M altı',
  'Mehmet için uygun arsa',
];

const EMPTY_RESULT = [
  'Bu kriterlere uyan kayıt bulamadım.',
  'Eşleşme yok. Filtreyi gevşetebilirim.',
];

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export const replies = {
  greeting: () => ({ text: pick(GREETINGS), chips: GREETING_CHIPS }),
  unknown: () => ({ text: pick(UNKNOWN_PREFIX), chips: UNKNOWN_CHIPS }),
  empty: () => pick(EMPTY_RESULT),
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 6: Niyetler ve handler'lar (`intents.ts`)

**Files:**
- Create: `src/lib/assistant/intents.ts`

- [ ] **Step 1: Intent registry yaz**

```ts
import type {
  AssistantBlock,
  AssistantResponse,
  ExtractedParams,
  IntentName,
} from './types';
import type {
  Listing,
  Customer,
  Transaction,
  CalendarEvent,
  Conversation,
} from '@/lib/store';
import { replies } from './replies';

export interface StoreSnapshot {
  listings: Listing[];
  customers: Customer[];
  transactions: Transaction[];
  events: CalendarEvent[];
  conversations: Conversation[];
}

export interface IntentDef {
  name: IntentName;
  keywords: string[];
  handle: (params: ExtractedParams, store: StoreSnapshot) => AssistantResponse;
}

const PRICE_TO_NUMBER = (priceStr: string): number => {
  // "₺1.8M" → 1800000, "₺950K" → 950000
  const m = /([\d.]+)\s*([MK])/i.exec(priceStr);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  return m[2].toUpperCase() === 'M' ? v * 1_000_000 : v * 1000;
};

const AREA_TO_NUMBER = (areaStr: string): number => {
  // "8.250 m²" → 8250
  const m = /([\d.]+)/.exec(areaStr);
  if (!m) return 0;
  return parseFloat(m[1].replace(/\./g, ''));
};

function listingMatches(l: Listing, p: ExtractedParams): boolean {
  if (p.location && !l.loc.toLowerCase().includes(p.location.toLowerCase())) return false;
  if (p.tags && p.tags.length > 0) {
    if (!l.tag || !p.tags.includes(l.tag)) return false;
  }
  if (p.priceRange) {
    const v = PRICE_TO_NUMBER(l.price);
    if (p.priceRange.min && v < p.priceRange.min) return false;
    if (p.priceRange.max && v > p.priceRange.max) return false;
  }
  if (p.areaRange) {
    const a = AREA_TO_NUMBER(l.area);
    if (p.areaRange.min && a < p.areaRange.min) return false;
    if (p.areaRange.max && a > p.areaRange.max) return false;
  }
  return true;
}

function customerMatches(c: Customer, p: ExtractedParams): boolean {
  if (p.segment && c.segment !== p.segment) return false;
  if (p.stage && c.stage !== p.stage) return false;
  if (p.location && !c.interest.toLowerCase().includes(p.location.toLowerCase())) return false;
  if (p.interestKeyword && !c.interest.toLowerCase().includes(p.interestKeyword.toLowerCase())) return false;
  return true;
}

const listingSearch: IntentDef = {
  name: 'listing.search',
  keywords: ['arsa', 'ilan', 'satilik', 'oner', 'bul', 'goster', 'arazi'],
  handle: (p, s) => {
    const matched = s.listings.filter((l) => l.status === 'Aktif' && listingMatches(l, p));
    if (matched.length === 0) {
      return {
        intent: 'listing.search',
        text: replies.empty(),
        blocks: [{ kind: 'suggest', chips: ['Filtreyi gevşet', 'Tüm aktif ilanlar', 'Bu ay eklenenler'] }],
      };
    }
    const top = matched.slice(0, 5);
    const fragments: string[] = [];
    fragments.push(`${matched.length} arsa buldum`);
    if (p.location) fragments.push(`${p.location} bölgesinde`);
    if (p.tags?.length) fragments.push(`'${p.tags.join(', ')}' etiketli`);
    return {
      intent: 'listing.search',
      text: fragments.join(', ') + '.',
      blocks: [
        { kind: 'listings', ids: top.map((l) => l.id) },
        {
          kind: 'suggest',
          chips: ['Bu listedekilere uygun müşteri', 'Daha geniş bütçe', 'Sadece en yakın 3'],
        },
      ],
    };
  },
};

const customerSearch: IntentDef = {
  name: 'customer.search',
  keywords: ['musteri', 'sicak', 'ilik', 'soguk', 'crm', 'kim'],
  handle: (p, s) => {
    const matched = s.customers.filter((c) => customerMatches(c, p));
    if (matched.length === 0) {
      return {
        intent: 'customer.search',
        text: replies.empty(),
        blocks: [{ kind: 'suggest', chips: ['Tüm sıcak müşteriler', 'Teklif aşamasındakiler'] }],
      };
    }
    const top = matched.slice(0, 6);
    return {
      intent: 'customer.search',
      text: `${matched.length} müşteri bulundu.`,
      blocks: [
        { kind: 'customers', ids: top.map((c) => c.id) },
        { kind: 'suggest', chips: ['Bunlar için uygun arsa', 'Sadece kaparo aşaması'] },
      ],
    };
  },
};

const transactionSummary: IntentDef = {
  name: 'transaction.summary',
  keywords: ['ciro', 'kaparo', 'tapu', 'satis', 'odeme', 'islem', 'gelir'],
  handle: (p, s) => {
    let filtered = s.transactions;
    if (p.stage === 'Kaparo') filtered = filtered.filter((t) => t.status === 'Kaparo');
    else if (p.stage === 'Tapu') filtered = filtered.filter((t) => t.status === 'Tapu tamam');
    else if (p.stage === 'Teklif') filtered = filtered.filter((t) => t.status === 'Teklif');

    const total = filtered.reduce((sum, t) => sum + PRICE_TO_NUMBER(t.amount), 0);
    const fmtTotal = total >= 1_000_000 ? `₺${(total / 1_000_000).toFixed(1)}M` : `₺${(total / 1000).toFixed(0)}K`;

    if (filtered.length === 0) {
      return {
        intent: 'transaction.summary',
        text: replies.empty(),
        blocks: [],
      };
    }

    // Mini-chart: amount bazında
    const chartData = filtered.map((t) => ({ label: t.date, value: Math.round(PRICE_TO_NUMBER(t.amount) / 1000) }));

    const blocks: AssistantBlock[] = [
      { kind: 'stat', label: 'İşlem sayısı', value: String(filtered.length) },
      { kind: 'stat', label: 'Toplam tutar', value: fmtTotal },
      { kind: 'transactions', ids: filtered.slice(0, 5).map((t) => t.id) },
      { kind: 'chart', chart: 'mini', data: chartData, caption: 'İşlem tutarları (₺K)' },
    ];

    return {
      intent: 'transaction.summary',
      text: `${filtered.length} işlem, toplam ${fmtTotal}.`,
      blocks,
    };
  },
};

const eventList: IntentDef = {
  name: 'event.list',
  keywords: ['randevu', 'takvim', 'haftalik', 'gun', 'plan', 'gezi'],
  handle: (p, s) => {
    let filtered = s.events;
    if (p.day) filtered = filtered.filter((e) => e.day === p.day);
    if (p.eventType) filtered = filtered.filter((e) => e.type === p.eventType);

    if (filtered.length === 0) {
      return {
        intent: 'event.list',
        text: replies.empty(),
        blocks: [],
      };
    }

    return {
      intent: 'event.list',
      text: p.day ? `${p.day} günü ${filtered.length} randevu var.` : `${filtered.length} randevu listeliyorum.`,
      blocks: [
        { kind: 'events', ids: filtered.map((e) => e.id) },
        { kind: 'suggest', chips: ['Sadece tapu randevuları', 'Sadece saha gezileri'] },
      ],
    };
  },
};

const matchFind: IntentDef = {
  name: 'match.find',
  keywords: ['uygun', 'eslestir', 'eslesen', 'ilgilenir', 'pazara'],
  handle: (p, s) => {
    const lid = p.ids?.listings[0];
    const cid = p.ids?.customers[0];

    if (lid) {
      const listing = s.listings.find((l) => l.id === lid);
      if (!listing) {
        return { intent: 'match.find', text: `${lid} bulunamadı.`, blocks: [] };
      }
      const candidates = s.customers.filter((c) => {
        const interestLower = c.interest.toLowerCase();
        const locLower = listing.loc.toLowerCase();
        const tagLower = (listing.tag ?? '').toLowerCase();
        return (
          locLower.split(/[\/ ]/).some((w) => w && interestLower.includes(w)) ||
          (tagLower && interestLower.includes(tagLower))
        );
      });
      if (candidates.length === 0) {
        return { intent: 'match.find', text: `${listing.id} için eşleşen müşteri yok.`, blocks: [] };
      }
      return {
        intent: 'match.find',
        text: `${listing.id} (${listing.loc}) için ${candidates.length} uygun müşteri.`,
        blocks: [{ kind: 'customers', ids: candidates.slice(0, 5).map((c) => c.id) }],
      };
    }

    if (cid) {
      const cust = s.customers.find((c) => c.id === cid);
      if (!cust) {
        return { intent: 'match.find', text: `${cid} bulunamadı.`, blocks: [] };
      }
      const interestLower = cust.interest.toLowerCase();
      const candidates = s.listings.filter(
        (l) => l.status === 'Aktif' &&
          (interestLower.includes(l.loc.split('/')[0].trim().toLowerCase()) ||
            (l.tag && interestLower.includes(l.tag.toLowerCase()))),
      );
      if (candidates.length === 0) {
        return { intent: 'match.find', text: `${cust.name} için eşleşen ilan yok.`, blocks: [] };
      }
      return {
        intent: 'match.find',
        text: `${cust.name} için ${candidates.length} uygun arsa.`,
        blocks: [{ kind: 'listings', ids: candidates.slice(0, 5).map((l) => l.id) }],
      };
    }

    return {
      intent: 'match.find',
      text: 'Hangi ilan veya müşteri için eşleştireyim? (örn. ARS-0142 veya Mehmet)',
      blocks: [],
    };
  },
};

const countStats: IntentDef = {
  name: 'count.stats',
  keywords: ['kac', 'sayi', 'toplam', 'okunmamis', 'aktif', 'bekleyen'],
  handle: (p, s) => {
    const text = '';
    void text;
    // Basit istatistikler
    const blocks: AssistantBlock[] = [];
    blocks.push({ kind: 'stat', label: 'Aktif ilan', value: String(s.listings.filter((l) => l.status === 'Aktif').length) });
    blocks.push({ kind: 'stat', label: 'Sıcak müşteri', value: String(s.customers.filter((c) => c.segment === 'Sıcak').length) });
    blocks.push({ kind: 'stat', label: 'Okunmamış mesaj', value: String(s.conversations.filter((c) => c.unread).length) });
    blocks.push({ kind: 'stat', label: 'Bekleyen evrak', value: String(s.transactions.filter((t) => t.status === 'Kaparo' || t.status === 'Teklif').length) });
    return {
      intent: 'count.stats',
      text: 'Atölye anlık görüntüsü:',
      blocks,
    };
  },
};

const greeting: IntentDef = {
  name: 'greeting',
  keywords: ['selam', 'merhaba', 'hey', 'hi', 'yardim', 'yapabilirsin', 'naber'],
  handle: () => {
    const r = replies.greeting();
    return {
      intent: 'greeting',
      text: r.text,
      blocks: [{ kind: 'suggest', chips: r.chips }],
    };
  },
};

const unknown: IntentDef = {
  name: 'unknown',
  keywords: [],
  handle: () => {
    const r = replies.unknown();
    return {
      intent: 'unknown',
      text: r.text,
      blocks: [{ kind: 'suggest', chips: r.chips }],
    };
  },
};

export const INTENTS: readonly IntentDef[] = [
  matchFind,
  transactionSummary,
  eventList,
  listingSearch,
  customerSearch,
  countStats,
  greeting,
  unknown,
] as const;
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 7: Engine + testler

**Files:**
- Create: `src/lib/assistant/engine.ts`
- Create: `src/lib/assistant/__tests__/engine.test.ts`

- [ ] **Step 1: Engine yaz**

```ts
import { normalize } from './normalize';
import {
  extractLocation,
  extractPriceRange,
  extractAreaRange,
  extractTags,
  extractSegment,
  extractStage,
  extractDay,
  extractEventType,
  extractIds,
} from './extractors';
import { INTENTS, type StoreSnapshot } from './intents';
import type { AssistantResponse, ExtractedParams } from './types';

export function classify(text: string, store: StoreSnapshot): AssistantResponse {
  const norm = normalize(text);
  const params: ExtractedParams = {
    location: extractLocation(norm),
    priceRange: extractPriceRange(norm),
    areaRange: extractAreaRange(norm),
    tags: extractTags(norm),
    segment: extractSegment(norm),
    stage: extractStage(norm),
    day: extractDay(norm),
    eventType: extractEventType(norm),
    ids: extractIds(norm),
  };

  // Skor: keyword frekansı + parametre bonusu
  const scores = INTENTS.map((intent) => {
    let score = 0;
    for (const kw of intent.keywords) {
      if (norm.includes(kw)) score += 1;
    }
    // Parametre bonusu
    if (intent.name === 'match.find' && (params.ids?.listings.length || params.ids?.customers.length)) score += 3;
    if (intent.name === 'event.list' && (params.day || params.eventType)) score += 2;
    if (intent.name === 'listing.search' && (params.location || params.tags?.length || params.priceRange || params.areaRange)) score += 1;
    if (intent.name === 'customer.search' && (params.segment || params.stage)) score += 2;
    if (intent.name === 'transaction.summary' && params.stage) score += 2;
    return { intent, score };
  });

  // En yüksek skoru bul. Eşitlikte INTENTS sırası geçerli (matchFind önde).
  let best = scores[0];
  for (const s of scores) {
    if (s.score > best.score) best = s;
  }
  if (best.score < 1) {
    const unknownIntent = INTENTS.find((i) => i.name === 'unknown')!;
    return unknownIntent.handle(params, store);
  }
  return best.intent.handle(params, store);
}
```

- [ ] **Step 2: Engine test yaz**

`__tests__/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { classify } from '../engine';
import type { StoreSnapshot } from '../intents';
import type { Listing, Customer, Transaction, CalendarEvent, Conversation } from '@/lib/store';

const sampleStore: StoreSnapshot = {
  listings: [
    { id: 'ARS-0142', loc: 'Ayvacık / Çanakkale', area: '8.250 m²', price: '₺1.8M', views: 0, status: 'Aktif', tag: 'Deniz manzaralı' },
    { id: 'ARS-0137', loc: 'Cunda / Balıkesir', area: '5.600 m²', price: '₺1.2M', views: 0, status: 'Aktif', tag: 'Zeytinlik' },
  ] satisfies Listing[],
  customers: [
    { id: 'CUS-001', name: 'Mehmet Kaya', interest: 'Deniz manzaralı · Muğla', budget: '₺2-3M', stage: 'Teklif', last: '2 saat', segment: 'Sıcak' },
    { id: 'CUS-004', name: 'Selin Aksoy', interest: 'Zeytinlik · Ayvalık', budget: '₺800K-1.2M', stage: 'Görüşme', last: '1 gün', segment: 'Ilık' },
  ] satisfies Customer[],
  transactions: [
    { id: 'TX-2419', customerId: 'CUS-003', customer: 'Kerem Ö.', listing: 'ARS-0125', amount: '₺3.8M', date: '15 Nis', status: 'Kaparo' },
    { id: 'TX-2412', customerId: 'CUS-004', customer: 'Selin A.', listing: 'ARS-0137', amount: '₺1.2M', date: '28 Mar', status: 'Tapu tamam' },
  ] satisfies Transaction[],
  events: [
    { id: 'EV-05', day: 'Cum', time: '09:30', title: 'Görüşme · Ayşe T.', type: 'gorusme' },
    { id: 'EV-07', day: 'Cum', time: '17:00', title: 'Tapu randevusu · Burak Ay', type: 'tapu' },
  ] satisfies CalendarEvent[],
  conversations: [] satisfies Conversation[],
};

describe('engine.classify', () => {
  it('routes location+tag to listing.search', () => {
    const r = classify('Çanakkale deniz manzaralı arsa öner', sampleStore);
    expect(r.intent).toBe('listing.search');
    expect(r.blocks.some((b) => b.kind === 'listings')).toBe(true);
  });

  it('routes "sıcak müşterilerim" to customer.search', () => {
    const r = classify('sıcak müşterilerim', sampleStore);
    expect(r.intent).toBe('customer.search');
  });

  it('routes "bu ayki kaparolar" to transaction.summary', () => {
    const r = classify('bu ayki kaparolar', sampleStore);
    expect(r.intent).toBe('transaction.summary');
    expect(r.blocks.some((b) => b.kind === 'stat')).toBe(true);
  });

  it('routes "Cuma ne var" to event.list', () => {
    const r = classify('Cuma ne var', sampleStore);
    expect(r.intent).toBe('event.list');
  });

  it('routes "ARS-0142 için uygun müşteri" to match.find', () => {
    const r = classify('ARS-0142 için uygun müşteri', sampleStore);
    expect(r.intent).toBe('match.find');
  });

  it('routes "merhaba" to greeting', () => {
    const r = classify('merhaba', sampleStore);
    expect(r.intent).toBe('greeting');
  });

  it('routes garbage to unknown', () => {
    const r = classify('asdfgh xyzqq', sampleStore);
    expect(r.intent).toBe('unknown');
  });

  it('always returns text and blocks array', () => {
    const r = classify('Ayvalık zeytinlik', sampleStore);
    expect(typeof r.text).toBe('string');
    expect(Array.isArray(r.blocks)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test**

```bash
npm test
```

Beklenen: tüm normalize/extractors/engine testleri yeşil.

---

## Task 8: Store değişiklikleri

**Files:**
- Modify: `src/lib/store.tsx`

- [ ] **Step 1: AssistantBlock import et ve tipleri ekle**

`src/lib/store.tsx`'in en üstündeki import'ları koru, en alta (mevcut tip tanımlarının yanına) ekle:

```ts
import type { AssistantBlock } from './assistant/types';

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks?: AssistantBlock[];
  intent?: string;
  createdAt: string;
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
}
```

- [ ] **Step 2: `StoreState` ve `StoreActions` interface'lerini genişlet**

`StoreState` interface'ine ekle:

```ts
  assistantSessions: AssistantSession[];
  activeAssistantSessionId: string | null;
```

`StoreActions` interface'ine ekle:

```ts
  startAssistantSession: () => string;
  setActiveAssistantSession: (id: string) => void;
  appendAssistantMessage: (sessionId: string, msg: Omit<AssistantChatMessage, 'id' | 'createdAt'>) => string;
  renameAssistantSession: (id: string, title: string) => void;
  deleteAssistantSession: (id: string) => void;
  clearAssistantSessions: () => void;
```

- [ ] **Step 3: `initialState`'i güncelle**

```ts
const initialState: StoreState = {
  listings: initialListings,
  customers: initialCustomers,
  transactions: initialTransactions,
  events: initialEvents,
  conversations: initialConversations,
  profile: initialProfile,
  activity: initialActivity,
  assistantSessions: [],
  activeAssistantSessionId: null,
};
```

- [ ] **Step 4: STORAGE_KEY bump + migrasyon**

`STORAGE_KEY` satırını şu şekilde değiştir:

```ts
const STORAGE_KEY = "atelier-store-v3";
const LEGACY_STORAGE_KEY = "atelier-store-v2";
```

`StoreProvider` içindeki `useState` initializer'ını şöyle güncelle:

```ts
  const [state, setState] = useState<StoreState>(() => {
    if (typeof window === "undefined") return initialState;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...initialState,
          ...parsed,
          assistantSessions: parsed.assistantSessions ?? [],
          activeAssistantSessionId: parsed.activeAssistantSessionId ?? null,
        };
      }
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return {
          ...initialState,
          ...parsed,
          assistantSessions: [],
          activeAssistantSessionId: null,
        };
      }
    } catch {
      /* noop */
    }
    return initialState;
  });
```

- [ ] **Step 5: Aksiyonları implement et**

`useMemo` içindeki value objesinde, mevcut aksiyonların altına ekle:

```ts
      startAssistantSession: () => {
        const id = nextId('AS');
        const now = new Date().toISOString();
        const session: AssistantSession = {
          id,
          title: 'Yeni sohbet',
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        setState((s) => ({
          ...s,
          assistantSessions: [session, ...s.assistantSessions],
          activeAssistantSessionId: id,
        }));
        return id;
      },
      setActiveAssistantSession: (id) => {
        setState((s) => ({ ...s, activeAssistantSessionId: id }));
      },
      appendAssistantMessage: (sessionId, msg) => {
        const id = nextId('M');
        const now = new Date().toISOString();
        setState((s) => ({
          ...s,
          assistantSessions: s.assistantSessions.map((ss) => {
            if (ss.id !== sessionId) return ss;
            const messages = [...ss.messages, { id, createdAt: now, ...msg }];
            // Başlığı ilk user mesajından türet
            let title = ss.title;
            if (ss.title === 'Yeni sohbet' && msg.role === 'user') {
              title = msg.text.slice(0, 40);
            }
            return { ...ss, messages, updatedAt: now, title };
          }),
        }));
        return id;
      },
      renameAssistantSession: (id, title) => {
        setState((s) => ({
          ...s,
          assistantSessions: s.assistantSessions.map((ss) =>
            ss.id === id ? { ...ss, title } : ss,
          ),
        }));
      },
      deleteAssistantSession: (id) => {
        setState((s) => {
          const remaining = s.assistantSessions.filter((ss) => ss.id !== id);
          const newActive =
            s.activeAssistantSessionId === id ? remaining[0]?.id ?? null : s.activeAssistantSessionId;
          return { ...s, assistantSessions: remaining, activeAssistantSessionId: newActive };
        });
      },
      clearAssistantSessions: () => {
        setState((s) => ({ ...s, assistantSessions: [], activeAssistantSessionId: null }));
      },
```

- [ ] **Step 6: Type-check ve manuel test**

```bash
npx tsc --noEmit -p tsconfig.app.json
npm run dev
```

Browser'da localStorage'da `atelier-store-v3` anahtarının oluşmasını kontrol et (DevTools → Application → Local Storage). Eski v2 anahtarı varsa içeriği migrate edilmiş olarak v3'te görünmeli.

---

## Task 9: AssistantBlock alt bileşenleri

**Files:**
- Create: `src/components/ui/assistant/assistant-blocks/text-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/listings-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/customers-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/transactions-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/events-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/stat-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/chart-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/suggest-block.tsx`
- Create: `src/components/ui/assistant/assistant-blocks/index.ts`

- [ ] **Step 1: `text-block.tsx`**

```tsx
export function TextBlock({ text }: { text: string }) {
  return <p className="text-[13.5px] leading-relaxed text-foreground/90">{text}</p>;
}
```

- [ ] **Step 2: `listings-block.tsx`**

```tsx
import { useStore } from '@/lib/store';
import { MapPin } from 'lucide-react';

interface Props {
  ids: string[];
  onNavigate?: () => void;
}

export function ListingsBlock({ ids, onNavigate }: Props) {
  const { listings } = useStore();
  const items = ids.map((id) => listings.find((l) => l.id === id)).filter(Boolean) as typeof listings;
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((l) => (
        <button
          type="button"
          key={l.id}
          onClick={onNavigate}
          className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/40 p-3 text-left backdrop-blur-md transition-colors hover:bg-background/70"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{l.id}</span>
            <span className="text-[12.5px] font-semibold">{l.price}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{l.loc}</span>
          </div>
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>{l.area}</span>
            {l.tag && (
              <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]">
                {l.tag}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `customers-block.tsx`**

```tsx
import { useStore } from '@/lib/store';
import { User } from 'lucide-react';

interface Props {
  ids: string[];
  onNavigate?: () => void;
}

export function CustomersBlock({ ids, onNavigate }: Props) {
  const { customers } = useStore();
  const items = ids.map((id) => customers.find((c) => c.id === id)).filter(Boolean) as typeof customers;
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((c) => (
        <button
          type="button"
          key={c.id}
          onClick={onNavigate}
          className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/40 p-3 text-left backdrop-blur-md transition-colors hover:bg-background/70"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {c.name}
            </span>
            <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]">
              {c.segment}
            </span>
          </div>
          <div className="text-[12px] text-muted-foreground">{c.interest}</div>
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>{c.budget}</span>
            <span>{c.stage}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `transactions-block.tsx`**

```tsx
import { useStore } from '@/lib/store';

export function TransactionsBlock({ ids }: { ids: string[] }) {
  const { transactions } = useStore();
  const items = ids.map((id) => transactions.find((t) => t.id === id)).filter(Boolean) as typeof transactions;
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-background/40 backdrop-blur-md">
      {items.map((t) => (
        <div key={t.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2 text-[12.5px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t.id}</span>
          <span>{t.customer} · {t.listing}</span>
          <span className="font-medium">{t.amount}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{t.status}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `events-block.tsx`**

```tsx
import { useStore } from '@/lib/store';
import { Calendar } from 'lucide-react';

export function EventsBlock({ ids }: { ids: string[] }) {
  const { events } = useStore();
  const items = ids.map((id) => events.find((e) => e.id === id)).filter(Boolean) as typeof events;
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 backdrop-blur-md">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground w-12">{e.day} {e.time}</span>
          <span className="text-[12.5px] flex-1">{e.title}</span>
          {e.loc && <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{e.loc}</span>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: `stat-block.tsx`**

```tsx
interface Props {
  label: string;
  value: string;
  delta?: string;
}

export function StatBlock({ label, value, delta }: Props) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur-md min-w-[120px]">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <span className="font-serif text-2xl font-light leading-none tracking-tight">{value}</span>
      {delta && <span className="text-[11px] text-muted-foreground">{delta}</span>}
    </div>
  );
}
```

- [ ] **Step 7: `chart-block.tsx`**

```tsx
import { MiniChart } from '@/components/ui/mini-chart';
import type { AssistantBlock } from '@/lib/assistant/types';

type ChartBlockData = Extract<AssistantBlock, { kind: 'chart' }>;

export function ChartBlock({ chart, data, caption }: ChartBlockData) {
  // Şimdilik tüm chart tipleri MiniChart ile render — daha sonra line/funnel eklenebilir.
  void chart;
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur-md">
      <MiniChart label={caption ?? 'Trend'} data={data} />
    </div>
  );
}
```

- [ ] **Step 8: `suggest-block.tsx`**

```tsx
interface Props {
  chips: string[];
  onPick: (chip: string) => void;
}

export function SuggestBlock({ chips, onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          type="button"
          key={chip}
          onClick={() => onPick(chip)}
          className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-stone-700/40 dark:hover:border-stone-300/40 hover:text-foreground"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: `index.ts` dispatcher**

```tsx
import type { AssistantBlock } from '@/lib/assistant/types';
import { TextBlock } from './text-block';
import { ListingsBlock } from './listings-block';
import { CustomersBlock } from './customers-block';
import { TransactionsBlock } from './transactions-block';
import { EventsBlock } from './events-block';
import { StatBlock } from './stat-block';
import { ChartBlock } from './chart-block';
import { SuggestBlock } from './suggest-block';

interface Props {
  block: AssistantBlock;
  onSuggest?: (chip: string) => void;
  onNavigate?: (target: 'listings' | 'customers') => void;
}

export function BlockRenderer({ block, onSuggest, onNavigate }: Props) {
  switch (block.kind) {
    case 'text':
      return <TextBlock text={block.text} />;
    case 'listings':
      return <ListingsBlock ids={block.ids} onNavigate={() => onNavigate?.('listings')} />;
    case 'customers':
      return <CustomersBlock ids={block.ids} onNavigate={() => onNavigate?.('customers')} />;
    case 'transactions':
      return <TransactionsBlock ids={block.ids} />;
    case 'events':
      return <EventsBlock ids={block.ids} />;
    case 'stat':
      return <StatBlock label={block.label} value={block.value} delta={block.delta} />;
    case 'chart':
      return <ChartBlock kind={block.kind} chart={block.chart} data={block.data} caption={block.caption} />;
    case 'suggest':
      return <SuggestBlock chips={block.chips} onPick={(c) => onSuggest?.(c)} />;
  }
}
```

- [ ] **Step 10: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 10: Chat mesaj, thread ve composer

**Files:**
- Create: `src/components/ui/assistant/chat-message.tsx`
- Create: `src/components/ui/assistant/chat-thread.tsx`
- Create: `src/components/ui/assistant/chat-composer.tsx`

- [ ] **Step 1: `chat-message.tsx`**

```tsx
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockRenderer } from './assistant-blocks';
import type { AssistantChatMessage } from '@/lib/store';

interface Props {
  message: AssistantChatMessage;
  onSuggest: (chip: string) => void;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function ChatMessage({ message, onSuggest, onNavigate }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2 text-[13px] leading-relaxed text-background">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur-md">
        <Sparkles className="h-3 w-3 text-stone-700 dark:text-stone-300" />
      </div>
      <div className={cn('flex flex-1 flex-col gap-2 max-w-[88%]')}>
        {message.text && <p className="text-[13.5px] leading-relaxed">{message.text}</p>}
        {message.blocks?.map((block, i) => (
          <BlockRenderer key={i} block={block} onSuggest={onSuggest} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `chat-thread.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { ChatMessage } from './chat-message';
import type { AssistantChatMessage } from '@/lib/store';

interface Props {
  messages: AssistantChatMessage[];
  isThinking: boolean;
  onSuggest: (chip: string) => void;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function ChatThread({ messages, isThinking, onSuggest, onNavigate }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isThinking]);

  return (
    <div role="log" aria-live="polite" className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} onSuggest={onSuggest} onNavigate={onNavigate} />
      ))}
      {isThinking && (
        <div className="flex gap-2.5">
          <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-stone-700 dark:text-stone-300" />
          </div>
          <div className="flex items-center gap-1 px-1 py-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 3: `chat-composer.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  initialText?: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
}

export function ChatComposer({ initialText = '', onSubmit, autoFocus = true }: Props) {
  const [value, setValue] = useState(initialText);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setValue(initialText);
  }, [initialText]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 border-t border-border/60 bg-background/50 px-4 py-3 backdrop-blur-md"
    >
      <Sparkles className="mt-2.5 h-4 w-4 flex-none text-stone-800 dark:text-stone-200" />
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Asistan'a sor…"
        aria-label="Asistan'a sor"
        className="flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      <kbd className="mb-2 hidden flex-none rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-block">
        ⌘ ↵
      </kbd>
      <button
        type="submit"
        aria-label="Gönder"
        className="mb-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 11: Sidebar (sohbet geçmişi paneli)

**Files:**
- Create: `src/components/ui/assistant/chat-sidebar.tsx`

- [ ] **Step 1: Sidebar yaz**

```tsx
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssistantSession } from '@/lib/store';

interface Props {
  sessions: AssistantSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isYesterday(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function groupSessions(sessions: AssistantSession[]) {
  const today: AssistantSession[] = [];
  const yesterday: AssistantSession[] = [];
  const earlier: AssistantSession[] = [];
  const sorted = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const s of sorted) {
    const d = new Date(s.updatedAt);
    if (isToday(d)) today.push(s);
    else if (isYesterday(d)) yesterday.push(s);
    else earlier.push(s);
  }
  return { today, yesterday, earlier };
}

export function ChatSidebar({ sessions, activeId, onSelect, onCreate, onDelete }: Props) {
  const groups = groupSessions(sessions);
  return (
    <nav
      aria-label="Sohbet geçmişi"
      className="flex h-full w-[220px] flex-none flex-col border-r border-border/60 bg-background/30 backdrop-blur-md"
    >
      <div className="border-b border-border/60 p-3">
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[12px] transition-colors hover:bg-background/80"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni sohbet
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 && (
          <div className="px-2 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Geçmiş yok
          </div>
        )}
        {(['today', 'yesterday', 'earlier'] as const).map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          const label = key === 'today' ? 'Bugün' : key === 'yesterday' ? 'Dün' : 'Önceki';
          return (
            <div key={key} className="mb-3">
              <div className="px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </div>
              <ul className="flex flex-col gap-0.5">
                {items.map((s) => (
                  <li key={s.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors',
                        s.id === activeId
                          ? 'bg-foreground/10 text-foreground'
                          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                      )}
                    >
                      <span className="flex-1 truncate">{s.title}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Sil"
                      onClick={() => onDelete(s.id)}
                      className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground group-hover:flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 12: Chat ekran (sidebar + thread + composer)

**Files:**
- Create: `src/components/ui/assistant/assistant-chat-screen.tsx`

- [ ] **Step 1: Chat screen yaz**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { classify } from '@/lib/assistant/engine';
import type { StoreSnapshot } from '@/lib/assistant/intents';
import { replies } from '@/lib/assistant/replies';
import { ChatSidebar } from './chat-sidebar';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';

interface Props {
  initialDraft?: string;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function AssistantChatScreen({ initialDraft, onNavigate }: Props) {
  const store = useStore();
  const {
    assistantSessions,
    activeAssistantSessionId,
    profile,
    listings,
    customers,
    transactions,
    events,
    conversations,
    startAssistantSession,
    setActiveAssistantSession,
    appendAssistantMessage,
    deleteAssistantSession,
  } = store;

  const [isThinking, setIsThinking] = useState(false);
  const draftConsumedRef = useRef(false);

  // Aktif session yoksa veya yoksa, oluştur
  useEffect(() => {
    if (!activeAssistantSessionId) {
      const id = startAssistantSession();
      // İlk karşılama mesajı
      const greeting = replies.greeting();
      appendAssistantMessage(id, {
        role: 'assistant',
        text: `Merhaba ${profile.name.split(' ')[0]}, ne arıyoruz?`,
        blocks: [{ kind: 'suggest', chips: greeting.chips }],
        intent: 'greeting',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssistantSessionId]);

  const activeSession = assistantSessions.find((s) => s.id === activeAssistantSessionId);

  const handleSubmit = (text: string) => {
    if (!activeAssistantSessionId) return;
    const sid = activeAssistantSessionId;
    appendAssistantMessage(sid, { role: 'user', text });
    setIsThinking(true);

    const snapshot: StoreSnapshot = { listings, customers, transactions, events, conversations };
    const delay = 350 + Math.random() * 350;
    window.setTimeout(() => {
      const response = classify(text, snapshot);
      appendAssistantMessage(sid, {
        role: 'assistant',
        text: response.text,
        blocks: response.blocks,
        intent: response.intent,
      });
      setIsThinking(false);
    }, delay);
  };

  const handleSuggest = (chip: string) => {
    handleSubmit(chip);
  };

  const handleCreate = () => {
    const id = startAssistantSession();
    const greeting = replies.greeting();
    appendAssistantMessage(id, {
      role: 'assistant',
      text: `Merhaba ${profile.name.split(' ')[0]}, ne arıyoruz?`,
      blocks: [{ kind: 'suggest', chips: greeting.chips }],
      intent: 'greeting',
    });
  };

  // Initial draft'ı sadece bir kez tüket
  const draftToShow = !draftConsumedRef.current ? initialDraft : '';
  useEffect(() => {
    if (initialDraft) draftConsumedRef.current = true;
  }, [initialDraft]);

  return (
    <div className="flex h-full">
      <ChatSidebar
        sessions={assistantSessions}
        activeId={activeAssistantSessionId}
        onSelect={setActiveAssistantSession}
        onCreate={handleCreate}
        onDelete={deleteAssistantSession}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatThread
            messages={activeSession?.messages ?? []}
            isThinking={isThinking}
            onSuggest={handleSuggest}
            onNavigate={onNavigate}
          />
        </div>
        <ChatComposer initialText={draftToShow} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 13: Modules ekranını taşı

**Files:**
- Create: `src/components/ui/assistant/assistant-modules-screen.tsx`

- [ ] **Step 1: Modules ekranı bileşenini oluştur**

```tsx
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULES = [
  { title: 'İlanlar', desc: 'Arsa portföyü, yeni ilan ekleme, düzenleme ve pasife alma.', cta: 'İlanları aç', target: 'listings' },
  { title: 'Kategoriler', desc: 'Arsa tipleri, bölgeler, etiketler ve özel filtre setleri.', cta: 'Kategorileri aç', target: 'listings' },
  { title: 'Müşteriler', desc: 'CRM defteri, görüşmeler, kohort analizi ve iletişim geçmişi.', cta: 'CRM defterine git', target: 'customers' },
  { title: 'Finans', desc: 'Satışlar, tahsilat, komisyon, tapu masrafları ve bekleyen ödemeler.', cta: 'Finansı aç', target: 'finance' },
  { title: 'Raporlar', desc: 'Otomatik analiz, haftalık özet, performans ve dışa aktarım.', cta: 'Raporları aç', target: 'reports' },
  { title: 'Ayarlar', desc: 'Ekip, yetkilendirme, entegrasyonlar ve otomasyon kuralları.', cta: 'Ayarları aç', target: 'profile' },
] as const;

interface Props {
  draft: string;
  onDraftChange: (v: string) => void;
  onActivateChat: () => void;
  onPickModule: (target: string) => void;
}

export function AssistantModulesScreen({ draft, onDraftChange, onActivateChat, onPickModule }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <div className="mb-3 flex w-full items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Atölye Modülleri
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            06 modül
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <button
              type="button"
              key={m.title}
              onClick={() => onPickModule(m.target)}
              className="group flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/40 p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:bg-background/70"
            >
              <div className="space-y-1">
                <h3 className="text-[16px] font-semibold leading-tight tracking-tight">{m.title}</h3>
                <p className="text-[12.5px] leading-snug text-muted-foreground">{m.desc}</p>
              </div>
              <span className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-[12.5px] font-medium transition-colors group-hover:bg-foreground group-hover:text-background">
                <ArrowRight className="h-3.5 w-3.5" />
                {m.cta}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn('relative border-t border-border/60 bg-background/50 px-5 py-4 backdrop-blur-md')}>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-background/50 px-3 py-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 flex-none text-stone-800 dark:text-stone-200" />
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              onDraftChange(e.target.value);
              if (e.target.value.length > 0) onActivateChat();
            }}
            onFocus={onActivateChat}
            onClick={onActivateChat}
            placeholder="Bana sor…"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden flex-none rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-block">
            ⌘ K
          </kbd>
          <button
            type="button"
            aria-label="Sohbete geç"
            onClick={onActivateChat}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 14: Modal kabuk + mod yönetimi

**Files:**
- Create: `src/components/ui/assistant/assistant-modal.tsx`

- [ ] **Step 1: Modal yaz**

```tsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { AssistantModulesScreen } from './assistant-modules-screen';
import { AssistantChatScreen } from './assistant-chat-screen';

interface Props {
  open: boolean;
  onClose: () => void;
  onPickModule: (target: string) => void;
}

export function AssistantModal({ open, onClose, onPickModule }: Props) {
  const [mode, setMode] = useState<'modules' | 'chat'>('modules');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) {
      setMode('modules');
      setDraft('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="assistant-backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            key="assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'modules' ? 'Atölye Modülleri' : 'Atölye Asistanı'}
            className="fixed left-1/2 top-1/2 z-50 flex w-[min(1080px,calc(100%-2rem))] h-[min(640px,calc(100%-3rem))] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-2xl backdrop-saturate-150"
            style={{ translateX: '-50%', translateY: '-50%' }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-stone-300/25 dark:bg-stone-700/20 blur-[100px]" />
              <div className="absolute -bottom-[15%] -right-[10%] h-[55%] w-[55%] rounded-full bg-stone-400/20 dark:bg-stone-600/15 blur-[110px]" />
              <div className="absolute right-[20%] top-[5%] h-[30%] w-[30%] rounded-full bg-stone-200/20 dark:bg-stone-800/15 blur-[90px]" />
            </div>

            <div className="relative flex items-end justify-between gap-6 border-b border-border/60 px-7 pb-4 pt-5">
              <div className="flex items-center gap-3">
                {mode === 'chat' && (
                  <button
                    type="button"
                    onClick={() => setMode('modules')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:bg-background/70"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Modüller
                  </button>
                )}
                <div>
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={mode}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="font-serif text-3xl font-light leading-none tracking-tight md:text-[42px]"
                    >
                      {mode === 'modules' ? (
                        <>Nereye <span className="font-medium text-stone-800 dark:text-stone-200">gidelim?</span></>
                      ) : (
                        <>Atölye <span className="font-medium text-stone-800 dark:text-stone-200">asistanı</span></>
                      )}
                    </motion.h1>
                  </AnimatePresence>
                  <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    {mode === 'modules' ? 'Modüller · hızlı erişim · ⌘ K' : 'Yapay zekâ · gerçek verilerinden cevaplar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:bg-background/70"
              >
                <X className="h-3.5 w-3.5" />
                Kapat
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {mode === 'modules' ? (
                <AssistantModulesScreen
                  draft={draft}
                  onDraftChange={setDraft}
                  onActivateChat={() => setMode('chat')}
                  onPickModule={(target) => {
                    onPickModule(target);
                    onClose();
                  }}
                />
              ) : (
                <AssistantChatScreen
                  initialDraft={draft}
                  onNavigate={(target) => {
                    onPickModule(target);
                    onClose();
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

---

## Task 15: `infinite-grid-integration.tsx` cleanup ve modal entegrasyonu

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

- [ ] **Step 1: Eski modal blok'u kaldır**

`src/components/ui/infinite-grid-integration.tsx` dosyasında 600-849 satır arasındaki `<AnimatePresence>` ve içinde modal'ı oluşturan tüm JSX'i sil. Yerine şunu koy:

```tsx
      <AssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onPickModule={(target) => setActiveDock(target)}
      />
```

Aynı dosyanın import bloğuna ekle:

```tsx
import { AssistantModal } from '@/components/ui/assistant/assistant-modal';
```

- [ ] **Step 2: Kullanılmayan state ve sabitleri sil**

Sil:
- `const [assistantMode, setAssistantMode] = useState<'modules' | 'suggestions'>('modules');`
- `const [assistantQuery, setAssistantQuery] = useState('');`
- `useEffect(() => { if (!assistantOpen) { setAssistantMode('modules'); setAssistantQuery(''); }`
- `const assistantModules = [...]`
- `const assistantSuggestions = [...]`
- `const assistantChips = [...]`

`AnimatePresence` ve `motion` import'ları başka yerde de kullanılıyorsa kalır; sadece bu modal'a özgü olanları kaldırma.

- [ ] **Step 3: Kullanılmayan lucide ikonlarını import bloğundan temizle**

`Settings2`, `Sparkles` (artık modal'a taşındı, ana dosyada kullanılıyorsa kalsın) — `eslint`'in işaret ettiği unused olanları sil. Çalıştır:

```bash
npm run lint
```

Beklenen: 0 hata.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Beklenen: 0 hata.

- [ ] **Step 5: Build dene**

```bash
npm run build
```

Beklenen: Build başarılı.

---

## Task 16: Manuel kabul testleri

**Files:** —

- [ ] **Step 1: Dev server başlat**

```bash
npm run dev
```

- [ ] **Step 2: Aşağıdaki senaryoları sırayla doğrula**

1. Modal aç (⌘K veya AI butonu) → "Nereye gidelim?" + 6 modül kartı görünür.
2. Alt input'a tıkla → modal başlığı "Atölye asistanı" olur, sol sidebar + chat görünür. Karşılama mesajı + 4 chip ("Çanakkale deniz manzaralı arsa öner" vb.) görünür.
3. "← Modüller" butonu → modules ekranına geri dönüş; tekrar input'a tıklayınca aynı session devam eder, mesajlar yerinde.
4. "Çanakkale'de deniz manzaralı arsa öner" yaz, gönder → "yazıyor…" sonra asistan mesajında en az 1 listing kartı (ARS-0142 olmalı) + suggest chip'leri.
5. "bu ayki kaparolar" → stat kartları (İşlem sayısı, Toplam tutar) + işlem listesi + mini chart.
6. "Cuma ne var" → events listesi (EV-05, EV-07).
7. "ARS-0142'ye uygun müşteri" → en az 1 customer kartı (Mehmet Kaya — Deniz manzaralı / Muğla ilgisi).
8. Modalı kapat (ESC), tekrar aç, input'a tıkla → aynı session yüklü, tüm mesajlar duruyor.
9. "Yeni sohbet" → boş chat + karşılama; sidebar'da iki entry. Eskine tıkla → eski mesajlar geliyor.
10. Sayfayı yenile → sidebar ve mesajlar kalıcı (`atelier-store-v3` localStorage anahtarında görünüyor).
11. Sidebar'da bir session'a hover → × ikonu beliriyor; tıkla → session siliniyor.
12. Bir listing kartına tıkla → modal kapanıyor ve Listings sayfasına gidiyor.
13. Bir suggest chip'ine tıkla → otomatik gönderiliyor ve cevap geliyor.
14. "asdfgh xyz" gibi çöp metin → unknown intent, yumuşak fallback + öneri chip'leri.

- [ ] **Step 3: Bilinen sorunları not et**

Eğer bir senaryo başarısız olursa, bu plan'a Task 17 olarak follow-up not düş. Aksi halde plan tamamdır.

---

## Tamamlandığında

- `npm test` yeşil (normalize, extractors, engine).
- `npm run build` başarılı.
- Tüm kabul senaryoları çalışıyor.
- Modal'a yapılan değişiklikler `infinite-grid-integration.tsx` boyutunu ~900 satırdan ~600 satıra düşürmüş olmalı.
