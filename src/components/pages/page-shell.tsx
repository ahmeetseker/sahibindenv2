import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32",
        className,
      )}
    >
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          {eyebrow && (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="font-serif text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground md:max-w-xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      {children}
    </div>
  );
}
