import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface RevenueLineDatum {
  month: string;
  value: number;
}

export interface RevenueLineChartProps {
  data: RevenueLineDatum[];
  formatValue?: (value: number) => string;
  height?: number;
}

const defaultFormat = (v: number) =>
  `₺${(v / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;

export function RevenueLineChart({
  data,
  formatValue = defaultFormat,
  height = 240,
}: RevenueLineChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="revLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.45} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{
              fill: "currentColor",
              fillOpacity: 0.55,
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => formatValue(v)}
            tick={{
              fill: "currentColor",
              fillOpacity: 0.45,
              fontSize: 10,
              fontFamily: "var(--font-mono, monospace)",
            }}
            width={48}
          />
          <Tooltip
            cursor={{
              stroke: "currentColor",
              strokeOpacity: 0.2,
              strokeDasharray: "3 3",
            }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{
              color: "hsl(var(--muted-foreground))",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: 4,
            }}
            formatter={(value) => [formatValue(Number(value)), "Ciro"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={{
              r: 3,
              fill: "currentColor",
              stroke: "hsl(var(--card))",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: "currentColor",
              stroke: "hsl(var(--card))",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
