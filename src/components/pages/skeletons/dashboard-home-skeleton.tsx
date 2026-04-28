// src/components/pages/skeletons/dashboard-home-skeleton.tsx
import { cn } from '@/lib/utils';

export function DashboardHomeSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Sayfa yükleniyor"
      className={cn(
        'relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32 animate-pulse',
      )}
    >
      <div className="space-y-3 mb-8">
        <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
        <div className="h-12 w-96 max-w-full rounded-md bg-foreground/[0.10]" />
        <div className="h-3.5 w-[32rem] max-w-full rounded bg-foreground/[0.06]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            <div className="h-7 w-24 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-32 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 lg:col-span-2 h-64" />
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 h-64" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 h-24"
          />
        ))}
      </div>
    </div>
  );
}
