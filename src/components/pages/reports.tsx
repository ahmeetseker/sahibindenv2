import { useMemo, useState } from "react";
import type { ReportsDeepLink } from "@/components/ui/module-summary/types";
import { Download, FileBarChart, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MiniChart } from "@/components/ui/mini-chart";
import { RevenueLineChart } from "@/components/ui/revenue-line-chart";
import { FunnelChart, PatternLines } from "@/components/ui/funnel-chart";
import { buttonGhost, buttonPrimary } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { PageShell } from "./page-shell";

const reportLibrary = [
  { name: "Haftalık özet", desc: "Otomatik · Cuma 18:00", count: "12 hafta" },
  { name: "Ayvalık bölge raporu", desc: "AI · son 30 gün", count: "yeni" },
  { name: "Personel performansı", desc: "Q1 · 2026", count: "tamamlandı" },
];

const tabs = ["Performans", "Satış", "Müşteri", "Bölge"] as const;
type Tab = (typeof tabs)[number];

interface ReportsPageProps {
  initial?: ReportsDeepLink | null;
}

export function ReportsPage({ initial }: ReportsPageProps = {}) {
  const { listings, customers, transactions } = useStore();
  const [tab, setTab] = useState<Tab>(initial?.tab ?? "Performans");

  const monthlyRevenue = [
    { month: "Kas", value: 1_800_000 },
    { month: "Ara", value: 2_100_000 },
    { month: "Oca", value: 1_650_000 },
    { month: "Şub", value: 2_400_000 },
    { month: "Mar", value: 2_900_000 },
    { month: "Nis", value: 3_400_000 },
  ];

  const funnel = useMemo(() => {
    const stages = ["İlk temas", "Görüşme", "Teklif", "Kaparo", "Tapu"];
    const counts = stages.map(
      (s) => customers.filter((c) => c.stage === s).length || 1,
    );
    const max = Math.max(...counts, 1);
    return stages.map((label, i) => ({
      label: label === "İlk temas" ? "İlk temas" : label,
      value: Math.round((counts[i] / max) * 100) * (1 - i * 0.1),
      displayValue: String(counts[i]),
    }));
  }, [customers]);

  const regionDistribution = useMemo(() => {
    const acc: Record<string, number> = {};
    listings.forEach((l) => {
      const key = l.loc.split("/")[1]?.trim() ?? "Diğer";
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return Object.entries(acc)
      .map(([label, value]) => ({ label: label.slice(0, 4), value }))
      .slice(0, 7);
  }, [listings]);

  const teamPerf = [
    { label: "Pzt", value: 12 },
    { label: "Sal", value: 18 },
    { label: "Çar", value: 14 },
    { label: "Per", value: 24 },
    { label: "Cum", value: 22 },
    { label: "Cmt", value: 8 },
    { label: "Paz", value: 4 },
  ];

  const customerSegmentDist = useMemo(
    () => [
      {
        label: "Sıcak",
        value: customers.filter((c) => c.segment === "Sıcak").length,
      },
      {
        label: "Ilık",
        value: customers.filter((c) => c.segment === "Ilık").length,
      },
      {
        label: "Soğuk",
        value: customers.filter((c) => c.segment === "Soğuk").length,
      },
    ],
    [customers],
  );

  return (
    <PageShell
      eyebrow="Atölye · Raporlar"
      title={<>Veri <span className="font-medium">odası</span></>}
      description="Performans, satış ve müşteri verilerini grafiklerle keşfet. Otomatik özet ve dışa aktarım hazır."
      actions={
        <>
          <button type="button" className={buttonGhost}>
            <Download className="h-3.5 w-3.5" />
            Dışa aktar
          </button>
          <button type="button" className={buttonPrimary}>
            <FileBarChart className="h-4 w-4" />
            Yeni rapor
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTab(r)}
            className={
              tab === r
                ? "inline-flex items-center gap-2 rounded-full border border-foreground/40 bg-foreground/10 px-3 py-1.5 text-xs font-medium"
                : "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background/60"
            }
          >
            {r}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {(tab === "Performans" || tab === "Satış") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg font-light">
                Aylık satış
              </CardTitle>
              <CardDescription>Son 6 ay · ₺ milyon</CardDescription>
            </CardHeader>
            <CardContent className="text-stone-800 dark:text-stone-200">
              <RevenueLineChart data={monthlyRevenue} />
            </CardContent>
          </Card>
        )}

        {(tab === "Performans" || tab === "Müşteri") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg font-light">
                Satış hunisi
              </CardTitle>
              <CardDescription>Aşama bazlı dağılım</CardDescription>
            </CardHeader>
            <CardContent className="text-stone-800 dark:text-stone-200">
              <FunnelChart
                data={funnel}
                layers={3}
                gap={6}
                renderPattern={(id, color) => (
                  <PatternLines
                    id={id}
                    height={8}
                    width={8}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1.5}
                    background={color}
                  />
                )}
              />
            </CardContent>
          </Card>
        )}

        {(tab === "Performans" || tab === "Bölge") && (
          <MiniChart
            label="Bölge dağılımı"
            data={regionDistribution}
            pulseDot={false}
          />
        )}

        {(tab === "Performans" || tab === "Satış") && (
          <MiniChart label="Personel · bu hafta" data={teamPerf} pulseDot={false} />
        )}

        {tab === "Müşteri" && (
          <MiniChart label="Segment dağılımı" data={customerSegmentDist} pulseDot={false} />
        )}

        {tab === "Satış" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg font-light">
                İşlem sayısı
              </CardTitle>
              <CardDescription>{transactions.length} işlem</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-5xl font-light tabular-nums">
                {transactions.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Bu çeyrekte tamamlanan ve sürmekte olan tüm işlemler.
              </p>
            </CardContent>
          </Card>
        )}

        {tab === "Bölge" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg font-light">
                Aktif bölgeler
              </CardTitle>
              <CardDescription>{regionDistribution.length} bölge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {regionDistribution.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm"
                >
                  <span>{r.label}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {r.value} ilan
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="font-serif text-lg font-light">
              Rapor kütüphanesi
            </CardTitle>
            <CardDescription>Kayıtlı ve otomatik raporlar</CardDescription>
          </div>
          <Sparkles className="h-4 w-4 text-stone-700 dark:text-stone-300" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {reportLibrary.map((r) => (
            <button
              key={r.name}
              type="button"
              className="rounded-xl border border-border/40 bg-background/30 p-4 text-left transition-colors hover:bg-background/60"
            >
              <p className="text-sm font-medium">{r.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-700 dark:text-stone-300">
                {r.count}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
