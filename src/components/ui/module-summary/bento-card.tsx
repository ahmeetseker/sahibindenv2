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
            <span className="text-muted-foreground">
              {r.value.toLocaleString("tr-TR")}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {r.percent}%
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

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
