// src/components/pages/skeletons/calendar-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function CalendarSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-32 rounded-md bg-foreground/[0.08]" />
        <div className="h-8 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="ml-auto h-8 w-28 rounded-md bg-foreground/[0.08]" />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-background/40 px-3 py-2">
              <div className="h-3 w-10 rounded bg-foreground/[0.08]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="bg-background/40 h-24 p-2">
              <div className="h-3 w-6 rounded bg-foreground/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </PageSkeletonShell>
  );
}
