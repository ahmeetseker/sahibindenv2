import { ArrowRight, Sparkles } from 'lucide-react';

const MODULES = [
  { title: 'İlanlar', desc: 'Arsa portföyü, yeni ilan ekleme, düzenleme ve pasife alma.', cta: 'İlanları aç', target: 'listings' },
  { title: 'Kategoriler', desc: 'Arsa tipleri, bölgeler, etiketler ve özel filtre setleri.', cta: 'Kategorileri aç', target: 'listings' },
  { title: 'Müşteriler', desc: 'CRM defteri, görüşmeler, kohort analizi ve iletişim geçmişi.', cta: 'CRM defterine git', target: 'customers' },
  { title: 'Finans', desc: 'Satışlar, tahsilat, komisyon, tapu masrafları ve bekleyen ödemeler.', cta: 'Finansı aç', target: 'finance' },
  { title: 'Raporlar', desc: 'Otomatik analiz, haftalık özet, performans ve dışa aktarım.', cta: 'Raporları aç', target: 'reports' },
  { title: 'Ayarlar', desc: 'Ekip, yetkilendirme, entegrasyonlar ve otomasyon kuralları.', cta: 'Ayarları aç', target: 'profile' },
] as const;

interface Props {
  draft: string;
  onDraftChange: (v: string) => void;
  onActivateChat: () => void;
  onPickModule: (target: string) => void;
}

export function AssistantModulesScreen({ draft, onDraftChange, onActivateChat, onPickModule }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <div className="mb-3 flex w-full items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Atölye Modülleri
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            06 modül
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <button
              type="button"
              key={m.title}
              onClick={() => onPickModule(m.target)}
              className="group flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/40 p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:bg-background/70"
            >
              <div className="space-y-1">
                <h3 className="text-[16px] font-semibold leading-tight tracking-tight">{m.title}</h3>
                <p className="text-[12.5px] leading-snug text-muted-foreground">{m.desc}</p>
              </div>
              <span className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-[12.5px] font-medium transition-colors group-hover:bg-foreground group-hover:text-background">
                <ArrowRight className="h-3.5 w-3.5" />
                {m.cta}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative border-t border-border/60 bg-background/50 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-background/50 px-3 py-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 flex-none text-stone-800 dark:text-stone-200" />
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              onDraftChange(e.target.value);
              if (e.target.value.length > 0) onActivateChat();
            }}
            onFocus={onActivateChat}
            onClick={onActivateChat}
            placeholder="Bana sor…"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden flex-none rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-block">
            ⌘ K
          </kbd>
          <button
            type="button"
            aria-label="Sohbete geç"
            onClick={onActivateChat}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
