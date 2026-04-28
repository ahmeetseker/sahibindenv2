// src/components/pages/skeletons/search-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function SearchSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="mb-6">
        <div className="h-12 w-full rounded-xl bg-foreground/[0.08]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-32 rounded-lg bg-foreground/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-1/2 rounded bg-foreground/[0.06]" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded bg-foreground/[0.08]" />
              <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
