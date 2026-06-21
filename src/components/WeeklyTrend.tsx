import { useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Entry, Profile } from "../types";
import { movingAverageMap, trendSeries } from "../metrics";
import { fromLbs } from "../units";
import { isoAddDays } from "../dateUtils";

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
  const [showMA, setShowMA] = useState(true);
  const unit = profile.unit;

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? Infinity;
    let filtered = entries;
    if (isFinite(days) && entries.length) {
      const last = entries[entries.length - 1].date;
      const cutoff = isoAddDays(last, -days);
      filtered = entries.filter((e) => e.date >= cutoff);
    }

    // Build full-range MA map (uses all entries for accurate window)
    const maMap = movingAverageMap(entries);

    return trendSeries(filtered, 28).map((p) => ({
      ...p,
      weight: Math.round(fromLbs(p.weight, unit) * 10) / 10,
      ma7: Math.round(fromLbs(maMap[p.date] ?? p.weight, unit) * 10) / 10,
    }));
  }, [entries, range, unit]);

  if (data.length < 2) {
    return (
      <section className="rounded-2xl border border-white/8 bg-card p-4">
        <h2 className="text-[0.95rem] font-semibold text-white">Trend</h2>
        <p className="mt-3 text-[0.8rem] text-white/40">
          Log a few more entries to see your trend.
        </p>
      </section>
    );
  }

  const allWeights = data.flatMap((d) => [d.weight, ...(showMA ? [d.ma7] : [])]);
  const min = Math.floor(Math.min(...allWeights) - 1);
  const max = Math.ceil(Math.max(...allWeights) + 1);
  const goalDisp = Math.round(fromLbs(profile.goalWeight, unit) * 10) / 10;
  const showGoal = goalDisp >= min && goalDisp <= max;

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      {/* Header row */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[0.95rem] font-semibold text-white">Trend</h2>
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

      {/* Legend */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-gradient-to-r from-violet-400 to-emerald-400" />
          <span className="text-[0.7rem] text-white/40">Daily</span>
        </div>
        <button
          onClick={() => setShowMA(!showMA)}
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 transition ${
            showMA ? "bg-accent/15" : "bg-white/5"
          }`}
        >
          <span
            className={`h-0.5 w-5 rounded-full ${showMA ? "bg-accentlight" : "bg-white/20"}`}
          />
          <span className={`text-[0.7rem] ${showMA ? "text-accentlight" : "text-white/30"}`}>
            7-day avg
          </span>
        </button>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.5} />
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
                strokeOpacity={0.5}
                label={{
                  value: "goal",
                  fill: "rgba(74,222,128,0.6)",
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
              formatter={(v: number, name: string) => [
                `${v} ${unit}`,
                name === "ma7" ? "7-day avg" : "Weight",
              ]}
            />
            {/* Raw daily line (translucent area + line) */}
            <Area
              type="monotone"
              dataKey="weight"
              stroke="url(#lineGrad)"
              strokeWidth={1.5}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "#4ade80", stroke: "#fff", strokeWidth: 1.5 }}
            />
            {/* 7-day moving average — solid purple, no fill */}
            {showMA && (
              <Line
                type="monotone"
                dataKey="ma7"
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#a78bfa", stroke: "#fff", strokeWidth: 1.5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
