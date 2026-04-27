import { useState } from "react";
import {
  Bell,
  Building2,
  Key,
  LogOut,
  Pencil,
  RotateCcw,
  Settings2,
  Shield,
  Users,
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
import { useStore } from "@/lib/store";
import { PageShell } from "./page-shell";

const shortcuts = [
  { icon: Settings2, label: "Genel ayarlar", desc: "Dil, tema, bildirim sesleri" },
  { icon: Users, label: "Ekip & rol", desc: "4 kişilik ekip · roller ve davetler" },
  { icon: Building2, label: "Atölye bilgisi", desc: "İletişim, vergi numarası, logo" },
  { icon: Key, label: "Entegrasyon & API", desc: "WhatsApp, Tapu, e-imza" },
  { icon: Shield, label: "Güvenlik", desc: "Şifre, 2FA, oturum geçmişi" },
  { icon: Bell, label: "Bildirim tercihleri", desc: "Sıcak müşteri, evrak, kaparo" },
];

const sessions = [
  { device: "MacBook Pro · macOS 15", loc: "İstanbul · 88.224.x", current: true, time: "Şimdi" },
  { device: "iPhone 16 · Safari", loc: "İstanbul · 88.224.x", time: "2 saat önce" },
  { device: "iPad · Safari", loc: "İstanbul · 88.224.x", time: "3 gün önce" },
];

export function ProfilePage() {
  const { profile, updateProfile, resetStore } = useStore();
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [form, setForm] = useState(profile);

  const openEdit = () => {
    setForm(profile);
    setEditing(true);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    updateProfile(form);
    setEditing(false);
  };

  return (
    <PageShell
      eyebrow="Atölye · Profil"
      title={
        <>
          {profile.name.split(" ")[0]} · <span className="font-medium">Atölye</span>
        </>
      }
      description="Hesap, ekip, atölye bilgileri ve entegrasyonlar."
      actions={
        <>
          <button type="button" onClick={openEdit} className={buttonGhost}>
            <Pencil className="h-3.5 w-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className={buttonGhost}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Sıfırla
          </button>
          <button type="button" className={buttonGhost}>
            <LogOut className="h-3.5 w-3.5" />
            Çıkış
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-stone-700/10 text-2xl font-medium text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
              {profile.name.charAt(0)}
            </div>
            <div>
              <p className="font-serif text-2xl font-light">{profile.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {profile.role} · {profile.city}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Sahibinden Pro
              </span>
              <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Aktif
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="font-serif text-lg font-light">
                Atölye bilgileri
              </CardTitle>
              <CardDescription>Sahibinden Pro · 4 kişilik ekip</CardDescription>
            </div>
            <button type="button" onClick={openEdit} className={buttonGhost}>
              <Pencil className="h-3 w-3" />
              Güncelle
            </button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Atölye adı" value={profile.workshop} />
            <Info label="E-posta" value={profile.email} />
            <Info label="Telefon" value={profile.phone} mono />
            <Info label="Şehir" value={profile.city} />
            <div className="sm:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Plan
              </p>
              <p className="mt-1 text-sm">
                Sahibinden Pro · sınırsız ilan · sınırsız müşteri · sınırsız asistan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Hesap kısayolları
            </CardTitle>
            <CardDescription>Sık kullanılan ayarlar</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  type="button"
                  className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/30 p-3 text-left transition-colors hover:bg-background/60"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-light">
              Aktif oturumlar
            </CardTitle>
            <CardDescription>3 cihaz · son 7 gün</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.device}
                className="rounded-xl border border-border/40 bg-background/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{s.device}</p>
                  {s.current && (
                    <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      Bu cihaz
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.loc}</p>
                <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.time}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Profili düzenle"
        description="Bilgilerin yerel olarak tutulur ve sayfalarda anında yansır."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
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
          <Field label="Ad Soyad">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Rol">
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Atölye adı">
            <input
              type="text"
              value={form.workshop}
              onChange={(e) => setForm({ ...form, workshop: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Şehir">
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="E-posta">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Telefon">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Veriyi sıfırla"
        description="Tüm yerel veriler silinecek (ilanlar, müşteriler, işlemler, takvim, sohbetler)."
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className={buttonGhost}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                resetStore();
                setConfirmReset(false);
              }}
              className={buttonDanger}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sıfırla
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Bu işlem geri alınamaz. Tüm girilen veriler örnek hâline döner.
        </p>
      </Dialog>
    </PageShell>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-sm ${mono ? "tabular-nums" : ""}`}>{value}</p>
    </div>
  );
}
