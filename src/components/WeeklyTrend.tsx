import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "../metrics";

interface Props {
  data: TrendPoint[];
  unit: string;
}

export default function WeeklyTrend({ data, unit }: Props) {
  const weights = data.map((d) => d.weight);
  const min = Math.floor(Math.min(...weights) - 1);
  const max = Math.ceil(Math.max(...weights) + 1);

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-[0.95rem] font-semibold text-white">Weekly Trend</h2>
        <span className="text-[0.75rem] text-white/35">{data.length} points</span>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
            <YAxis domain={[min, max]} hide />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 5) - 1)}
              minTickGap={20}
            />
            <Tooltip
              cursor={{ stroke: "rgba(139,92,246,0.4)", strokeWidth: 1 }}
              contentStyle={{
                background: "#1b1b26",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              formatter={(v: number) => [`${v} ${unit}`, "Weight"]}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="url(#lineGrad)"
              strokeWidth={2.5}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#a78bfa", stroke: "#fff", strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
