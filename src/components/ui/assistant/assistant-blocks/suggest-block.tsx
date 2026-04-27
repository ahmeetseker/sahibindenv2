interface Props {
  chips: string[];
  onPick: (chip: string) => void;
}

export function SuggestBlock({ chips, onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          type="button"
          key={chip}
          onClick={() => onPick(chip)}
          className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-stone-700/40 hover:text-foreground dark:hover:border-stone-300/40"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
