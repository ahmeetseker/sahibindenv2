import { useMemo, useState } from "react";
import {
  ArrowRight,
  Filter,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Rows3,
  Search as SearchIcon,
  Sparkles,
  Trash2,
  TrendingUp,
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
  buttonGhost,
  buttonPrimary,
  buttonDanger,
  inputClass,
} from "@/components/ui/dialog";
import { useStore, type Listing, type ListingStatus } from "@/lib/store";
import { MapView } from "@/components/ui/map-view";
import { PageShell } from "./page-shell";

const statusOptions: ListingStatus[] = ["Aktif", "Taslak", "Pasif"];

const aiSuggestions = [
  { tag: "Fırsat", title: "6 ilan piyasa üstü", desc: "Ayvalık bölgesi · ortalama %12 pahalı." },
  { tag: "Trend", title: "Datça aramaları +%84", desc: "Son 30 günde sorgu yoğunluğu rekor." },
  { tag: "Dikkat", title: "3 evrak eksik", desc: "ARS-0125, ARS-0119, ARS-0117 için tapu eksiği var." },
];

interface ListingFormState {
  loc: string;
  area: string;
  price: string;
  status: ListingStatus;
  tag: string;
}

const emptyForm: ListingFormState = {
  loc: "",
  area: "",
  price: "",
  status: "Taslak",
  tag: "",
};

export function ListingsPage() {
  const {
    listings,
    addListing,
    updateListing,
    deleteListing,
  } = useStore();

  const [filter, setFilter] = useState<"Tümü" | ListingStatus>("Tümü");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "map">("table");
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (filter !== "Tümü" && l.status !== filter) return false;
      if (q) {
        const hay = `${l.id} ${l.loc} ${l.tag ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, filter, query]);

  const counts = useMemo(() => {
    const all = listings.length;
    const aktif = listings.filter((l) => l.status === "Aktif").length;
    const taslak = listings.filter((l) => l.status === "Taslak").length;
    const pasif = listings.filter((l) => l.status === "Pasif").length;
    return { all, aktif, taslak, pasif };
  }, [listings]);

  const totalViews = useMemo(
    () => listings.reduce((sum, l) => sum + l.views, 0),
    [listings],
  );

  const filters = [
    { label: "Tümü" as const, count: counts.all },
    { label: "Aktif" as const, count: counts.aktif },
    { label: "Taslak" as const, count: counts.taslak },
    { label: "Pasif" as const, count: counts.pasif },
  ];

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (l: Listing) => {
    setEditing(l);
    setForm({
      loc: l.loc,
      area: l.area,
      price: l.price,
      status: l.status,
      tag: l.tag ?? "",
    });
  };

  const submit = () => {
    if (!form.loc.trim() || !form.area.trim() || !form.price.trim()) return;
    if (editing) {
      updateListing(editing.id, {
        loc: form.loc,
        area: form.area,
        price: form.price,
        status: form.status,
        tag: form.tag || undefined,
      });
      setEditing(null);
    } else {
      addListing({
        loc: form.loc,
        area: form.area,
        price: form.price,
        status: form.status,
        tag: form.tag || undefined,
      });
      setCreating(false);
    }
    setForm(emptyForm);
  };

  return (
    <PageShell
      eyebrow="Atölye · İlanlar"
      title={<>Arsa <span className="font-medium">portföyü</span></>}
      description="Aktif, taslak ve pasif ilanları yönet. AI önerileriyle fiyat ve görünürlük optimize et."
      actions={
        <>
          <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setView("table")}
              aria-label="Tablo görünümü"
              className={
                view === "table"
                  ? "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-background"
                  : "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              }
            >
              <Rows3 className="h-3.5 w-3.5" />
              Tablo
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-label="Harita görünümü"
              className={
                view === "map"
                  ? "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-background"
                  : "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              }
            >
              <MapIcon className="h-3.5 w-3.5" />
              Harita
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 backdrop-blur-md">
            <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, lokasyon ara…"
              className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md transition-colors hover:bg-background/70"
          >
            <Filter className="h-3.5 w-3.5" />
            Temizle
          </button>
          <button
            type="button"
            onClick={openCreate}
            className={buttonPrimary}
          >
            <Plus className="h-4 w-4" />
            Yeni ilan
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.label)}
            className={
              filter === f.label
                ? "inline-flex items-center gap-2 rounded-full border border-foreground/40 bg-foreground/10 px-3 py-1.5 text-xs font-medium"
                : "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background/60"
            }
          >
            {f.label}
            <span className="font-mono text-[10px] tabular-nums opacity-70">
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Toplam aktif
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {counts.aktif}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Taslak
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {counts.taslak}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Görüntülenme
            </p>
            <p className="mt-2 font-serif text-2xl font-light tabular-nums">
              {totalViews.toLocaleString("tr-TR")}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              +18%
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
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {filter === "Tümü" ? "tümü" : filter}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              {view === "map" ? "İlan haritası" : "İlan listesi"}
            </CardTitle>
            <CardDescription>
              {filtered.length} kayıt · {filter} {query && `· "${query}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className={view === "map" ? "p-4 pt-0" : "px-0"}>
            {view === "map" ? (
              <MapView
                listings={filtered}
                height={560}
                onOpen={(id) => {
                  const l = filtered.find((x) => x.id === id);
                  if (l) openEdit(l);
                }}
              />
            ) : (
              <>
            <div className="grid grid-cols-[100px_1fr_90px_70px_80px_70px_70px] gap-3 border-b border-border/40 px-5 pb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>ID</span>
              <span>Lokasyon</span>
              <span className="text-right">m²</span>
              <span className="text-right">Görüntü</span>
              <span className="text-right">Fiyat</span>
              <span className="text-right">Durum</span>
              <span className="text-right">·</span>
            </div>
            <div className="px-5">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sonuç yok. Filtreyi değiştir veya yeni ilan ekle.
                </p>
              ) : (
                filtered.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[100px_1fr_90px_70px_80px_70px_70px] items-center gap-3 border-b border-border/30 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {l.id}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 flex-none text-muted-foreground" />
                      {l.loc}
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {l.area}
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {l.views}
                    </span>
                    <span className="text-right font-semibold tabular-nums">
                      {l.price}
                    </span>
                    <span
                      className={
                        l.status === "Aktif"
                          ? "justify-self-end rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300"
                          : l.status === "Taslak"
                          ? "justify-self-end rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300"
                          : "justify-self-end rounded-full border border-border/60 bg-background/40 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground"
                      }
                    >
                      {l.status}
                    </span>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(l)}
                        aria-label="Düzenle"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/30 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l)}
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
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="font-serif text-lg font-light">
                AI önerileri
              </CardTitle>
              <CardDescription>İlanlar için akıllı tavsiyeler</CardDescription>
            </div>
            <Sparkles className="h-4 w-4 text-stone-700 dark:text-stone-300" />
          </CardHeader>
          <CardContent className="space-y-2">
            {aiSuggestions.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-border/40 bg-background/30 p-3"
              >
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-700 dark:text-stone-300">
                  {s.tag}
                </span>
                <p className="mt-1 text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.desc}
                </p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-700 dark:text-stone-300 hover:underline"
                >
                  Aç
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
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
        title={editing ? `${editing.id} düzenle` : "Yeni ilan"}
        description={
          editing
            ? "İlan bilgilerini güncelle."
            : "Arsa portföyüne yeni ilan ekle."
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
            <Field label="Lokasyon">
              <input
                type="text"
                value={form.loc}
                onChange={(e) => setForm({ ...form, loc: e.target.value })}
                placeholder="örn. Ayvacık / Çanakkale"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Alan (m²)">
            <input
              type="text"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="8.250 m²"
              className={inputClass}
            />
          </Field>
          <Field label="Fiyat">
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="₺1.8M"
              className={inputClass}
            />
          </Field>
          <Field label="Durum">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ListingStatus })
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
          <Field label="Etiket (opsiyonel)">
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="Deniz manzaralı"
              className={inputClass}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="İlanı sil"
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
                  deleteListing(confirmDelete.id);
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
          Bu işlem geri alınamaz. İlan listesinden ve raporlardan kaldırılacak.
        </p>
      </Dialog>
    </PageShell>
  );
}
