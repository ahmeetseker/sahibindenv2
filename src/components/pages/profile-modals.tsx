import { useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Mail,
  MessageCircle,
  Plug,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  Field,
  buttonGhost,
  buttonPrimary,
  inputClass,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
};

function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors ${
        checked
          ? "bg-emerald-600 dark:bg-emerald-400"
          : "bg-stone-300 dark:bg-stone-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-2.5 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight">{label}</p>
        {desc && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{desc}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export function GeneralSettingsModal({ open, onClose }: ModalProps) {
  const [language, setLanguage] = useState("tr");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [sounds, setSounds] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);
  const [hints, setHints] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Genel ayarlar"
      description="Dil, tema ve uygulama tercihleri."
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhost}>
            Vazgeç
          </button>
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Kaydet
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Dil">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass}
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </Field>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Tema
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTheme(opt)}
                className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                  theme === opt
                    ? "border-foreground bg-foreground/10 text-foreground"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:bg-background/70"
                }`}
              >
                {opt === "light" ? "Açık" : opt === "dark" ? "Koyu" : "Sistem"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <ToggleRow
            label="Bildirim sesleri"
            desc="Yeni mesaj ve hatırlatmalarda kısa bir tını çal."
            checked={sounds}
            onChange={setSounds}
          />
          <ToggleRow
            label="Klavye kısayolları"
            desc="Hızlı eylemler için klavye kısayollarını etkinleştir."
            checked={shortcuts}
            onChange={setShortcuts}
          />
          <ToggleRow
            label="Yapay zeka ipuçları"
            desc="Sayfa kenarında öneri kartlarını göster."
            checked={hints}
            onChange={setHints}
          />
        </div>
      </div>
    </Dialog>
  );
}

export function WorkshopInfoModal({ open, onClose }: ModalProps) {
  const { profile, updateProfile } = useStore();
  const [form, setForm] = useState({
    workshop: profile.workshop,
    address: "Bağdat Cad. No: 124, Kadıköy / İstanbul",
    taxNo: "9821 4567 80",
    phone: profile.phone,
    email: profile.email,
    website: "atelier.arsa",
  });

  const submit = () => {
    updateProfile({
      workshop: form.workshop,
      phone: form.phone,
      email: form.email,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Atölye bilgisi"
      description="İletişim, vergi numarası ve marka bilgileri."
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhost}>
            Vazgeç
          </button>
          <button type="button" onClick={submit} className={buttonPrimary}>
            Kaydet
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Atölye adı">
          <input
            type="text"
            value={form.workshop}
            onChange={(e) => setForm({ ...form, workshop: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Web sitesi">
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Vergi numarası">
          <input
            type="text"
            value={form.taxNo}
            onChange={(e) => setForm({ ...form, taxNo: e.target.value })}
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
        <Field label="E-posta">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Adres" hint="Sözleşmelerde ve faturalarda görünür.">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Logo
          </p>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/30 p-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-stone-700/10 text-sm font-semibold text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
              {form.workshop.charAt(0)}
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              PNG veya SVG · en az 256×256 px
            </div>
            <button type="button" className={buttonGhost}>
              Yükle
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

const TEAM_DEFAULT = [
  { name: "Tuna Yıldız", role: "Atölye Yöneticisi", you: true },
  { name: "Selin Aksoy", role: "Kıdemli Danışman" },
  { name: "Mert Demir", role: "Danışman" },
  { name: "Ece Kaya", role: "Tapu Uzmanı" },
];

export function TeamRoleModal({ open, onClose }: ModalProps) {
  const [team, setTeam] = useState(TEAM_DEFAULT);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Danışman");

  const remove = (i: number) => setTeam(team.filter((_, idx) => idx !== i));
  const invite = () => {
    if (!inviteEmail.includes("@")) return;
    setTeam([...team, { name: inviteEmail.split("@")[0], role: inviteRole }]);
    setInviteEmail("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ekip & rol"
      description={`${team.length} kişilik ekip · roller ve davetler`}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className={buttonPrimary}>
          Tamam
        </button>
      }
    >
      <div className="space-y-3">
        <ul className="space-y-1.5">
          {team.map((m, i) => (
            <li
              key={`${m.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 p-3"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-stone-700/10 text-sm font-semibold text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                {m.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {m.name}
                  {m.you && (
                    <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      Sen
                    </span>
                  )}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {m.role}
                </p>
              </div>
              {!m.you && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`${m.name} kaldır`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition-colors hover:bg-red-600/10 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Davetiye gönder
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ornek@atolye.com"
              className={inputClass}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className={inputClass}
            >
              <option>Danışman</option>
              <option>Kıdemli Danışman</option>
              <option>Tapu Uzmanı</option>
              <option>Asistan</option>
            </select>
            <button type="button" onClick={invite} className={buttonPrimary}>
              <Plus className="h-3.5 w-3.5" />
              Davet
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function IntegrationModal({ open, onClose }: ModalProps) {
  const [integrations, setIntegrations] = useState({
    whatsapp: true,
    tapu: true,
    eimza: false,
    sahibinden: true,
  });
  const [apiKey] = useState("sk_atelier_•••• •••• 4b9c");

  const flip = (k: keyof typeof integrations) =>
    setIntegrations((s) => ({ ...s, [k]: !s[k] }));

  const items: {
    key: keyof typeof integrations;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: "whatsapp",
      label: "WhatsApp Business",
      desc: "Müşteri mesajlarını panele bağla.",
      icon: MessageCircle,
    },
    {
      key: "tapu",
      label: "Tapu Sorgulama",
      desc: "TKGM API ile tapu bilgilerini çek.",
      icon: ShieldCheck,
    },
    {
      key: "eimza",
      label: "E-imza",
      desc: "Sözleşmeleri elektronik imza ile gönder.",
      icon: KeyRound,
    },
    {
      key: "sahibinden",
      label: "Sahibinden API",
      desc: "İlan yayını ve durum senkronizasyonu.",
      icon: Plug,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Entegrasyon & API"
      description="Atölyeni dış servislere bağla."
      size="lg"
      footer={
        <button type="button" onClick={onClose} className={buttonPrimary}>
          Tamam
        </button>
      }
    >
      <div className="space-y-3">
        <ul className="space-y-1.5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = integrations[it.key];
            return (
              <li
                key={it.key}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/30 p-3"
              >
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {it.label}
                    {active && (
                      <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                        Bağlı
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => flip(it.key)}
                  className={active ? buttonGhost : buttonPrimary}
                >
                  {active ? "Bağlantıyı kes" : "Bağla"}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-border/40 bg-background/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            API anahtarı
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border/60 bg-background/60 px-3 py-2 font-mono text-xs">
              {apiKey}
            </code>
            <button type="button" className={buttonGhost} aria-label="Kopyala">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={buttonGhost}>
              <RefreshCw className="h-3.5 w-3.5" />
              Yenile
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function SecurityModal({ open, onClose }: ModalProps) {
  const [twoFA, setTwoFA] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const sessions = [
    { device: "MacBook Pro · macOS 15", loc: "İstanbul · 88.224.x", current: true, time: "Şimdi" },
    { device: "iPhone 16 · Safari", loc: "İstanbul · 88.224.x", time: "2 saat önce" },
    { device: "iPad · Safari", loc: "İstanbul · 88.224.x", time: "3 gün önce" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Güvenlik"
      description="Şifre, iki adımlı doğrulama ve aktif oturumlar."
      size="lg"
      footer={
        <button type="button" onClick={onClose} className={buttonPrimary}>
          Tamam
        </button>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Şifre değiştir
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              placeholder="Mevcut şifre"
              className={inputClass}
            />
            <input
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              placeholder="Yeni şifre"
              className={inputClass}
            />
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              placeholder="Tekrar"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <ToggleRow
            label="İki adımlı doğrulama"
            desc="Girişte SMS veya kimlik doğrulayıcı uygulamasından kod iste."
            checked={twoFA}
            onChange={setTwoFA}
          />
          <ToggleRow
            label="Yeni cihaz uyarıları"
            desc="Yeni cihazdan giriş olduğunda e-posta gönder."
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Aktif oturumlar
          </p>
          <ul className="mt-2 space-y-1.5">
            {sessions.map((s) => (
              <li
                key={s.device}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/30 p-3"
              >
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {s.device}
                    {s.current && (
                      <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                        Bu cihaz
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.loc}</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.time}
                  </p>
                </div>
                {!s.current && (
                  <button type="button" className={buttonGhost}>
                    Sonlandır
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

export function NotificationsModal({ open, onClose }: ModalProps) {
  const [prefs, setPrefs] = useState({
    hotCustomer: true,
    pendingDoc: true,
    deposit: true,
    newListing: false,
    teamMessage: true,
    weeklyReport: false,
  });
  const [channel, setChannel] = useState({
    email: true,
    push: true,
    whatsapp: false,
  });
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  const flip = <K extends keyof typeof prefs>(k: K) =>
    setPrefs((s) => ({ ...s, [k]: !s[k] }));
  const flipChannel = <K extends keyof typeof channel>(k: K) =>
    setChannel((s) => ({ ...s, [k]: !s[k] }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bildirim tercihleri"
      description="Hangi olaylar için ve nereden uyarı alacağını seç."
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhost}>
            Vazgeç
          </button>
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Kaydet
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Olaylar
          </p>
          <ToggleRow
            label="Sıcak müşteri eşleşmesi"
            desc="Skoru yüksek müşteri için yeni eşleşme bulunduğunda."
            checked={prefs.hotCustomer}
            onChange={() => flip("hotCustomer")}
          />
          <ToggleRow
            label="Bekleyen evrak"
            desc="Tapu / kaparo evrakı 24 saatten uzun süre bekleyince."
            checked={prefs.pendingDoc}
            onChange={() => flip("pendingDoc")}
          />
          <ToggleRow
            label="Kaparo hareketi"
            desc="Yeni kaparo, iade veya iptal."
            checked={prefs.deposit}
            onChange={() => flip("deposit")}
          />
          <ToggleRow
            label="Yeni ilan ekibe düştü"
            desc="Ekibin paylaştığı yeni ilanlar."
            checked={prefs.newListing}
            onChange={() => flip("newListing")}
          />
          <ToggleRow
            label="Ekip mesajı"
            desc="@bahsedilme veya doğrudan mesaj geldiğinde."
            checked={prefs.teamMessage}
            onChange={() => flip("teamMessage")}
          />
          <ToggleRow
            label="Haftalık özet raporu"
            desc="Pazartesi 09:00 — geçen hafta özetin."
            checked={prefs.weeklyReport}
            onChange={() => flip("weeklyReport")}
          />
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Kanallar
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                { k: "email" as const, label: "E-posta", icon: Mail },
                { k: "push" as const, label: "Anlık bildirim", icon: Smartphone },
                {
                  k: "whatsapp" as const,
                  label: "WhatsApp",
                  icon: MessageCircle,
                },
              ]
            ).map(({ k, label, icon: Icon }) => {
              const on = channel[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => flipChannel(k)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    on
                      ? "border-emerald-700/40 bg-emerald-700/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:bg-background/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {on && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Sessiz saatler
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Field label="Başlangıç">
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Bitiş">
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
