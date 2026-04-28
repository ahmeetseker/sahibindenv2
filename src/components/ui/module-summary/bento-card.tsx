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
