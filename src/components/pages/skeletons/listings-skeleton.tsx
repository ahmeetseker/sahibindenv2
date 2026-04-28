// src/components/pages/skeletons/listings-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ListingsSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-72 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08] ml-auto" />
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2"
          >
            <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            <div className="h-4 w-44 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-56 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 6 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
