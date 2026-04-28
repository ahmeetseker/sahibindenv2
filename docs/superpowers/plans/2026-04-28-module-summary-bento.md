# Module Summary Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AssistantModal'dan modül seçimi sonrası, asıl sayfaya geçmeden önce 4-kartlı bento summary ekranı (deep-link özelliği ile) gösteren `ModuleSummary` sistemini kur.

**Architecture:** Yeni `module-summary` komponenti `infinite-grid-integration.tsx`'te `activeSummary` state'iyle yönetilir. Modal `onPickModule(entryId)` ile entry id geçirir; summary açılır; kartlar `pageDeepLink` set edip `setActiveDock(target)` çağırır. Sayfalar opsiyonel `initial?: DeepLink` prop ile mount'ta consume eder, `key` prop'u ile re-mount sağlanır.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, framer-motion (mevcut), Vitest + Testing Library (mevcut), `lucide-react` ikonları (mevcut).

**Spec referansı:** `docs/superpowers/specs/2026-04-28-module-summary-bento-design.md`

---

## File Structure

**Yeni dosyalar:**
- `src/components/ui/module-summary/types.ts` — `SummaryEntryId`, `DeepLink` union, `SummaryCard` ve `SummaryEntry` interfaceleri
- `src/components/ui/module-summary/summary-data.ts` — `useStore` üzerinden derived selectorlar (counts, top items, distributions)
- `src/components/ui/module-summary/summary-config.ts` — 6 entry × 4 kart static configuration
- `src/components/ui/module-summary/bento-card.tsx` — 5 variant (`kpi`, `chart`, `list`, `distribution`, `shortcut`) içeren tek dosya
- `src/components/ui/module-summary/module-summary.tsx` — header + bento grid orkestratör
- `src/components/ui/module-summary/__tests__/summary-config.test.ts` — config validity testi
- `src/components/ui/module-summary/__tests__/module-summary.test.tsx` — komponent davranış testi

**Değişen dosyalar:**
- `src/components/ui/assistant/assistant-modules-screen.tsx` — `MODULES` listesinde `target` → `entryId`, `onPickModule` signature
- `src/components/ui/assistant/assistant-modal.tsx` — `onPickModule` signature
- `src/components/ui/infinite-grid-integration.tsx` — `activeSummary` + `pageDeepLink` state, render branch
- `src/components/pages/listings.tsx` — opsiyonel `initial?: ListingsDeepLink` prop
- `src/components/pages/customers.tsx` — opsiyonel `initial?: CustomersDeepLink` prop
- `src/components/pages/finance.tsx` — opsiyonel `initial?: FinanceDeepLink` prop
- `src/components/pages/reports.tsx` — opsiyonel `initial?: ReportsDeepLink` prop
- `src/components/pages/profile.tsx` — opsiyonel `initial?: ProfileDeepLink` prop

---

## Task 1: Tip tanımlamaları

**Files:**
- Create: `src/components/ui/module-summary/types.ts`

- [ ] **Step 1: types.ts dosyasını yaz**

```ts
import type { LucideIcon } from "lucide-react";
import type {
  CustomerSegment,
  CustomerStage,
  ListingStatus,
  TransactionStatus,
} from "@/lib/store";

export type SummaryEntryId =
  | "listings"
  | "categories"
  | "customers"
  | "finance"
  | "reports"
  | "profile";

export type PageTarget =
  | "listings"
  | "customers"
  | "finance"
  | "reports"
  | "profile";

export type ListingsDeepLink = {
  view?: "table" | "map";
  filter?: "Tümü" | ListingStatus;
  tag?: string;
  sort?: "views";
};

export type CustomersDeepLink = {
  filter?: "Tümü" | CustomerSegment;
  stage?: CustomerStage;
};

export type FinanceDeepLink = {
  status?: TransactionStatus;
};

export type ReportsDeepLink = {
  tab?: "Performans" | "Satış" | "Müşteri" | "Bölge";
};

export type ProfileDeepLink = {
  shortcut?:
    | "general"
    | "team"
    | "workshop"
    | "integration"
    | "security"
    | "notifications";
};

export type DeepLink =
  | ListingsDeepLink
  | CustomersDeepLink
  | FinanceDeepLink
  | ReportsDeepLink
  | ProfileDeepLink;

export type BentoSlot = "hero" | "kpi-tall" | "mini-a" | "mini-b";

export interface KpiCardData {
  type: "kpi";
  bigValue: string;
  delta?: { tone: "positive" | "neutral" | "negative"; text: string };
  contextLine?: string;
}

export interface ChartCardData {
  type: "chart";
  data: Array<{ label: string; value: number }>;
  unit?: string;
}

export interface ListCardData {
  type: "list";
  items: Array<{
    leading?: string;
    title: string;
    trailing?: string;
    pill?: { text: string; tone: "neutral" | "success" | "warning" };
  }>;
}

export interface DistributionCardData {
  type: "distribution";
  rows: Array<{ label: string; value: number; percent: number }>;
}

export interface ShortcutCardData {
  type: "shortcut";
  icon: LucideIcon;
  primary: string;
  secondary?: string;
}

export type CardData =
  | KpiCardData
  | ChartCardData
  | ListCardData
  | DistributionCardData
  | ShortcutCardData;

export interface SummaryCard {
  slot: BentoSlot;
  title: { lead: string; accent: string };
  meta?: string;
  deepLink: DeepLink;
  data: CardData;
}

export interface SummaryEntry {
  id: SummaryEntryId;
  target: PageTarget;
  header: {
    title: { lead: string; accent: string };
    meta: string;
  };
  cards: SummaryCard[];
}

export type SummaryEntries = Record<SummaryEntryId, SummaryEntry>;
```

- [ ] **Step 2: TypeScript build doğrula**

Run: `npm run build`
Expected: PASS (sadece type check, henüz import edilmiyor)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/types.ts
git commit -m "feat: add module summary type definitions"
```

---

## Task 2: Derived selector hook'ları

**Files:**
- Create: `src/components/ui/module-summary/summary-data.ts`

- [ ] **Step 1: summary-data.ts'yi yaz**

```ts
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { ListCardData, DistributionCardData, ChartCardData } from "./types";

const MONTHS_TR = [
  "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ",
  "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA",
];

function deterministicSeries(seed: number, len = 12, min = 4, max = 20): number[] {
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    out.push(Math.round(min + r * (max - min)));
  }
  return out;
}

export function useListingsSummaryData() {
  const { listings } = useStore();
  return useMemo(() => {
    const counts = {
      all: listings.length,
      aktif: listings.filter((l) => l.status === "Aktif").length,
      taslak: listings.filter((l) => l.status === "Taslak").length,
      pasif: listings.filter((l) => l.status === "Pasif").length,
    };
    const topByViews = [...listings]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
    const distinctTags = Array.from(
      new Set(listings.map((l) => l.tag).filter((t): t is string => Boolean(t))),
    );
    const series = deterministicSeries(listings.length || 1, 12, 6, 22);
    const chart: ChartCardData = {
      type: "chart",
      data: MONTHS_TR.map((m, i) => ({ label: m, value: series[i] })),
    };
    const distribution: DistributionCardData = {
      type: "distribution",
      rows: (() => {
        const total = listings.length || 1;
        const groups = ["İmarlı", "Villa imarlı", "Tarla", "Zeytinlik"];
        // Basit: tag içerik kontrolüyle gruplama; bulunmayanlara fallback dağılım
        const counts = groups.map((g) => {
          const count = listings.filter((l) =>
            (l.tag ?? "").toLowerCase().includes(g.toLowerCase()),
          ).length;
          return count > 0 ? count : Math.max(1, Math.round(total / groups.length));
        });
        const sum = counts.reduce((a, b) => a + b, 0);
        return groups.map((label, i) => ({
          label,
          value: counts[i],
          percent: Math.round((counts[i] / sum) * 100),
        }));
      })(),
    };
    const topList: ListCardData = {
      type: "list",
      items: topByViews.map((l) => ({
        leading: l.id,
        title: l.loc,
        trailing: `${l.views}`,
      })),
    };
    return { counts, topByViews, distinctTags, chart, distribution, topList };
  }, [listings]);
}

export function useCustomersSummaryData() {
  const { customers } = useStore();
  return useMemo(() => {
    const counts = {
      all: customers.length,
      sicak: customers.filter((c) => c.segment === "Sıcak").length,
      ilik: customers.filter((c) => c.segment === "Ilık").length,
      soguk: customers.filter((c) => c.segment === "Soğuk").length,
    };
    const stages: Array<"İlk temas" | "Görüşme" | "Teklif" | "Kaparo"> = [
      "İlk temas", "Görüşme", "Teklif", "Kaparo",
    ];
    const stageCounts = stages.map(
      (s) => customers.filter((c) => c.stage === s).length || 1,
    );
    const stageSum = stageCounts.reduce((a, b) => a + b, 0);
    const distribution: DistributionCardData = {
      type: "distribution",
      rows: stages.map((label, i) => ({
        label,
        value: stageCounts[i],
        percent: Math.round((stageCounts[i] / stageSum) * 100),
      })),
    };
    const sicakList: ListCardData = {
      type: "list",
      items: customers
        .filter((c) => c.segment === "Sıcak")
        .slice(0, 3)
        .map((c) => ({
          leading: c.stage,
          title: c.name,
          trailing: c.budget,
        })),
    };
    const series = deterministicSeries(customers.length || 1, 12, 4, 18);
    const chart: ChartCardData = {
      type: "chart",
      data: MONTHS_TR.map((m, i) => ({ label: m, value: series[i] })),
    };
    return { counts, distribution, sicakList, chart };
  }, [customers]);
}

export function useFinanceSummaryData() {
  const { transactions } = useStore();
  return useMemo(() => {
    const closed = transactions.filter((t) => t.status === "Tapu tamam").length;
    const pending = transactions.filter((t) => t.status !== "Tapu tamam");
    const series = deterministicSeries(transactions.length || 1, 12, 8, 28);
    const chart: ChartCardData = {
      type: "chart",
      data: MONTHS_TR.map((m, i) => ({ label: m, value: series[i] })),
      unit: "₺M",
    };
    const distribution: DistributionCardData = {
      type: "distribution",
      rows: [
        { label: "Havale / EFT", value: 142, percent: 71 },
        { label: "Nakit", value: 34, percent: 17 },
        { label: "Kredi", value: 19, percent: 10 },
        { label: "Takas", value: 4, percent: 2 },
      ],
    };
    const pendingList: ListCardData = {
      type: "list",
      items: pending.slice(0, 3).map((t) => ({
        leading: t.status,
        title: t.customer,
        trailing: t.amount,
      })),
    };
    return { closed, pending: pending.length, chart, distribution, pendingList };
  }, [transactions]);
}
```

- [ ] **Step 2: TypeScript build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/summary-data.ts
git commit -m "feat: add derived selectors for module summary data"
```

---

## Task 3: Static config — listings & categories

**Files:**
- Create: `src/components/ui/module-summary/summary-config.ts`

- [ ] **Step 1: summary-config.ts iskeletini ve listings + categories entry'lerini yaz**

```ts
import { Layers, Lock, Settings as SettingsIcon } from "lucide-react";
import type { SummaryEntries, SummaryEntry } from "./types";

const listings: SummaryEntry = {
  id: "listings",
  target: "listings",
  header: {
    title: { lead: "Arsa", accent: "portföyü" },
    meta: "AKTİF İLAN AKIŞI · 8 YENİ BU HAFTA",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Görüntülenme", accent: "akışı" },
      meta: "SON 12 AY · TÜM İLANLAR",
      deepLink: { view: "table" },
      data: { type: "chart", data: [] }, // runtime'da useListingsSummaryData ile dolar
    },
    {
      slot: "kpi-tall",
      title: { lead: "Aktif", accent: "ilan" },
      meta: "TOPLAM",
      deepLink: { filter: "Aktif" },
      data: {
        type: "kpi",
        bigValue: "0",
        delta: { tone: "positive", text: "▲ 8 YENİ BU HAFTA" },
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Stok", accent: "dağılımı" },
      meta: "TİPE GÖRE",
      deepLink: { view: "table" },
      data: { type: "distribution", rows: [] },
    },
    {
      slot: "mini-b",
      title: { lead: "Öne çıkan", accent: "arsalar" },
      meta: "SON 7 GÜN",
      deepLink: { view: "table", sort: "views" },
      data: { type: "list", items: [] },
    },
  ],
};

const categories: SummaryEntry = {
  id: "categories",
  target: "listings",
  header: {
    title: { lead: "Kategori", accent: "atlası" },
    meta: "ARSA TİPİ · BÖLGE · ETİKET",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Bölgesel", accent: "yoğunluk" },
      meta: "İLÇEYE GÖRE İLAN SAYISI",
      deepLink: { view: "map" },
      data: {
        type: "chart",
        data: [
          { label: "Ayv", value: 14 },
          { label: "Dat", value: 11 },
          { label: "Cun", value: 9 },
          { label: "Sök", value: 7 },
          { label: "Ala", value: 6 },
        ],
      },
    },
    {
      slot: "kpi-tall",
      title: { lead: "Tip", accent: "sayısı" },
      meta: "AKTİF KATEGORİ",
      deepLink: { view: "table" },
      data: {
        type: "kpi",
        bigValue: "4",
        contextLine: "İMARLI · TARLA · VİLLA · ZEYTİNLİK",
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Etiket", accent: "bulutu" },
      meta: "EN POPÜLER 5",
      deepLink: { view: "table" },
      data: {
        type: "list",
        items: [
          { title: "deniz manzaralı", trailing: "23" },
          { title: "koy önü", trailing: "14" },
          { title: "yola cephe", trailing: "11" },
          { title: "zeytinlik", trailing: "9" },
          { title: "merkez", trailing: "8" },
        ],
      },
    },
    {
      slot: "mini-b",
      title: { lead: "Filtre", accent: "setleri" },
      meta: "KAYITLI",
      deepLink: { view: "table", filter: "Taslak" },
      data: {
        type: "shortcut",
        icon: Layers,
        primary: "Sahil arsaları · Yatırımlık taslaklar",
        secondary: "2 önset",
      },
    },
  ],
};

// İleride eklenecek: customers, finance, reports, profile
export const SUMMARY_ENTRIES: SummaryEntries = {
  listings,
  categories,
  customers: undefined as unknown as SummaryEntry,
  finance: undefined as unknown as SummaryEntry,
  reports: undefined as unknown as SummaryEntry,
  profile: undefined as unknown as SummaryEntry,
};

// Yardımcı: ileride kart override'ı için (runtime data injection)
export function withRuntimeData<T extends SummaryEntry>(
  entry: T,
  overrides: Partial<Record<T["cards"][number]["slot"], Partial<T["cards"][number]["data"]>>>,
): T {
  return {
    ...entry,
    cards: entry.cards.map((c) =>
      overrides[c.slot]
        ? ({ ...c, data: { ...c.data, ...overrides[c.slot] } as T["cards"][number]["data"] })
        : c,
    ),
  } as T;
}

// Lock & SettingsIcon importları profile entry'si eklendiğinde kullanılacak
void Lock; void SettingsIcon;
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/summary-config.ts
git commit -m "feat: add summary config skeleton with listings and categories"
```

---

## Task 4: Static config — customers, finance, reports, profile

**Files:**
- Modify: `src/components/ui/module-summary/summary-config.ts`

- [ ] **Step 1: customers, finance, reports, profile entry'lerini ekle**

`SUMMARY_ENTRIES` objesinden hemen önce şu sabit `SummaryEntry` tanımlarını ekle:

```ts
const customers: SummaryEntry = {
  id: "customers",
  target: "customers",
  header: {
    title: { lead: "Müşteri", accent: "defteri" },
    meta: "KAYITLI MÜŞTERİ · CRM ENTEGRE",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Yeni kayıt", accent: "akışı" },
      meta: "AYLIK · SON 12 AY",
      deepLink: { filter: "Tümü" },
      data: { type: "chart", data: [] },
    },
    {
      slot: "kpi-tall",
      title: { lead: "Kayıtlı", accent: "müşteri" },
      meta: "TOPLAM",
      deepLink: { filter: "Tümü" },
      data: {
        type: "kpi",
        bigValue: "0",
        delta: { tone: "positive", text: "▲ 184 SON 30 GÜN" },
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Aktif", accent: "görüşmeler" },
      meta: "AŞAMAYA GÖRE",
      deepLink: { stage: "İlk temas" },
      data: { type: "distribution", rows: [] },
    },
    {
      slot: "mini-b",
      title: { lead: "Sıcak", accent: "müşteriler" },
      meta: "EN YAKIN 3",
      deepLink: { filter: "Sıcak" },
      data: { type: "list", items: [] },
    },
  ],
};

const finance: SummaryEntry = {
  id: "finance",
  target: "finance",
  header: {
    title: { lead: "Finans &", accent: "Ciro" },
    meta: "SON 12 AY · OTOMATİK SENKRON",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Yıllık", accent: "ciro" },
      meta: "₺ MİLYON · KDV HARİÇ",
      deepLink: {},
      data: { type: "chart", data: [], unit: "₺M" },
    },
    {
      slot: "kpi-tall",
      title: { lead: "Portföy", accent: "değeri" },
      meta: "GÜNCEL",
      deepLink: {},
      data: {
        type: "kpi",
        bigValue: "₺24.8M",
        delta: { tone: "positive", text: "▲ 12.4% GEÇEN YILA GÖRE" },
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Ödeme", accent: "yöntemi" },
      meta: "12 AY KÜMÜLATİF",
      deepLink: {},
      data: { type: "distribution", rows: [] },
    },
    {
      slot: "mini-b",
      title: { lead: "Bekleyen", accent: "ödemeler" },
      meta: "TAPU SÜRECİNDE",
      deepLink: { status: "Kaparo" },
      data: { type: "list", items: [] },
    },
  ],
};

const reports: SummaryEntry = {
  id: "reports",
  target: "reports",
  header: {
    title: { lead: "Rapor", accent: "atölyesi" },
    meta: "24 OTOMATİK RAPOR · 5 BUGÜN",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Son üretilen", accent: "raporlar" },
      meta: "OTOMATİK · 7 GÜN",
      deepLink: { tab: "Performans" },
      data: {
        type: "list",
        items: [
          { leading: "14:00", title: "Haftalık satış özeti · Çeyrek 2", pill: { text: "PDF", tone: "neutral" } },
          { leading: "12:30", title: "Bölge karşılaştırma · Nisan", pill: { text: "XLSX", tone: "neutral" } },
          { leading: "09:15", title: "Müşteri kohortu · Q1 2026", pill: { text: "PDF", tone: "neutral" } },
          { leading: "08:00", title: "Günlük özet · Tuna'ya", pill: { text: "E-POSTA", tone: "success" } },
        ],
      },
    },
    {
      slot: "kpi-tall",
      title: { lead: "Üretilen", accent: "rapor" },
      meta: "TOPLAM · 30 GÜN",
      deepLink: { tab: "Performans" },
      data: {
        type: "kpi",
        bigValue: "142",
        delta: { tone: "positive", text: "▲ 24 YENİ BU HAFTA" },
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Aktif", accent: "zamanlayıcı" },
      meta: "OTOMASYON",
      deepLink: { tab: "Satış" },
      data: {
        type: "list",
        items: [
          { leading: "08:00", title: "Günlük", trailing: "özet" },
          { leading: "Cmt-Paz", title: "Hafta sonu", trailing: "PDF" },
          { leading: "Aylık", title: "1.'i", trailing: "finans" },
        ],
      },
    },
    {
      slot: "mini-b",
      title: { lead: "Rapor", accent: "tipleri" },
      meta: "DAĞILIM",
      deepLink: { tab: "Müşteri" },
      data: {
        type: "distribution",
        rows: [
          { label: "Performans", value: 56, percent: 39 },
          { label: "Satış", value: 38, percent: 27 },
          { label: "Müşteri", value: 28, percent: 20 },
          { label: "Bölge", value: 20, percent: 14 },
        ],
      },
    },
  ],
};

const profile: SummaryEntry = {
  id: "profile",
  target: "profile",
  header: {
    title: { lead: "Atölye", accent: "ayarları" },
    meta: "9 ENTEGRASYON · TÜMÜ SAĞLIKLI",
  },
  cards: [
    {
      slot: "hero",
      title: { lead: "Bağlı", accent: "servisler" },
      meta: "ENTEGRASYONLAR",
      deepLink: { shortcut: "integration" },
      data: {
        type: "list",
        items: [
          { title: "Tapu Kadastro API", pill: { text: "canlı", tone: "success" } },
          { title: "Sahibinden.com", pill: { text: "canlı", tone: "success" } },
          { title: "Hepsiemlak", pill: { text: "canlı", tone: "success" } },
          { title: "E-Devlet bağlantısı", pill: { text: "canlı", tone: "success" } },
          { title: "WhatsApp Business", pill: { text: "canlı", tone: "success" } },
        ],
      },
    },
    {
      slot: "kpi-tall",
      title: { lead: "Aktif", accent: "kural" },
      meta: "OTOMASYON",
      deepLink: { shortcut: "general" },
      data: {
        type: "kpi",
        bigValue: "14",
        delta: { tone: "positive", text: "▲ 3 YENİ BU AY" },
      },
    },
    {
      slot: "mini-a",
      title: { lead: "Aktif", accent: "kullanıcı" },
      meta: "EKİP",
      deepLink: { shortcut: "team" },
      data: {
        type: "distribution",
        rows: [
          { label: "Yönetici", value: 2, percent: 20 },
          { label: "Emlakçı", value: 5, percent: 50 },
          { label: "Destek", value: 3, percent: 30 },
        ],
      },
    },
    {
      slot: "mini-b",
      title: { lead: "Güvenlik &", accent: "oturumlar" },
      meta: "SON 7 GÜN",
      deepLink: { shortcut: "security" },
      data: {
        type: "shortcut",
        icon: Lock,
        primary: "3 cihaz aktif",
        secondary: "Bu cihaz · Chrome / macOS",
      },
    },
  ],
};
```

Sonra `SUMMARY_ENTRIES` objesini güncelle ve dosya sonundaki `void Lock; void SettingsIcon;` satırını **sil**:

```ts
export const SUMMARY_ENTRIES: SummaryEntries = {
  listings,
  categories,
  customers,
  finance,
  reports,
  profile,
};
```

(SettingsIcon import'u kullanılmıyorsa import satırından çıkar; sadece `Layers, Lock` kalır.)

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS (unused import yok)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/summary-config.ts
git commit -m "feat: complete summary config for all 6 entries"
```

---

## Task 5: Config validation testi

**Files:**
- Create: `src/components/ui/module-summary/__tests__/summary-config.test.ts`

- [ ] **Step 1: Failing test'i yaz**

```ts
import { describe, it, expect } from "vitest";
import { SUMMARY_ENTRIES } from "../summary-config";
import type { SummaryEntryId, BentoSlot } from "../types";

const ENTRY_IDS: SummaryEntryId[] = [
  "listings",
  "categories",
  "customers",
  "finance",
  "reports",
  "profile",
];
const REQUIRED_SLOTS: BentoSlot[] = ["hero", "kpi-tall", "mini-a", "mini-b"];

describe("SUMMARY_ENTRIES", () => {
  it.each(ENTRY_IDS)("entry '%s' tüm 4 slotu içerir", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(entry).toBeDefined();
    const slots = entry.cards.map((c) => c.slot).sort();
    expect(slots).toEqual([...REQUIRED_SLOTS].sort());
  });

  it.each(ENTRY_IDS)("entry '%s' valid target'a sahip", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(["listings", "customers", "finance", "reports", "profile"]).toContain(
      entry.target,
    );
  });

  it.each(ENTRY_IDS)("entry '%s' header.title doluysa accent boş değil", (id) => {
    const entry = SUMMARY_ENTRIES[id];
    expect(entry.header.title.lead.length).toBeGreaterThan(0);
    expect(entry.header.title.accent.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Test'i çalıştır**

Run: `npx vitest run src/components/ui/module-summary/__tests__/summary-config.test.ts`
Expected: PASS (tüm 18 case)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/__tests__/summary-config.test.ts
git commit -m "test: add summary config validation"
```

---

## Task 6: BentoCard wrapper + KPI/Distribution variantları

**Files:**
- Create: `src/components/ui/module-summary/bento-card.tsx`

- [ ] **Step 1: bento-card.tsx KPI + Distribution variantlarını yaz**

```tsx
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MiniChart } from "@/components/ui/mini-chart";
import type {
  CardData,
  ChartCardData,
  DistributionCardData,
  KpiCardData,
  ListCardData,
  ShortcutCardData,
  SummaryCard,
} from "./types";

const SLOT_CLASS: Record<SummaryCard["slot"], string> = {
  hero: "slot-hero",
  "kpi-tall": "slot-kpi-tall",
  "mini-a": "slot-mini-a",
  "mini-b": "slot-mini-b",
};

interface BentoCardProps {
  card: SummaryCard;
  index: number;
  onClick: () => void;
}

export function BentoCard({ card, index, onClick }: BentoCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`${card.title.lead} ${card.title.accent} kartı, tıklayınca ilgili görünüme git`}
      className={cn(
        SLOT_CLASS[card.slot],
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/40 bg-background/30 p-5 text-left backdrop-blur-md transition-colors hover:border-border/70 hover:bg-background/45",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500/70" />
          <h3 className="font-serif text-xl font-light tracking-tight">
            {card.title.lead}{" "}
            <span className="font-medium italic">{card.title.accent}</span>
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 flex-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {card.meta && (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {card.meta}
        </p>
      )}
      <div className="mt-auto flex flex-1 flex-col">
        <CardBody data={card.data} />
      </div>
    </motion.button>
  );
}

function CardBody({ data }: { data: CardData }) {
  switch (data.type) {
    case "kpi":
      return <KpiBody data={data} />;
    case "distribution":
      return <DistributionBody data={data} />;
    case "chart":
      return <ChartBody data={data} />;
    case "list":
      return <ListBody data={data} />;
    case "shortcut":
      return <ShortcutBody data={data} />;
  }
}

function KpiBody({ data }: { data: KpiCardData }) {
  const toneClass =
    data.delta?.tone === "positive"
      ? "text-emerald-700 dark:text-emerald-300"
      : data.delta?.tone === "negative"
      ? "text-red-700 dark:text-red-300"
      : "text-muted-foreground";
  return (
    <div className="flex flex-1 flex-col justify-end gap-3">
      <p className="font-serif text-6xl font-light leading-none tabular-nums">
        {data.bigValue}
      </p>
      {data.delta && (
        <p
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em]",
            toneClass,
          )}
        >
          {data.delta.text}
        </p>
      )}
      {data.contextLine && (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {data.contextLine}
        </p>
      )}
    </div>
  );
}

function DistributionBody({ data }: { data: DistributionCardData }) {
  return (
    <ul className="divide-y divide-border/30">
      {data.rows.map((r) => (
        <li
          key={r.label}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="text-foreground/90">{r.label}</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="text-muted-foreground">{r.value}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {r.percent}%
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChartBody({ data: _data }: { data: ChartCardData }) {
  return null; // sonraki task'ta uygulanır
}

function ListBody({ data: _data }: { data: ListCardData }) {
  return null; // sonraki task'ta uygulanır
}

function ShortcutBody({ data: _data }: { data: ShortcutCardData }) {
  return null; // sonraki task'ta uygulanır
}

// Tip referanslarını tutmak için (no-unused import warning'i önler):
void MiniChart;
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/bento-card.tsx
git commit -m "feat: add BentoCard wrapper with KPI and distribution variants"
```

---

## Task 7: BentoCard Chart, List, Shortcut variantları

**Files:**
- Modify: `src/components/ui/module-summary/bento-card.tsx`

- [ ] **Step 1: ChartBody, ListBody, ShortcutBody body'lerini doldur**

`ChartBody` fonksiyonunun gövdesini değiştir:

```tsx
function ChartBody({ data }: { data: ChartCardData }) {
  if (data.data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    );
  }
  return (
    <div className="flex h-full min-h-[120px] flex-1 items-end">
      <MiniChart label="" data={data.data} unit={data.unit} pulseDot={false} />
    </div>
  );
}
```

`ListBody` fonksiyonunun gövdesini değiştir:

```tsx
function ListBody({ data }: { data: ListCardData }) {
  if (data.items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">—</p>
    );
  }
  return (
    <ul className="divide-y divide-border/30">
      {data.items.map((item, i) => (
        <li
          key={`${item.title}-${i}`}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2">
            {item.leading && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {item.leading}
              </span>
            )}
            <span className="truncate">{item.title}</span>
          </span>
          {item.trailing && !item.pill && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums text-muted-foreground">
              {item.trailing}
            </span>
          )}
          {item.pill && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]",
                item.pill.tone === "success"
                  ? "border-emerald-700/30 bg-emerald-700/10 text-emerald-700 dark:text-emerald-300"
                  : item.pill.tone === "warning"
                  ? "border-amber-700/30 bg-amber-700/10 text-amber-700 dark:text-amber-300"
                  : "border-border/60 bg-background/40 text-muted-foreground",
              )}
            >
              {item.pill.text}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

`ShortcutBody` fonksiyonunun gövdesini değiştir:

```tsx
function ShortcutBody({ data }: { data: ShortcutCardData }) {
  const Icon = data.icon;
  return (
    <div className="flex flex-1 flex-col justify-end gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium leading-snug">{data.primary}</p>
        {data.secondary && (
          <p className="mt-0.5 text-xs text-muted-foreground">{data.secondary}</p>
        )}
      </div>
    </div>
  );
}
```

`bento-card.tsx`'in en altındaki `void MiniChart;` satırını **sil**.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/bento-card.tsx
git commit -m "feat: add chart, list, and shortcut variants to BentoCard"
```

---

## Task 8: ModuleSummary container

**Files:**
- Create: `src/components/ui/module-summary/module-summary.tsx`

- [ ] **Step 1: module-summary.tsx'i yaz**

```tsx
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import { SUMMARY_ENTRIES, withRuntimeData } from "./summary-config";
import {
  useCustomersSummaryData,
  useFinanceSummaryData,
  useListingsSummaryData,
} from "./summary-data";
import type { DeepLink, SummaryEntry, SummaryEntryId } from "./types";

interface ModuleSummaryProps {
  entryId: SummaryEntryId;
  onCardClick: (deepLink: DeepLink) => void;
  onPrimary: () => void;
  onClose: () => void;
}

function useResolvedEntry(entryId: SummaryEntryId): SummaryEntry {
  const baseEntry = SUMMARY_ENTRIES[entryId];
  const listings = useListingsSummaryData();
  const customers = useCustomersSummaryData();
  const finance = useFinanceSummaryData();

  return useMemo(() => {
    if (entryId === "listings") {
      return withRuntimeData(baseEntry, {
        hero: listings.chart,
        "kpi-tall": { type: "kpi", bigValue: String(listings.counts.aktif) },
        "mini-a": listings.distribution,
        "mini-b": listings.topList,
      });
    }
    if (entryId === "customers") {
      return withRuntimeData(baseEntry, {
        hero: customers.chart,
        "kpi-tall": { type: "kpi", bigValue: String(customers.counts.all) },
        "mini-a": customers.distribution,
        "mini-b": customers.sicakList,
      });
    }
    if (entryId === "finance") {
      return withRuntimeData(baseEntry, {
        hero: finance.chart,
        "mini-a": finance.distribution,
        "mini-b": finance.pendingList,
      });
    }
    // categories, reports, profile için statik config yeterli
    return baseEntry;
  }, [entryId, baseEntry, listings, customers, finance]);
}

export function ModuleSummary({
  entryId,
  onCardClick,
  onPrimary,
  onClose,
}: ModuleSummaryProps) {
  const entry = useResolvedEntry(entryId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.section
        key={entryId}
        role="region"
        aria-label={`${entry.header.title.lead} ${entry.header.title.accent} özeti`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "absolute inset-0 z-20 flex flex-col gap-6 px-8 py-8 sm:px-12 sm:py-10",
        )}
      >
        <header className="flex items-end justify-between gap-6 border-b border-border/40 pb-5">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500/70" />
              {entry.header.meta}
            </p>
            <h1 className="font-serif text-4xl font-light leading-none tracking-tight md:text-5xl">
              {entry.header.title.lead}{" "}
              <span className="font-medium italic">
                {entry.header.title.accent}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrimary}
              aria-label={`${entry.target} sayfasına git`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-background/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md transition-colors hover:bg-background/50 hover:text-foreground"
            >
              Sayfaya git
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Geri dön (ESC)"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:bg-background/70"
            >
              <ArrowLeft className="h-3 w-3" />
              ESC Geri Dön
            </button>
          </div>
        </header>

        <div className="summary-bento flex-1">
          {entry.cards.map((c, i) => (
            <BentoCard
              key={`${entryId}-${c.slot}`}
              card={c}
              index={i}
              onClick={() => onCardClick(c.deepLink)}
            />
          ))}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: index.css'e bento grid utility'lerini ekle**

`src/index.css` dosyasının sonuna ekle:

```css
.summary-bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 12px;
  min-height: 460px;
  height: calc(100dvh - 240px);
}
.summary-bento .slot-hero      { grid-column: 1 / 9;  grid-row: 1 / 5; }
.summary-bento .slot-kpi-tall  { grid-column: 9 / 13; grid-row: 1 / 7; }
.summary-bento .slot-mini-a    { grid-column: 1 / 5;  grid-row: 5 / 7; }
.summary-bento .slot-mini-b    { grid-column: 5 / 9;  grid-row: 5 / 7; }

@media (max-width: 768px) {
  .summary-bento {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }
  .summary-bento .slot-hero,
  .summary-bento .slot-kpi-tall,
  .summary-bento .slot-mini-a,
  .summary-bento .slot-mini-b {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}
@media (max-height: 460px) {
  .summary-bento { overflow-y: auto; }
}
```

- [ ] **Step 3: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/module-summary/module-summary.tsx src/index.css
git commit -m "feat: add ModuleSummary container with bento grid layout"
```

---

## Task 9: ModuleSummary smoke testi

**Files:**
- Create: `src/components/ui/module-summary/__tests__/module-summary.test.tsx`

- [ ] **Step 1: Failing test'i yaz**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModuleSummary } from "../module-summary";
import { StoreProvider } from "@/lib/store";

function renderWithStore(ui: React.ReactElement) {
  return render(<StoreProvider>{ui}</StoreProvider>);
}

describe("ModuleSummary", () => {
  it("seçili entry için header başlığını render eder", () => {
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Arsa/)).toBeInTheDocument();
    expect(screen.getByText(/portföyü/)).toBeInTheDocument();
  });

  it("4 kart render eder (her slot için 1)", () => {
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    const cards = screen.getAllByRole("button", { name: /kartı/ });
    expect(cards).toHaveLength(4);
  });

  it("kart tıklamasında onCardClick çağrılır ve deepLink iletilir", () => {
    const onCardClick = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={onCardClick}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    const cards = screen.getAllByRole("button", { name: /kartı/ });
    cards[1].click(); // kpi-tall: { filter: "Aktif" }
    expect(onCardClick).toHaveBeenCalledWith({ filter: "Aktif" });
  });

  it("ESC tuşuyla onClose tetiklenir", () => {
    const onClose = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="customers"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Sayfaya git butonu onPrimary çağırır", () => {
    const onPrimary = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="finance"
        onCardClick={() => {}}
        onPrimary={onPrimary}
        onClose={() => {}}
      />,
    );
    screen.getByRole("button", { name: /finance sayfasına git/ }).click();
    expect(onPrimary).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test'i çalıştır**

Run: `npx vitest run src/components/ui/module-summary/__tests__/module-summary.test.tsx`
Expected: PASS (5 case)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/module-summary/__tests__/module-summary.test.tsx
git commit -m "test: add ModuleSummary behavior tests"
```

---

## Task 10: ListingsPage initial prop

**Files:**
- Modify: `src/components/pages/listings.tsx`

- [ ] **Step 1: ListingsPage signature'ını ve state initial'larını güncelle**

`listings.tsx` 58. satır civarındaki `export function ListingsPage()` imzasını ve hemen sonraki state başlatmalarını şu şekilde değiştir:

```tsx
import type { ListingsDeepLink } from "@/components/ui/module-summary/types";

interface ListingsPageProps {
  initial?: ListingsDeepLink | null;
}

export function ListingsPage({ initial }: ListingsPageProps = {}) {
  const {
    listings,
    addListing,
    updateListing,
    deleteListing,
  } = useStore();

  const [filter, setFilter] = useState<"Tümü" | ListingStatus>(
    (initial?.filter as "Tümü" | ListingStatus | undefined) ?? "Tümü",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "map">(initial?.view ?? "table");
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);
```

`filtered` memo'sunda `sort=views` desteği ekle: `useMemo` callback'inin sonuna, `return` öncesi:

```tsx
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = listings.filter((l) => {
      if (filter !== "Tümü" && l.status !== filter) return false;
      if (q) {
        const hay = `${l.id} ${l.loc} ${l.tag ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (initial?.sort === "views") {
      result = [...result].sort((a, b) => b.views - a.views);
    }
    if (initial?.tag) {
      const tag = initial.tag.toLowerCase();
      result = result.filter((l) => (l.tag ?? "").toLowerCase().includes(tag));
    }
    return result;
  }, [listings, filter, query, initial?.sort, initial?.tag]);
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/listings.tsx
git commit -m "feat: ListingsPage accepts initial deep-link prop"
```

---

## Task 11: CustomersPage initial prop

**Files:**
- Modify: `src/components/pages/customers.tsx`

- [ ] **Step 1: CustomersPage'a initial prop ekle**

Mevcut `export function CustomersPage()` fonksiyonunun imzasını değiştir, üstüne import ekle:

```tsx
import type { CustomersDeepLink } from "@/components/ui/module-summary/types";

interface CustomersPageProps {
  initial?: CustomersDeepLink | null;
}

export function CustomersPage({ initial }: CustomersPageProps = {}) {
  // ... mevcut useStore çağrısı
  const [filter, setFilter] = useState<"Tümü" | CustomerSegment>(
    (initial?.filter as "Tümü" | CustomerSegment | undefined) ?? "Tümü",
  );
```

`stage` deep-link'i için: customers.tsx içinde mevcut bir `stage` state yok; sayfanın doğal davranışı ile uyumsuz olduğundan, `stage` belirtilmişse `query` arama kutusunu o stage adıyla doldur (en kolay görsel filtre yansıması):

`useState("")` query satırını şöyle değiştir:

```tsx
const [query, setQuery] = useState(initial?.stage ?? "");
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/customers.tsx
git commit -m "feat: CustomersPage accepts initial deep-link prop"
```

---

## Task 12: FinancePage initial prop

**Files:**
- Modify: `src/components/pages/finance.tsx`

- [ ] **Step 1: FinancePage'a initial prop ekle**

Mevcut `export function FinancePage()` fonksiyonunun imzasını değiştir:

```tsx
import type { FinanceDeepLink } from "@/components/ui/module-summary/types";

interface FinancePageProps {
  initial?: FinanceDeepLink | null;
}

export function FinancePage({ initial }: FinancePageProps = {}) {
```

Mevcut `transactions` listesini render eden bölümde `initial?.status` ile filtre yapılması için bir `useMemo` veya `filtered` benzeri varsa onu güncelle. `finance.tsx`'te mevcut filtreleme yok ise, list render'ında basit shortcut filter ekle:

`return` satırından önce:

```tsx
const visibleTransactions = useMemo(() => {
  if (!initial?.status) return transactions;
  return transactions.filter((t) => t.status === initial.status);
}, [transactions, initial?.status]);
```

Sayfada `transactions.map(...)` çağrılarının olduğu yerde (mevcut `finance.tsx`'i incele), bu çağrıyı `visibleTransactions.map(...)` ile değiştir.

> **Not:** Eğer transaksiyon listesi tek yerde render ediliyorsa o satırı değiştir; birden fazla yerde render varsa hepsini `visibleTransactions` ile değiştir. Mevcut `transactions.map` arama: `grep -n "transactions.map" src/components/pages/finance.tsx`.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/finance.tsx
git commit -m "feat: FinancePage accepts initial deep-link prop"
```

---

## Task 13: ReportsPage initial prop

**Files:**
- Modify: `src/components/pages/reports.tsx`

- [ ] **Step 1: ReportsPage'a initial prop ekle**

`reports.tsx`'in en üstüne import ekle ve `export function ReportsPage()` imzasını değiştir:

```tsx
import type { ReportsDeepLink } from "@/components/ui/module-summary/types";

interface ReportsPageProps {
  initial?: ReportsDeepLink | null;
}

export function ReportsPage({ initial }: ReportsPageProps = {}) {
  const { listings, customers, transactions } = useStore();
  const [tab, setTab] = useState<Tab>(initial?.tab ?? "Performans");
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/reports.tsx
git commit -m "feat: ReportsPage accepts initial deep-link prop"
```

---

## Task 14: ProfilePage initial prop

**Files:**
- Modify: `src/components/pages/profile.tsx`

- [ ] **Step 1: ProfilePage'a initial prop ekle ve shortcut'ı openShortcut'a aktar**

`profile.tsx` üst kısmına import ekle, fonksiyon imzasını değiştir, shortcut id mapping'i:

```tsx
import type { ProfileDeepLink } from "@/components/ui/module-summary/types";
import { PROFILE_SHORTCUT_IDS } from "./profile-shortcuts";

interface ProfilePageProps {
  initial?: ProfileDeepLink | null;
}

export function ProfilePage({ initial }: ProfilePageProps = {}) {
  // ... mevcut state'lerin yanında openShortcut için initial uygula
  const initialShortcutId = initial?.shortcut
    ? PROFILE_SHORTCUT_IDS[initial.shortcut]
    : null;
  const [openShortcut, setOpenShortcut] = useState<ProfileShortcutId | null>(
    initialShortcutId,
  );
```

> **Not:** Mevcut `useState<ProfileShortcutId | null>(null)` satırını yukarıdaki ile değiştir. Diğer state'lere dokunma.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/profile.tsx
git commit -m "feat: ProfilePage accepts initial deep-link prop"
```

---

## Task 15: AssistantModulesScreen entryId'ye geçir

**Files:**
- Modify: `src/components/ui/assistant/assistant-modules-screen.tsx`

- [ ] **Step 1: MODULES tipini ve onPickModule signature'ını güncelle**

Dosyanın tamamını şu hale getir:

```tsx
import { ArrowRight, Sparkles } from 'lucide-react';
import type { SummaryEntryId } from '@/components/ui/module-summary/types';

const MODULES: ReadonlyArray<{
  title: string;
  desc: string;
  cta: string;
  entryId: SummaryEntryId;
}> = [
  { title: 'İlanlar', desc: 'Arsa portföyü, yeni ilan ekleme, düzenleme ve pasife alma.', cta: 'İlanları aç', entryId: 'listings' },
  { title: 'Kategoriler', desc: 'Arsa tipleri, bölgeler, etiketler ve özel filtre setleri.', cta: 'Kategorileri aç', entryId: 'categories' },
  { title: 'Müşteriler', desc: 'CRM defteri, görüşmeler, kohort analizi ve iletişim geçmişi.', cta: 'CRM defterine git', entryId: 'customers' },
  { title: 'Finans', desc: 'Satışlar, tahsilat, komisyon, tapu masrafları ve bekleyen ödemeler.', cta: 'Finansı aç', entryId: 'finance' },
  { title: 'Raporlar', desc: 'Otomatik analiz, haftalık özet, performans ve dışa aktarım.', cta: 'Raporları aç', entryId: 'reports' },
  { title: 'Ayarlar', desc: 'Ekip, yetkilendirme, entegrasyonlar ve otomasyon kuralları.', cta: 'Ayarları aç', entryId: 'profile' },
];

interface Props {
  draft: string;
  onDraftChange: (v: string) => void;
  onActivateChat: () => void;
  onPickModule: (entryId: SummaryEntryId) => void;
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
              onClick={() => onPickModule(m.entryId)}
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

      <div className="relative border-t border-border/60 bg-background/50 px-5 py-4 backdrop-blur-md">
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

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: FAIL — `assistant-modal.tsx` ve `infinite-grid-integration.tsx`'te tip uyumsuzluğu olacak (sıradaki task'larda düzeltilir)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/assistant/assistant-modules-screen.tsx
git commit -m "feat: AssistantModulesScreen passes entryId instead of target"
```

---

## Task 16: AssistantModal signature güncellemesi

**Files:**
- Modify: `src/components/ui/assistant/assistant-modal.tsx`

- [ ] **Step 1: onPickModule signature'ını entryId'ye geçir**

`assistant-modal.tsx`'in 7-11 satırlarındaki `Props` interface'ini değiştir:

```tsx
import type { SummaryEntryId } from '@/components/ui/module-summary/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onPickModule: (entryId: SummaryEntryId) => void;
}
```

`AssistantModulesScreen` çağrısı (122-129 satırları arasında) zaten `onPickModule(target)` → `onPickModule(entryId)` ile uyumlu olur (signature aynı imza). Sadece `AssistantChatScreen` `onNavigate` çağrısına bak:

```tsx
<AssistantChatScreen
  initialDraft={draft}
  onNavigate={(target) => {
    // target string olarak geliyor, valid SummaryEntryId değilse summary atla
    onPickModule(target as SummaryEntryId);
    onClose();
  }}
/>
```

> **Not:** `AssistantChatScreen` chat asistanı içinden navigation tetikliyor; chat'in ürettiği target adlarının SummaryEntryId'lerle eşleşmesi gerekir (`'listings'`, `'customers'` vb.). Mevcut chat navigation'ı zaten bu adları kullanıyor; `'categories'` chat tarafından üretilmediği için sorun yok.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: FAIL — `infinite-grid-integration.tsx`'te tip uyumsuzluğu (sıradaki task'ta çözülür)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/assistant/assistant-modal.tsx
git commit -m "feat: AssistantModal accepts entryId in onPickModule"
```

---

## Task 17: Root entegrasyon — activeSummary state ve render

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

- [ ] **Step 1: Yeni import'ları ekle**

`infinite-grid-integration.tsx`'in mevcut import bloğuna ekle:

```tsx
import { ModuleSummary } from '@/components/ui/module-summary/module-summary';
import { SUMMARY_ENTRIES } from '@/components/ui/module-summary/summary-config';
import type { DeepLink, SummaryEntryId, ListingsDeepLink, CustomersDeepLink, FinanceDeepLink, ReportsDeepLink, ProfileDeepLink } from '@/components/ui/module-summary/types';
```

- [ ] **Step 2: State eklemeleri**

Component fonksiyonu içinde, mevcut `setActiveDock` state'inden hemen sonra ekle:

```tsx
const [activeSummary, setActiveSummary] = useState<SummaryEntryId | null>(null);
const [pageDeepLink, setPageDeepLink] = useState<DeepLink | null>(null);

// Page mount sonrası deep-link consume et (sonraki summary açılışında stale kalmasın)
useEffect(() => {
  if (pageDeepLink === null) return;
  const t = setTimeout(() => setPageDeepLink(null), 0);
  return () => clearTimeout(t);
}, [pageDeepLink]);
```

- [ ] **Step 3: AssistantModal callback'i güncelle**

Mevcut `<AssistantModal ... onPickModule={(target) => setActiveDock(target)} />` çağrısını şuna değiştir:

```tsx
<AssistantModal
  open={assistantOpen}
  onClose={() => setAssistantOpen(false)}
  onPickModule={(entryId) => setActiveSummary(entryId)}
/>
```

- [ ] **Step 4: ModuleSummary render branch ekle**

Mevcut `<div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">` div'inin **dışına**, hemen üstüne (zaten `<AssistantModal>` üstünde değil, page render'dan önce) ekle:

```tsx
{activeSummary && (
  <ModuleSummary
    entryId={activeSummary}
    onCardClick={(deepLink) => {
      const entry = SUMMARY_ENTRIES[activeSummary];
      setActiveSummary(null);
      setPageDeepLink(deepLink);
      setActiveDock(entry.target);
    }}
    onPrimary={() => {
      const entry = SUMMARY_ENTRIES[activeSummary];
      setActiveSummary(null);
      setActiveDock(entry.target);
    }}
    onClose={() => {
      setActiveSummary(null);
      setAssistantOpen(true);
    }}
  />
)}
```

- [ ] **Step 5: Page render'larında initial prop'unu ve key'i geçir**

Mevcut page render branch'lerini (`{activeDock === 'listings' && <ListingsPage />}` vb.) şu şekilde değiştir:

```tsx
{activeDock === 'overview' && <DashboardHome onNavigate={setActiveDock} />}
{activeDock === 'listings' && (
  <ListingsPage
    key={pageDeepLink ? `listings-${JSON.stringify(pageDeepLink)}` : 'listings-default'}
    initial={pageDeepLink as ListingsDeepLink | null}
  />
)}
{activeDock === 'customers' && (
  <CustomersPage
    key={pageDeepLink ? `customers-${JSON.stringify(pageDeepLink)}` : 'customers-default'}
    initial={pageDeepLink as CustomersDeepLink | null}
  />
)}
{activeDock === 'finance' && (
  <FinancePage
    key={pageDeepLink ? `finance-${JSON.stringify(pageDeepLink)}` : 'finance-default'}
    initial={pageDeepLink as FinanceDeepLink | null}
  />
)}
{activeDock === 'reports' && (
  <ReportsPage
    key={pageDeepLink ? `reports-${JSON.stringify(pageDeepLink)}` : 'reports-default'}
    initial={pageDeepLink as ReportsDeepLink | null}
  />
)}
{activeDock === 'calendar' && <CalendarPage />}
{activeDock === 'messages' && <MessagesPage />}
{activeDock === 'search' && <SearchPage />}
{activeDock === 'profile' && (
  <ProfilePage
    key={pageDeepLink ? `profile-${JSON.stringify(pageDeepLink)}` : 'profile-default'}
    initial={pageDeepLink as ProfileDeepLink | null}
  />
)}
```

- [ ] **Step 6: Build & test doğrula**

Run: `npm run build && npm run test`
Expected: PASS (TypeScript clean, mevcut testler de PASS)

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/infinite-grid-integration.tsx
git commit -m "feat: integrate ModuleSummary into root navigation flow"
```

---

## Task 18: Manuel smoke verification

**Files:** (yok, sadece manuel)

- [ ] **Step 1: Dev server başlat**

Run: `npm run dev`
Open: http://localhost:5173

- [ ] **Step 2: Akış kontrolü**

Her 6 modül için sırayla test et:
1. Asistan butonuna tıkla → "Nereye gidelim?" modal açılır
2. **İlanlar** kartına tıkla → modal kapanır → "Arsa portföyü" summary açılır → 4 kart bento grid'de görünür → viewport'a sığar (scroll yok)
3. **KPI tall** karta tıkla → summary kapanır → ListingsPage `Aktif` filtresiyle açılır
4. Asistan'ı tekrar aç → İlanlar → ESC tuşu → summary kapanır → modal tekrar görünür
5. Asistan → Kategoriler → "Bölgesel yoğunluk" hero kart → summary kapanır → ListingsPage harita view'inda açılır
6. Aynı akışı **Müşteriler**, **Finans**, **Raporlar**, **Ayarlar** için tekrarla
7. **Ayarlar → Güvenlik & oturumlar** kartı → ProfilePage açılır + güvenlik shortcut modal'ı open

- [ ] **Step 3: Dark/light tema kontrolü**

Tema toggle ile geç: kartların border, dot, başlık tipografisi her iki temada okunaklı.

- [ ] **Step 4: Mobile viewport (DevTools, 375×667)**

Bento grid tek sütuna stack olur, dikey scroll çalışır, header `font-serif text-3xl` boyutunda.

- [ ] **Step 5: Tüm test suite'i çalıştır**

Run: `npm run test`
Expected: PASS

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS (varsa warning'leri düzelt)

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: PASS (production build temiz)

- [ ] **Step 8: Final commit (sadece varsa düzeltmeler)**

```bash
git status
# eğer değişen dosya varsa:
git add -A
git commit -m "fix: smoke test cleanup"
```

---

## Self-Review (plan yazıldıktan sonra)

**Spec coverage:**
- ✅ Mimari & state akışı → Task 17
- ✅ Modal → Summary entry mapping → Task 15
- ✅ Deep-link tipleri → Task 1
- ✅ Deep-link consume + key re-mount → Task 17 step 5 + Task 10-14
- ✅ Bento grid CSS → Task 8 step 2
- ✅ 5 kart varyantı → Task 6 + 7
- ✅ Görsel dil (active dot, serif title, italic accent, hover arrow) → Task 6
- ✅ Header (Sayfaya git + ESC GERİ DÖN sırası) → Task 8
- ✅ Animasyon (container + stagger cards + hover/tap) → Task 6 + Task 8
- ✅ Erişilebilirlik (region, aria-label, ESC keyboard) → Task 8 + Task 9
- ✅ Edge case (boş veri "—") → Task 7
- ✅ Mobile fallback → Task 8 step 2
- ✅ Test planı → Task 5 + Task 9
- ✅ 6 entry × 4 kart içeriği → Task 3 + Task 4

**Placeholder scan:** Yok — tüm kod blokları somut, exact path ve komut verilmiş.

**Type consistency:**
- `SummaryEntryId` her yerde aynı (Task 1, 15, 16, 17)
- `DeepLink` union → page'lere as cast ile geçiriliyor (Task 17 step 5)
- `withRuntimeData` Task 3'te tanımlı, Task 8'de kullanılıyor
- `BentoSlot` Task 1'de tanımlı, Task 5/6'da kullanılıyor

Spec gap yok. Plan execute edilmeye hazır.
