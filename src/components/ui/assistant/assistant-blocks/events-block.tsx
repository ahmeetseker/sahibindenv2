import { useStore } from '@/lib/store';
import { Calendar } from 'lucide-react';

export function EventsBlock({ ids }: { ids: string[] }) {
  const { events } = useStore();
  const items = ids
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 backdrop-blur-md"
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground w-12">
            {e.day} {e.time}
          </span>
          <span className="text-[12.5px] flex-1">{e.title}</span>
          {e.loc && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {e.loc}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
