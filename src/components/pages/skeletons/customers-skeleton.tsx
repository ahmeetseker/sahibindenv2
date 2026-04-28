// src/components/pages/skeletons/customers-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function CustomersSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-72 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08] ml-auto" />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
