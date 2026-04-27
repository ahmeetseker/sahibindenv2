import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  initialText?: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
}

export function ChatComposer({ initialText = '', onSubmit, autoFocus = true }: Props) {
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
      className="flex items-end gap-2 border-t border-border/60 bg-background/50 px-4 py-3 backdrop-blur-md"
    >
      <Sparkles className="mt-2.5 h-4 w-4 flex-none text-stone-800 dark:text-stone-200" />
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
        placeholder="Asistan'a sor…"
        aria-label="Asistan'a sor"
        className="flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      <kbd className="mb-2 hidden flex-none rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-block">
        ⌘ ↵
      </kbd>
      <button
        type="submit"
        aria-label="Gönder"
        className="mb-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
