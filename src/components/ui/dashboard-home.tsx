import { useMemo } from "react";
import {
  ArrowRight,
  Clock,
  FileText,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MiniChart } from "@/components/ui/mini-chart";
import { FunnelChart, PatternLines } from "@/components/ui/funnel-chart";
import { RevenueLineChart } from "@/components/ui/revenue-line-chart";
import { useStore } from "@/lib/store";

const revenueWeekly = [
  { label: "Pzt", value: 18 },
  { label: "Sal", value: 24 },
  { label: "Çar", value: 12 },
  { label: "Per", value: 32 },
  { label: "Cum", value: 28 },
  { label: "Cmt", value: 8 },
  { label: "Paz", value: 4 },
];

const monthlyRevenue = [
  { month: "Kas", value: 1_800_000 },
  { month: "Ara", value: 2_100_000 },
  { month: "Oca", value: 1_650_000 },
  { month: "Şub", value: 2_400_000 },
  { month: "Mar", value: 2_900_000 },
  { month: "Nis", value: 3_400_000 },
];

function greetingByHour(hour: number) {
  if (hour < 5) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export interface DashboardHomeProps {
  onNavigate?: (key: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps = {}) {
  const { listings, customers, transactions, activity, profile } = useStore();

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === "Aktif").length,
    [listings],
  );
  const hotCustomers = useMemo(
    () => customers.filter((c) => c.segment === "Sıcak"),
    [customers],
  );
  const pendingDeposits = useMemo(
    () => transactions.filter((t) => t.status === "Kaparo").length,
    [transactions],
  );

  const now = new Date();
  const greeting = greetingByHour(now.getHours());
  const firstName = profile.name.split(" ")[0];
  const lastUpdate = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const newToday = activity.length;

  const listingsWeekly = useMemo(() => {
    return [
      { label: "Pzt", value: Math.max(1, listings.length - 6) },
      { label: "Sal", value: Math.max(1, listings.length - 4) },
      { label: "Çar", value: Math.max(1, listings.length - 5) },
      { label: "Per", value: Math.max(1, listings.length - 2) },
      { label: "Cum", value: Math.max(1, listings.length - 3) },
      { label: "Cmt", value: Math.max(1, listings.length - 7) },
      { label: "Paz", value: Math.max(1, listings.length - 8) },
    ];
  }, [listings]);

  const hotCustomersWeekly = useMemo(() => {
    const base = Math.max(1, hotCustomers.length);
    return [
      { label: "Pzt", value: Math.max(1, base - 1) },
      { label: "Sal", value: base },
      { label: "Çar", value: Math.max(1, base - 2) },
      { label: "Per", value: base + 1 },
      { label: "Cum", value: base },
      { label: "Cmt", value: Math.max(1, base - 3) },
      { label: "Paz", value: 1 },
    ];
  }, [hotCustomers]);

  const depositsWeekly = useMemo(
    () => [
      { label: "Pzt", value: 1 },
      { label: "Sal", value: 2 },
      { label: "Çar", value: 0 },
      { label: "Per", value: 3 },
      { label: "Cum", value: pendingDeposits },
      { label: "Cmt", value: 1 },
      { label: "Paz", value: 0 },
    ],
    [pendingDeposits],
  );

  const funnelStages = useMemo(() => {
    const stages = ["İlk temas", "Görüşme", "Teklif", "Kaparo", "Tapu"];
    const counts = stages.map(
      (s) => customers.filter((c) => c.stage === s).length || 1,
    );
    const max = Math.max(...counts, 1);
    return stages.map((label, i) => ({
      label,
      value: Math.round((counts[i] / max) * 100) * (1 - i * 0.12),
      displayValue: String(counts[i]),
    }));
  }, [customers]);

  const recentListings = useMemo(() => listings.slice(0, 5), [listings]);

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32">
      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Atölye · Gösterge
          </p>
          <h1 className="mt-1 font-serif text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {greeting},{" "}
            <span className="font-medium">{firstName}.</span>
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Bugün atölyende {newToday} yeni hareket · son güncelleme{" "}
            <span className="tabular-nums">{lastUpdate}</span>
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur-md md:flex">
          <Sparkles className="h-3.5 w-3.5 text-stone-700 dark:text-stone-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            AI özet hazır
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniChart label="Haftalık ciro" data={revenueWeekly} unit="M" />
        <MiniChart
          label={`Aktif ilan · ${activeListings}`}
          data={listingsWeekly}
        />
        <MiniChart
          label={`Sıcak müşteri · ${hotCustomers.length}`}
          data={hotCustomersWeekly}
        />
        <MiniChart
          label={`Bekleyen kaparo · ${pendingDeposits}`}
          data={depositsWeekly}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div>
              <CardTitle className="font-serif text-xl font-light">
                Aylık ciro
              </CardTitle>
              <CardDescription>Son 6 ay · ₺ milyon</CardDescription>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-700 dark:text-stone-300">
              <TrendingUp className="h-3 w-3" />
              +18.2%
            </span>
          </CardHeader>
          <CardContent className="text-stone-800 dark:text-stone-200">
            <RevenueLineChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-xl font-light">
              Satış hunisi
            </CardTitle>
            <CardDescription>
              İlk temas → Tapu · {customers.length} müşteri
            </CardDescription>
          </CardHeader>
          <CardContent className="text-stone-800 dark:text-stone-200">
            <FunnelChart
              data={funnelStages}
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
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Sıcak müşteriler
            </CardTitle>
            <CardDescription>
              {hotCustomers.length} kayıt · top 5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotCustomers.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Sıcak müşteri yok.
              </p>
            ) : (
              hotCustomers.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onNavigate?.("customers")}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-left transition-colors hover:bg-background/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.interest}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {c.stage}
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                      {c.budget}
                    </span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Son ilanlar
            </CardTitle>
            <CardDescription>Top 5 · son eklenen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentListings.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                İlan yok.
              </p>
            ) : (
              recentListings.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onNavigate?.("listings")}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-left transition-colors hover:bg-background/60"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {l.id}
                    </p>
                    <p className="flex items-center gap-1 truncate text-sm font-medium">
                      <MapPin className="h-3 w-3 flex-none text-muted-foreground" />
                      {l.loc}
                    </p>
                    <p className="text-xs text-muted-foreground">{l.area}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {l.price}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="font-serif text-lg font-light">
                Bugünün akışı
              </CardTitle>
              <CardDescription>Canlı etkinlikler</CardDescription>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              tümü
              <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2"
              >
                <span className="flex-none font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {a.time}
                </span>
                <span
                  className={
                    a.tone === "accent"
                      ? "h-1.5 w-1.5 flex-none translate-y-1.5 rounded-full bg-stone-800 dark:bg-stone-200"
                      : a.tone === "success"
                      ? "h-1.5 w-1.5 flex-none translate-y-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                      : "h-1.5 w-1.5 flex-none translate-y-1.5 rounded-full bg-muted-foreground/40"
                  }
                />
                <span className="flex-1 text-xs text-foreground/80">
                  {a.text}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {transactions.filter((t) => t.status === "Tapu tamam").length}{" "}
              işlem tamam
              <span className="ml-auto inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {pendingDeposits} bekliyor
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
