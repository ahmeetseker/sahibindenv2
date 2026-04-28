import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageSkeletonShellProps {
  children?: ReactNode;
  showActions?: boolean;
  className?: string;
}

export function PageSkeletonShell({
  children,
  showActions = false,
  className,
}: PageSkeletonShellProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Sayfa yükleniyor"
      className={cn(
        'relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32 animate-pulse',
        className,
      )}
    >
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
          <div className="h-12 w-80 max-w-full rounded-md bg-foreground/[0.10]" />
          <div className="h-3.5 w-[28rem] max-w-full rounded bg-foreground/[0.06]" />
        </div>
        {showActions && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-9 w-28 rounded-md bg-foreground/[0.08]" />
            <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
