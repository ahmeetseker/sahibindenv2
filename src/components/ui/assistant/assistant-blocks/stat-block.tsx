interface Props {
  label: string;
  value: string;
  delta?: string;
}

export function StatBlock({ label, value, delta }: Props) {
  return (
    <div className="flex min-w-[120px] flex-col gap-0.5 rounded-xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur-md">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="font-serif text-2xl font-light leading-none tracking-tight">{value}</span>
      {delta && <span className="text-[11px] text-muted-foreground">{delta}</span>}
    </div>
  );
}
