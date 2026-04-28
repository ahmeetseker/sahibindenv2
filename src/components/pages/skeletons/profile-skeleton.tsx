// src/components/pages/skeletons/profile-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ProfileSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="mb-8 rounded-xl border border-border/60 bg-background/40 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-foreground/[0.10]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
          <div className="h-3 w-64 rounded bg-foreground/[0.06]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-4 w-40 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-56 rounded bg-foreground/[0.06]" />
            <div className="h-3 w-44 rounded bg-foreground/[0.06]" />
            <div className="h-9 w-32 rounded-md bg-foreground/[0.08]" />
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
