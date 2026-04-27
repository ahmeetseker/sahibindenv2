import { useMemo, useState } from "react";
import {
  ArrowRight,
  Pencil,
  Plus,
  Search as SearchIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  type Customer,
  type CustomerSegment,
  type CustomerStage,
} from "@/lib/store";
import { PageShell } from "./page-shell";

const segmentOptions: CustomerSegment[] = ["Sıcak", "Ilık", "Soğuk"];
const stageOptions: CustomerStage[] = [
  "İlk temas",
  "Görüşme",
  "Teklif",
  "Kaparo",
  "Tapu",
];

const segmentDot: Record<CustomerSegment, string> = {
  Sıcak: "bg-amber-500",
  Ilık: "bg-stone-400",
  Soğuk: "bg-stone-300",
};

interface CustomerFormState {
  name: string;
  interest: string;
  budget: string;
  stage: CustomerStage;
  segment: CustomerSegment;
}

const emptyForm: CustomerFormState = {
  name: "",
  interest: "",
  budget: "",
  stage: "İlk temas",
  segment: "Ilık",
};

export function CustomersPage() {
  const {
    customers,
    listings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useStore();

  const [filter, setFilter] = useState<"Tümü" | CustomerSegment>("Tümü");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter !== "Tümü" && c.segment !== filter) return false;
      if (q) {
        const hay = `${c.name} ${c.interest} ${c.stage}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, filter, query]);

  const counts = useMemo(() => {
    const all = customers.length;
    const sicak = customers.filter((c) => c.segment === "Sıcak").length;
    const ilik = customers.filter((c) => c.segment === "Ilık").length;
    const soguk = customers.filter((c) => c.segment === "Soğuk").length;
    return { all, sicak, ilik, soguk };
  }, [customers]);

  const conversionRate = useMemo(() => {
    if (customers.length === 0) return 0;
    const closed = customers.filter((c) => c.stage === "Tapu").length;
    return Math.round((closed / customers.length) * 100);
  }, [customers]);

  const segments = [
    { label: "Tümü" as const, count: counts.all },
    { label: "Sıcak" as const, count: counts.sicak },
    { label: "Ilık" as const, count: counts.ilik },
    { label: "Soğuk" as const, count: counts.soguk },
  ];

  const matches = useMemo(() => {
    return customers
      .filter((c) => c.segment === "Sıcak")
      .slice(0, 3)
      .map((c, i) => ({
        customer: c.name.split(" ")[0] + " " + (c.name.split(" ")[1]?.[0] ?? "") + ".",
        listing: listings[i]?.id ?? "ARS-—",
        score: 92 - i * 4,
      }));
  }, [customers, listings]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      interest: c.interest,
      budget: c.budget,
      stage: c.stage,
      segment: c.segment,
    });
  };
  const submit = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateCustomer(editing.id, { ...form });
      setEditing(null);
    } else {
      addCustomer({ ...form });
      setCreating(false);
    }
    setForm(emptyForm);
  };

  return (
    <PageShell
      eyebrow="Atölye · CRM"
      title={<>Müşteri <span className="font-medium">defteri</span></>}
      description="Görüşmeler, kohort analizi ve iletişim geçmişi. AI eşleştirmesiyle kapama hızını artır."
      actions={
        <>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 backdrop-blur-md">
            <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Müşteri ara…"
              className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button type="button" onClick={openCreate} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Yeni müşteri
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {segments.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setFilter(s.label)}
            className={
              filter === s.label
                ? "inline-flex items-center gap-2 rounded-full border border-foreground/40 bg-foreground/10 px-3 py-1.5 text-xs font-medium"
                : "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background/60"
            }
          >
            {s.label !== "Tümü" && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${segmentDot[s.label as CustomerSegment]}`}
              />
            )}
            {s.label}
            <span className="font-mono text-[10px] tabular-nums opacity-70">
              {s.count}
            </span>
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Toplam
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {counts.all}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Sıcak
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {counts.sicak}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Listelenen
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {filtered.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Kapama oranı
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              %{conversionRate}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Müşteriler
            </CardTitle>
            <CardDescription>
              {filtered.length} kayıt · {filter}
              {query && ` · "${query}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-[1fr_120px_100px_80px_80px_70px] gap-3 border-b border-border/40 px-5 pb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Müşteri</span>
              <span>Bütçe</span>
              <span>Aşama</span>
              <span>Son temas</span>
              <span className="text-right">Segment</span>
              <span className="text-right">·</span>
            </div>
            <div className="px-5">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sonuç yok. Yeni müşteri ekle.
                </p>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-[1fr_120px_100px_80px_80px_70px] items-center gap-3 border-b border-border/30 py-2.5 text-sm last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.interest}
                      </p>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {c.budget}
                    </span>
                    <span>{c.stage}</span>
                    <span className="text-muted-foreground">{c.last}</span>
                    <span
                      className={
                        c.segment === "Sıcak"
                          ? "justify-self-end rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300"
                          : c.segment === "Ilık"
                          ? "justify-self-end rounded-full border border-stone-500/30 bg-stone-500/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-stone-700 dark:text-stone-300"
                          : "justify-self-end rounded-full border border-border/60 bg-background/40 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground"
                      }
                    >
                      {c.segment}
                    </span>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label="Düzenle"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/30 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(c)}
                        aria-label="Sil"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-red-700/30 bg-red-600/5 text-red-700 transition-colors hover:bg-red-600/15 dark:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="font-serif text-lg font-light">
                AI eşleştirme
              </CardTitle>
              <CardDescription>Müşteri ↔ ilan uyumu</CardDescription>
            </div>
            <Sparkles className="h-4 w-4 text-stone-700 dark:text-stone-300" />
          </CardHeader>
          <CardContent className="space-y-2">
            {matches.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Sıcak müşteri yok.
              </p>
            ) : (
              matches.map((m) => (
                <div
                  key={`${m.customer}-${m.listing}`}
                  className="rounded-xl border border-border/40 bg-background/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.customer}</p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      %{m.score}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {m.listing}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-700 dark:text-stone-300 hover:underline"
                  >
                    Eşleştir
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
          setForm(emptyForm);
        }}
        title={editing ? `${editing.name} · düzenle` : "Yeni müşteri"}
        description={
          editing
            ? "Müşteri bilgilerini güncelle."
            : "CRM defterine yeni müşteri ekle."
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setForm(emptyForm);
              }}
              className={buttonGhost}
            >
              Vazgeç
            </button>
            <button type="button" onClick={submit} className={buttonPrimary}>
              {editing ? "Kaydet" : "Ekle"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Ad Soyad">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mehmet Kaya"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="İlgi alanı">
              <input
                type="text"
                value={form.interest}
                onChange={(e) =>
                  setForm({ ...form, interest: e.target.value })
                }
                placeholder="Deniz manzaralı · Muğla"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Bütçe">
            <input
              type="text"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="₺2-3M"
              className={inputClass}
            />
          </Field>
          <Field label="Aşama">
            <select
              value={form.stage}
              onChange={(e) =>
                setForm({ ...form, stage: e.target.value as CustomerStage })
              }
              className={inputClass}
            >
              {stageOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Segment">
            <select
              value={form.segment}
              onChange={(e) =>
                setForm({
                  ...form,
                  segment: e.target.value as CustomerSegment,
                })
              }
              className={inputClass}
            >
              {segmentOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="Müşteriyi sil"
        description={
          confirmDelete
            ? `${confirmDelete.name} kalıcı olarak silinecek.`
            : undefined
        }
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
                  deleteCustomer(confirmDelete.id);
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
          Bu işlem geri alınamaz. Müşteri ve ilişkili kayıtlar kaldırılır.
        </p>
      </Dialog>
    </PageShell>
  );
}
