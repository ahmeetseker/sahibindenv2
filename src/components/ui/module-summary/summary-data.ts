import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { ListCardData, DistributionCardData, ChartCardData } from "./types";

const MONTHS_TR = [
  "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ",
  "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA",
];

// Transitional mock: stable but data-unaware. Seed-equal collections produce identical output.
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

// TODO: derive from real payment data once transaction.paymentMethod is available
const FINANCE_PAYMENT_DISTRIBUTION: DistributionCardData = {
  type: "distribution",
  rows: [
    { label: "Havale / EFT", value: 142, percent: 71 },
    { label: "Nakit", value: 34, percent: 17 },
    { label: "Kredi", value: 19, percent: 10 },
    { label: "Takas", value: 4, percent: 2 },
  ],
};

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
        const tagCounts = groups.map((g) => {
          const count = listings.filter((l) =>
            (l.tag ?? "").toLowerCase().includes(g.toLowerCase()),
          ).length;
          return count > 0 ? count : Math.max(1, Math.round(total / groups.length));
        });
        const sum = tagCounts.reduce((a, b) => a + b, 0);
        return groups.map((label, i) => ({
          label,
          value: tagCounts[i],
          percent: Math.round((tagCounts[i] / sum) * 100),
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
    const distribution = FINANCE_PAYMENT_DISTRIBUTION;
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
