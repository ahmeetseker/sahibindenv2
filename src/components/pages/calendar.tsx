import { useMemo, useState } from "react";
import { Clock, MapPin, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  Field,
  buttonDanger,
  buttonGhost,
  buttonPrimary,
  inputClass,
} from "@/components/ui/dialog";
import {
  useStore,
  type CalendarEvent,
  type CalendarType,
} from "@/lib/store";
import { PageShell } from "./page-shell";

const days = [
  { name: "Pzt" as const, date: "21" },
  { name: "Sal" as const, date: "22" },
  { name: "Çar" as const, date: "23" },
  { name: "Per" as const, date: "24" },
  { name: "Cum" as const, date: "25", today: true },
  { name: "Cmt" as const, date: "26" },
  { name: "Paz" as const, date: "27" },
] as const;

const typeOptions: CalendarType[] = ["saha", "tapu", "gorusme"];
const typeLabel: Record<CalendarType, string> = {
  saha: "Saha gezisi",
  tapu: "Tapu randevusu",
  gorusme: "Görüşme",
};

const typeStyle: Record<CalendarType, string> = {
  saha: "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-300",
  tapu: "border-emerald-700/30 bg-emerald-700/10 text-emerald-700 dark:text-emerald-300",
  gorusme: "border-border/60 bg-background/40 text-foreground/80",
};

interface EventFormState {
  day: CalendarEvent["day"];
  time: string;
  title: string;
  type: CalendarType;
  loc: string;
}

const emptyForm: EventFormState = {
  day: "Pzt",
  time: "10:00",
  title: "",
  type: "gorusme",
  loc: "",
};

export function CalendarPage() {
  const { events, addEvent, deleteEvent } = useStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<CalendarEvent | null>(null);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {
      Pzt: [],
      Sal: [],
      Çar: [],
      Per: [],
      Cum: [],
      Cmt: [],
      Paz: [],
    };
    for (const e of events) map[e.day]?.push(e);
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const order: CalendarEvent["day"][] = ["Cum", "Cmt", "Paz", "Pzt", "Sal", "Çar", "Per"];
    const ordered: CalendarEvent[] = [];
    for (const day of order) {
      ordered.push(...(eventsByDay[day] ?? []));
    }
    return ordered.slice(0, 4);
  }, [eventsByDay]);

  const submit = () => {
    if (!form.title.trim() || !form.time.trim()) return;
    addEvent({
      day: form.day,
      time: form.time,
      title: form.title,
      type: form.type,
      loc: form.loc || undefined,
    });
    setCreating(false);
    setForm(emptyForm);
  };

  return (
    <PageShell
      eyebrow="Atölye · Takvim"
      title={<>Bu <span className="font-medium">hafta</span></>}
      description="Saha gezileri, tapu randevuları ve müşteri görüşmeleri."
      actions={
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setCreating(true);
          }}
          className={buttonPrimary}
        >
          <Plus className="h-4 w-4" />
          Yeni randevu
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              21 — 27 Nisan
            </CardTitle>
            <CardDescription>
              {events.length} etkinlik · haftalık plan
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-7 gap-1 px-3 pb-2">
              {days.map((d) => (
                <div
                  key={d.date}
                  className={
                    d.today
                      ? "rounded-lg bg-foreground/10 px-2 py-1.5 text-center"
                      : "px-2 py-1.5 text-center"
                  }
                >
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    {d.name}
                  </p>
                  <p className="mt-0.5 font-serif text-lg font-light tabular-nums">
                    {d.date}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
              {days.map((d) => (
                <div
                  key={`col-${d.date}`}
                  className="min-h-[260px] rounded-lg border border-border/30 bg-background/20 p-1.5"
                >
                  <div className="space-y-1">
                    {(eventsByDay[d.name] ?? []).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setConfirmDelete(e)}
                        className={`group/event w-full rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight transition-colors ${typeStyle[e.type]} hover:opacity-80`}
                      >
                        <p className="font-mono uppercase tracking-[0.12em] opacity-80">
                          {e.time}
                        </p>
                        <p className="mt-0.5 truncate font-medium">
                          {e.title}
                        </p>
                        {e.loc && (
                          <p className="mt-0.5 truncate opacity-70">{e.loc}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Yaklaşan
            </CardTitle>
            <CardDescription>
              Sıradaki {upcoming.length} etkinlik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Yaklaşan etkinlik yok.
              </p>
            ) : (
              upcoming.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-border/40 bg-background/30 p-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {u.day} · {u.time}
                  </p>
                  <p className="mt-1 text-sm font-medium">{u.title}</p>
                  {u.loc && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {u.loc}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(u)}
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-red-700 transition-colors hover:underline dark:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Yeni randevu"
        description="Saha gezisi, tapu randevusu veya görüşme planla."
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className={buttonGhost}
            >
              Vazgeç
            </button>
            <button type="button" onClick={submit} className={buttonPrimary}>
              Kaydet
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Gün">
            <select
              value={form.day}
              onChange={(e) =>
                setForm({ ...form, day: e.target.value as CalendarEvent["day"] })
              }
              className={inputClass}
            >
              {days.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} {d.date}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Saat">
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tip">
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as CalendarType })
              }
              className={inputClass}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {typeLabel[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lokasyon">
            <input
              type="text"
              value={form.loc}
              onChange={(e) => setForm({ ...form, loc: e.target.value })}
              placeholder="ARS-0142 / Ayvacık"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Başlık">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Saha gezisi · Mehmet K."
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="Randevuyu sil"
        description={confirmDelete?.title}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className={buttonGhost}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmDelete) {
                  deleteEvent(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
              className={buttonDanger}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Bu randevu takvimden kaldırılacak.
        </p>
      </Dialog>
    </PageShell>
  );
}
