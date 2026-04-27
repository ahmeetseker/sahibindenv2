import { useStore } from '@/lib/store';
import { MapPin } from 'lucide-react';

interface Props {
  ids: string[];
  onNavigate?: () => void;
}

export function ListingsBlock({ ids, onNavigate }: Props) {
  const { listings } = useStore();
  const items = ids
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((l) => (
        <button
          type="button"
          key={l.id}
          onClick={onNavigate}
          className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/40 p-3 text-left backdrop-blur-md transition-colors hover:bg-background/70"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {l.id}
            </span>
            <span className="text-[12.5px] font-semibold">{l.price}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{l.loc}</span>
          </div>
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>{l.area}</span>
            {l.tag && (
              <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]">
                {l.tag}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
