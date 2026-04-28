// src/components/pages/skeletons/finance-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function FinanceSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
            <div className="h-7 w-32 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-28 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-background/40 p-4 h-72" />

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 5 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
