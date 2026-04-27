import { useStore } from '@/lib/store';
import { User } from 'lucide-react';

interface Props {
  ids: string[];
  onNavigate?: () => void;
}

export function CustomersBlock({ ids, onNavigate }: Props) {
  const { customers } = useStore();
  const items = ids
    .map((id) => customers.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((c) => (
        <button
          type="button"
          key={c.id}
          onClick={onNavigate}
          className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/40 p-3 text-left backdrop-blur-md transition-colors hover:bg-background/70"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {c.name}
            </span>
            <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]">
              {c.segment}
            </span>
          </div>
          <div className="text-[12px] text-muted-foreground">{c.interest}</div>
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>{c.budget}</span>
            <span>{c.stage}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
