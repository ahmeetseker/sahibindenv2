import { MiniChart } from '@/components/ui/mini-chart';
import type { ChartDatum, ChartKind } from '@/lib/assistant/types';

interface Props {
  chart: ChartKind;
  data: ChartDatum[];
  caption?: string;
}

export function ChartBlock({ chart, data, caption }: Props) {
  void chart;
  if (data.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur-md">
      <MiniChart label={caption ?? 'Trend'} data={data} />
    </div>
  );
}
