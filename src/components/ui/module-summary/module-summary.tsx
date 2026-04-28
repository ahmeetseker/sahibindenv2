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
