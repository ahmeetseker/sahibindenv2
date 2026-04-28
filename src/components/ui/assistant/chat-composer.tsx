import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  initialText?: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  quickChips?: string[];
  placeholder?: string;
}

export function ChatComposer({
  initialText = '',
  onSubmit,
  autoFocus = true,
  quickChips,
  placeholder = "Ne arıyorsun?… örn. 'Çanakkale'de deniz manzaralı'",
}: Props) {
  const [value, setValue] = useState(initialText);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (initialText) setValue(initialText);
  }, [initialText]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="px-4 pb-4 pt-2"
    >
      <div className="rounded-2xl border border-border/70 bg-card/50 shadow-sm backdrop-blur-md transition focus-within:border-border focus-within:shadow-md">
        <div className="flex items-end gap-3 px-4 pt-3 pb-3">
          <Sparkles className="mt-2 h-4 w-4 flex-none text-stone-700 dark:text-stone-300" />
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={placeholder}
            aria-label="Asistan'a sor"
            className="flex-1 resize-none bg-transparent py-1.5 text-[13.5px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="mb-1.5 hidden flex-none items-center rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex">
            ⌘ K
          </kbd>
          <button
            type="submit"
            aria-label="Gönder"
            className="mb-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {quickChips && quickChips.length > 0 && (
          <>
            <div className="mx-4 border-t border-border/50" />
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSubmit(chip)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
                >
                  <span aria-hidden className="text-stone-600/70 dark:text-stone-400/70">
                    ✦
                  </span>
                  {chip}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </form>
  );
}
