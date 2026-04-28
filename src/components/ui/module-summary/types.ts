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
