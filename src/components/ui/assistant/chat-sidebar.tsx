import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssistantSession } from '@/lib/store';

interface Props {
  sessions: AssistantSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

function isToday(d: Date) {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function isYesterday(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function groupSessions(sessions: AssistantSession[]) {
  const today: AssistantSession[] = [];
  const yesterday: AssistantSession[] = [];
  const earlier: AssistantSession[] = [];
  const sorted = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const s of sorted) {
    const d = new Date(s.updatedAt);
    if (isToday(d)) today.push(s);
    else if (isYesterday(d)) yesterday.push(s);
    else earlier.push(s);
  }
  return { today, yesterday, earlier };
}

export function ChatSidebar({ sessions, activeId, onSelect, onCreate, onDelete }: Props) {
  const groups = groupSessions(sessions);
  return (
    <nav
      aria-label="Sohbet geçmişi"
      className="flex h-full w-[220px] flex-none flex-col border-r border-border/60 bg-background/30 backdrop-blur-md"
    >
      <div className="border-b border-border/60 p-3">
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[12px] transition-colors hover:bg-background/80"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni sohbet
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 && (
          <div className="px-2 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Geçmiş yok
          </div>
        )}
        {(['today', 'yesterday', 'earlier'] as const).map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          const label = key === 'today' ? 'Bugün' : key === 'yesterday' ? 'Dün' : 'Önceki';
          return (
            <div key={key} className="mb-3">
              <div className="px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </div>
              <ul className="flex flex-col gap-0.5">
                {items.map((s) => (
                  <li key={s.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-7 text-left text-[12px] transition-colors',
                        s.id === activeId
                          ? 'bg-foreground/10 text-foreground'
                          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                      )}
                    >
                      <span className="flex-1 truncate">{s.title}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Sil"
                      onClick={() => onDelete(s.id)}
                      className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground group-hover:flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
