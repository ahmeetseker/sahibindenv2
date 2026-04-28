import { Layers, Lock } from "lucide-react";
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

export const SUMMARY_ENTRIES: SummaryEntries = {
  listings,
  categories,
  customers,
  finance,
  reports,
  profile,
};

// Yardımcı: ileride kart override'ı için (runtime data injection)
export function withRuntimeData<T extends SummaryEntry>(
  entry: T,
  overrides: Partial<Record<T["cards"][number]["slot"], Partial<T["cards"][number]["data"]>>>,
): T {
  // TS cannot narrow T["cards"][number]["slot"] as an index key under the generic constraint; widen to string locally only.
  const _overrides = overrides as Partial<Record<string, Partial<T["cards"][number]["data"]>>>;
  return {
    ...entry,
    cards: entry.cards.map((c) =>
      _overrides[c.slot]
        ? ({ ...c, data: { ...c.data, ..._overrides[c.slot] } as T["cards"][number]["data"] })
        : c,
    ),
  } as T;
}

