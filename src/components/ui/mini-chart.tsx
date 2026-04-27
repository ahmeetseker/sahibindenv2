import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface MiniChartDatum {
  label: string;
  value: number;
}

export interface MiniChartProps {
  label: string;
  data: MiniChartDatum[];
  unit?: string;
  pulseDot?: boolean;
  className?: string;
}

export function MiniChart({
  label,
  data,
  unit,
  pulseDot = true,
  className,
}: MiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const maxValue = Math.max(...data.map((d) => d.value));

  useEffect(() => {
    if (hoveredIndex !== null) {
      setDisplayValue(data[hoveredIndex].value);
    }
  }, [hoveredIndex, data]);

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setHoveredIndex(null);
        setTimeout(() => setDisplayValue(null), 150);
      }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md transition-colors hover:border-border",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {pulseDot && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stone-700/60 opacity-60 dark:bg-stone-300/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-stone-800 dark:bg-stone-200" />
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="relative flex h-6 items-center">
          <span
            className={cn(
              "text-base font-semibold tabular-nums transition-all duration-300 ease-out",
              isHovering && displayValue !== null
                ? "text-foreground opacity-100"
                : "text-muted-foreground opacity-50"
            )}
          >
            {displayValue !== null ? displayValue : ""}
            {unit && (
              <span
                className={cn(
                  "ml-0.5 text-[10px] font-normal text-muted-foreground transition-opacity duration-300",
                  displayValue !== null ? "opacity-100" : "opacity-0"
                )}
              >
                {unit}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex h-16 items-end gap-1.5">
        {data.map((item, index) => {
          const heightPx = (item.value / maxValue) * 64;
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          const isNeighbor =
            hoveredIndex !== null &&
            (index === hoveredIndex - 1 || index === hoveredIndex + 1);

          return (
            <div
              key={`${item.label}-${index}`}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div
                className={cn(
                  "w-full origin-bottom cursor-pointer rounded-full transition-all duration-300 ease-out",
                  isHovered
                    ? "bg-foreground"
                    : isNeighbor
                    ? "bg-foreground/30"
                    : isAnyHovered
                    ? "bg-foreground/10"
                    : "bg-foreground/20 group-hover:bg-foreground/25"
                )}
                style={{
                  height: `${heightPx}px`,
                  transform: isHovered
                    ? "scaleX(1.2) scaleY(1.02)"
                    : isNeighbor
                    ? "scaleX(1.05)"
                    : "scaleX(1)",
                }}
              />
              <span
                className={cn(
                  "mt-1.5 text-[9px] font-medium transition-all duration-300",
                  isHovered ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {item.label.charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
