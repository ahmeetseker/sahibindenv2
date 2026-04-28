// src/components/pages/skeletons/messages-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function MessagesSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-foreground/[0.08]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-foreground/[0.10]" />
                <div className="h-3 w-44 rounded bg-foreground/[0.06]" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 p-4 min-h-[480px] flex flex-col gap-3">
          <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
          <div className="h-3 w-32 rounded bg-foreground/[0.06]" />
          <div className="flex-1 space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}
              >
                <div className="h-12 w-2/3 rounded-2xl bg-foreground/[0.06]" />
              </div>
            ))}
          </div>
          <div className="h-10 w-full rounded-md bg-foreground/[0.08]" />
        </div>
      </div>
    </PageSkeletonShell>
  );
}
