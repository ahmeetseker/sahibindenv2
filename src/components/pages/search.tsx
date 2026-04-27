import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  MapPin,
  Search as SearchIcon,
  Sparkles,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { PageShell } from "./page-shell";

const quickFilters = [
  "Çanakkale · Deniz manzaralı",
  "2.000 m² üstü villa imarlı",
  "Ayvalık zeytinlik · ₺1M altı",
  "Bu hafta eklenen",
  "Sıcak müşteri",
];

const RECENT_KEY = "atelier-recent-searches";

export function SearchPage() {
  const { listings, customers } = useStore();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* noop */
    }
    return ["Datça koy önü", "Alaçatı 1500m² altı", "Bodrum villa imarlı"];
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
    } catch {
      /* noop */
    }
  }, [recent]);

  const lowerQuery = query.trim().toLowerCase();

  const listingResults = useMemo(() => {
    if (!lowerQuery) return [];
    return listings
      .filter((l) =>
        `${l.id} ${l.loc} ${l.tag ?? ""}`.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 6);
  }, [listings, lowerQuery]);

  const customerResults = useMemo(() => {
    if (!lowerQuery) return [];
    return customers
      .filter((c) =>
        `${c.name} ${c.interest} ${c.budget}`.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 4);
  }, [customers, lowerQuery]);

  const submit = () => {
    const value = query.trim();
    if (!value) return;
    setRecent((prev) => [value, ...prev.filter((p) => p !== value)].slice(0, 8));
  };

  const totalResults = listingResults.length + customerResults.length;

  return (
    <PageShell
      eyebrow="Atölye · Arama"
      title={<>Ne <span className="font-medium">arıyorsun?</span></>}
      description="Doğal dilde sor, AI senin için arar. İlanlar ve müşteriler tek arayüzden."
    >
      <Card className="mb-4">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur-md focus-within:border-stone-700/40 dark:focus-within:border-stone-300/40"
          >
            <Sparkles className="h-4 w-4 flex-none text-stone-700 dark:text-stone-300" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bana sor… örn. 'Çanakkale 2 milyon altı deniz manzaralı'"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              aria-label="Ara"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background shadow-sm transition-opacity hover:opacity-90"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickFilters.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-stone-700/40 dark:hover:border-stone-300/40 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Son aramalar
            </CardTitle>
            <CardDescription>
              {recent.length} kayıt · hızlı tekrar et
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Henüz arama yapılmadı.
              </p>
            ) : (
              recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQuery(r)}
                  className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-colors hover:border-border/40 hover:bg-background/40"
                >
                  <span className="flex items-center gap-2">
                    <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {r}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))
            )}
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => setRecent([])}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-border/40 bg-background/30 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-background/60"
              >
                Geçmişi temizle
              </button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              {lowerQuery ? `Sonuçlar` : `İlk önerilenler`}
            </CardTitle>
            <CardDescription>
              {lowerQuery
                ? `${totalResults} sonuç · "${query}"`
                : `Yazmaya başla; AI semantik arama hazır.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowerQuery && totalResults === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sonuç bulunamadı.
              </p>
            ) : (
              <>
                {(lowerQuery ? listingResults : listings.slice(0, 4)).length >
                  0 && (
                  <>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                      İlanlar
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {(lowerQuery ? listingResults : listings.slice(0, 4)).map(
                        (r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="rounded-xl border border-border/40 bg-background/30 p-3 text-left transition-colors hover:bg-background/60"
                          >
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              {r.id}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {r.loc}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {r.area}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              {r.tag ? (
                                <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                                  {r.tag}
                                </span>
                              ) : (
                                <span />
                              )}
                              <span className="text-sm font-semibold tabular-nums">
                                {r.price}
                              </span>
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}

                {customerResults.length > 0 && (
                  <>
                    <p className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                      Müşteriler
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="rounded-xl border border-border/40 bg-background/30 p-3 text-left transition-colors hover:bg-background/60"
                        >
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {c.interest}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
                              {c.stage}
                            </span>
                            <span className="font-medium tabular-nums">
                              {c.budget}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
