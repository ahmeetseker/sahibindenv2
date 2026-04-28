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

// Lock & SettingsIcon importları profile entry'si eklendiğinde kullanılacak
void Lock; void SettingsIcon;
