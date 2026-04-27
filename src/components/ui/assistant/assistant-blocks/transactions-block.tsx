import { useStore } from '@/lib/store';

export function TransactionsBlock({ ids }: { ids: string[] }) {
  const { transactions } = useStore();
  const items = ids
    .map((id) => transactions.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-background/40 backdrop-blur-md">
      {items.map((t) => (
        <div
          key={t.id}
          className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2 text-[12.5px]"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {t.id}
          </span>
          <span>
            {t.customer} · {t.listing}
          </span>
          <span className="font-medium">{t.amount}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {t.status}
          </span>
        </div>
      ))}
    </div>
  );
}
