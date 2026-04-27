import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
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
import { RevenueLineChart } from "@/components/ui/revenue-line-chart";
import { FunnelChart, PatternLines } from "@/components/ui/funnel-chart";
import {
  useStore,
  type Transaction,
  type TransactionStatus,
} from "@/lib/store";
import { PageShell } from "./page-shell";

const statusOptions: TransactionStatus[] = [
  "Görüşme",
  "Teklif",
  "Kaparo",
  "Tapu tamam",
];

const monthlyRevenue = [
  { month: "Kas", value: 1_800_000 },
  { month: "Ara", value: 2_100_000 },
  { month: "Oca", value: 1_650_000 },
  { month: "Şub", value: 2_400_000 },
  { month: "Mar", value: 2_900_000 },
  { month: "Nis", value: 3_400_000 },
];

interface TxFormState {
  customer: string;
  listing: string;
  amount: string;
  date: string;
  status: TransactionStatus;
}

const emptyTx: TxFormState = {
  customer: "",
  listing: "",
  amount: "",
  date: "",
  status: "Görüşme",
};

const periods = [
  { label: "Bu hafta", days: 7 },
  { label: "Bu ay", days: 30 },
  { label: "Çeyrek", days: 90 },
  { label: "Yıl", days: 365 },
];

export function FinancePage() {
  const {
    transactions,
    customers,
    listings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStore();

  const [period, setPeriod] = useState(periods[1].label);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TxFormState>(emptyTx);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const totals = useMemo(() => {
    const closed = transactions.filter((t) => t.status === "Tapu tamam").length;
    const pending = transactions.filter((t) => t.status !== "Tapu tamam").length;
    return {
      revenue: transactions
        .filter((t) => t.status === "Tapu tamam" || t.status === "Kaparo")
        .length,
      closed,
      pending,
    };
  }, [transactions]);

  const kpis = [
    { label: "Ciro", value: "₺3.4M", delta: "+18.2%", positive: true },
    { label: "Tahsilat", value: `${totals.closed} işlem`, delta: "+12.5%", positive: true },
    { label: "Komisyon", value: "₺184K", delta: "+9.1%", positive: true },
    { label: "Bekleyen", value: `${totals.pending} işlem`, delta: "-2.4%", positive: false },
  ];

  const funnel = useMemo(() => {
    const counts = {
      Görüşme: transactions.filter((t) => t.status === "Görüşme").length || 1,
      Teklif: transactions.filter((t) => t.status === "Teklif").length || 1,
      Kaparo: transactions.filter((t) => t.status === "Kaparo").length || 1,
      "Tapu tamam":
        transactions.filter((t) => t.status === "Tapu tamam").length || 1,
    };
    const max = Math.max(...Object.values(counts));
    const norm = (c: number) => Math.round((c / max) * 100);
    return [
      { label: "Görüşme", value: norm(counts.Görüşme), displayValue: `${counts.Görüşme} işlem` },
      { label: "Teklif", value: norm(counts.Teklif) * 0.8, displayValue: `${counts.Teklif} işlem` },
      { label: "Kaparo", value: norm(counts.Kaparo) * 0.6, displayValue: `${counts.Kaparo} işlem` },
      { label: "Tapu", value: norm(counts["Tapu tamam"]) * 0.4, displayValue: `${counts["Tapu tamam"]} işlem` },
    ];
  }, [transactions]);

  const openCreate = () => {
    setForm(emptyTx);
    setCreating(true);
  };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      customer: t.customer,
      listing: t.listing,
      amount: t.amount,
      date: t.date,
      status: t.status,
    });
  };
  const submit = () => {
    if (!form.customer.trim() || !form.amount.trim()) return;
    if (editing) {
      updateTransaction(editing.id, { ...form });
      setEditing(null);
    } else {
      addTransaction({
        ...form,
        customerId:
          customers.find((c) => c.name.startsWith(form.customer.split(" ")[0]))
            ?.id ?? "",
      });
      setCreating(false);
    }
    setForm(emptyTx);
  };

  return (
    <PageShell
      eyebrow="Atölye · Finans"
      title={<>Para <span className="font-medium">akışı</span></>}
      description="Satış, tahsilat, komisyon ve bekleyen ödemeler tek bakışta."
      actions={
        <>
          <button type="button" className={buttonGhost}>
            <Download className="h-3.5 w-3.5" />
            Dışa aktar
          </button>
          <button type="button" onClick={openCreate} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Yeni işlem
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {periods.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPeriod(p.label)}
            className={
              period === p.label
                ? "inline-flex items-center gap-2 rounded-full border border-foreground/40 bg-foreground/10 px-3 py-1.5 text-xs font-medium"
                : "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background/60"
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-2 font-serif text-2xl font-light tabular-nums">
                {k.value}
              </p>
              <p
                className={
                  k.positive
                    ? "mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300"
                    : "mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500"
                }
              >
                <TrendingUp className="h-3 w-3" />
                {k.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg font-light">
              Aylık ciro
            </CardTitle>
            <CardDescription>{period} · ₺ milyon</CardDescription>
          </CardHeader>
          <CardContent className="text-stone-800 dark:text-stone-200">
            <RevenueLineChart data={monthlyRevenue} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg font-light">
              Pipeline aşamaları
            </CardTitle>
            <CardDescription>Cari işlem dağılımı</CardDescription>
          </CardHeader>
          <CardContent className="text-stone-800 dark:text-stone-200">
            <FunnelChart
              data={funnel}
              layers={3}
              gap={6}
              renderPattern={(id, color) => (
                <PatternLines
                  id={id}
                  height={8}
                  width={8}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1.5}
                  background={color}
                />
              )}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg font-light">
            Son işlemler
          </CardTitle>
          <CardDescription>{transactions.length} işlem</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-[110px_1fr_120px_110px_90px_110px_70px] gap-3 border-b border-border/40 px-5 pb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>İşlem</span>
            <span>Müşteri</span>
            <span>Arsa</span>
            <span className="text-right">Tutar</span>
            <span className="text-right">Tarih</span>
            <span className="text-right">Durum</span>
            <span className="text-right">·</span>
          </div>
          <div className="px-5">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Henüz işlem yok. Yeni işlem ekle.
              </p>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[110px_1fr_120px_110px_90px_110px_70px] items-center gap-3 border-b border-border/30 py-2.5 text-sm last:border-b-0"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {t.id}
                  </span>
                  <span className="truncate">{t.customer}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {t.listing}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {t.amount}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {t.date}
                  </span>
                  <span
                    className={
                      t.status === "Tapu tamam"
                        ? "justify-self-end rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300"
                        : t.status === "Kaparo"
                        ? "justify-self-end rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300"
                        : "justify-self-end rounded-full border border-border/60 bg-background/40 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground"
                    }
                  >
                    {t.status}
                  </span>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      aria-label="Düzenle"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/30 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(t)}
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

      <Dialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
          setForm(emptyTx);
        }}
        title={editing ? `${editing.id} düzenle` : "Yeni işlem"}
        description={
          editing
            ? "İşlem bilgilerini güncelle."
            : "Yeni bir finans işlemi kaydet."
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setForm(emptyTx);
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
          <Field label="Müşteri">
            <input
              type="text"
              list="customer-options"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder="Mehmet K."
              className={inputClass}
            />
            <datalist id="customer-options">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Arsa">
            <input
              type="text"
              list="listing-options"
              value={form.listing}
              onChange={(e) => setForm({ ...form, listing: e.target.value })}
              placeholder="ARS-0142"
              className={inputClass}
            />
            <datalist id="listing-options">
              {listings.map((l) => (
                <option key={l.id} value={l.id} />
              ))}
            </datalist>
          </Field>
          <Field label="Tutar">
            <input
              type="text"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="₺1.8M"
              className={inputClass}
            />
          </Field>
          <Field label="Tarih">
            <input
              type="text"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              placeholder="15 Nis"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Durum">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as TransactionStatus,
                  })
                }
                className={inputClass}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="İşlemi sil"
        description={
          confirmDelete
            ? `${confirmDelete.id} kalıcı olarak silinecek.`
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
                  deleteTransaction(confirmDelete.id);
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
          Bu işlem kalıcı olarak silinir.
        </p>
      </Dialog>
    </PageShell>
  );
}
