import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Entry, Profile } from "../types";
import { trendSeries } from "../metrics";
import { fromLbs } from "../units";

interface Props {
  entries: Entry[];
  profile: Profile;
}

const RANGES = [
  { id: "1m", label: "1M", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "6m", label: "6M", days: 180 },
  { id: "all", label: "All", days: Infinity },
] as const;

export default function WeeklyTrend({ entries, profile }: Props) {
  const [range, setRange] = useState<string>("3m");
  const unit = profile.unit;

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? Infinity;
    let filtered = entries;
    if (isFinite(days) && entries.length) {
      const cutoff = new Date(entries[entries.length - 1].date);
      cutoff.setDate(cutoff.getDate() - days);
      filtered = entries.filter((e) => new Date(e.date) >= cutoff);
    }
    return trendSeries(filtered, 28).map((p) => ({
      ...p,
      weight: Math.round(fromLbs(p.weight, unit) * 10) / 10,
    }));
  }, [entries, range, unit]);

  if (data.length < 2) {
    return (
      <section className="rounded-2xl border border-white/8 bg-card p-4">
        <h2 className="text-[0.95rem] font-semibold text-white">Weekly Trend</h2>
        <p className="mt-3 text-[0.8rem] text-white/40">
          Log a few more entries to see your trend.
        </p>
      </section>
    );
  }

  const weights = data.map((d) => d.weight);
  const min = Math.floor(Math.min(...weights) - 1);
  const max = Math.ceil(Math.max(...weights) + 1);
  const goalDisp = Math.round(fromLbs(profile.goalWeight, unit) * 10) / 10;
  const showGoal = goalDisp >= min && goalDisp <= max;

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[0.95rem] font-semibold text-white">Weekly Trend</h2>
        <div className="flex gap-1 rounded-lg bg-cardalt p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-md px-2 py-0.5 text-[0.7rem] font-medium transition ${
                range === r.id ? "bg-accent text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
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
            {showGoal && (
              <ReferenceLine
                y={goalDisp}
                stroke="#4ade80"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: "goal",
                  fill: "rgba(74,222,128,0.7)",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}
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
