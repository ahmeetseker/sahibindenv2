// src/components/pages/skeletons/reports-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ReportsSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-4"
          >
            <div className="h-3 w-32 rounded bg-foreground/[0.08]" />
            <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
            <div className="h-48 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
