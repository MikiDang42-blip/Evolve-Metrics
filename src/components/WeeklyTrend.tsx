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
  const [showWaist, setShowWaist] = useState(false);
  const unit = profile.unit;

  const hasWaist = useMemo(() => entries.some((e) => e.waist != null), [entries]);

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? Infinity;
    let filtered = entries;
    if (isFinite(days) && entries.length) {
      const last = entries[entries.length - 1].date;
      const cutoff = isoAddDays(last, -days);
      filtered = entries.filter((e) => e.date >= cutoff);
    }
    const maMap = movingAverageMap(entries); // full history for accurate window
    return trendSeries(filtered, 28).map((p) => {
      const rawEntry = entries.find((e) => e.date === p.date);
      return {
        ...p,
        weight: Math.round(fromLbs(p.weight, unit) * 10) / 10,
        ma7: Math.round(fromLbs(maMap[p.date] ?? p.weight, unit) * 10) / 10,
        waist: rawEntry?.waist ?? null,
      };
    });
  }, [entries, range, unit]);

  if (data.length < 2) return null;

  const weightVals = data.flatMap((d) => [d.weight, ...(showMA ? [d.ma7] : [])]);
  const wMin = Math.floor(Math.min(...weightVals) - 1);
  const wMax = Math.ceil(Math.max(...weightVals) + 1);

  const waistVals = data.map((d) => d.waist).filter((v): v is number => v != null);
  const waistMin = waistVals.length ? Math.floor(Math.min(...waistVals) - 0.5) : 0;
  const waistMax = waistVals.length ? Math.ceil(Math.max(...waistVals) + 0.5) : 50;

  const goalDisp = Math.round(fromLbs(profile.goalWeight, unit) * 10) / 10;
  const showGoal = goalDisp >= wMin && goalDisp <= wMax;

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      {/* Header */}
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

      {/* Legend / toggles */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LegendBtn
          color="linear-gradient(to right, #a78bfa60, #4ade8060)"
          label="Daily"
          active
          onClick={() => {}}
          asDiv
        />
        <LegendBtn
          color="#a78bfa"
          label="7-day avg"
          active={showMA}
          onClick={() => setShowMA((v) => !v)}
        />
        {hasWaist && (
          <LegendBtn
            color="#f9a8d4"
            label="Waist"
            active={showWaist}
            onClick={() => setShowWaist((v) => !v)}
          />
        )}
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <YAxis yAxisId="w" domain={[wMin, wMax]} hide />
            {showWaist && hasWaist && (
              <YAxis yAxisId="waist" orientation="right" domain={[waistMin, waistMax]} hide />
            )}
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 5) - 1)}
              minTickGap={20}
            />
            {showGoal && (
              <ReferenceLine
                yAxisId="w"
                y={goalDisp}
                stroke="#4ade80"
                strokeDasharray="4 4"
                strokeOpacity={0.45}
                label={{
                  value: "goal",
                  fill: "rgba(74,222,128,0.55)",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}
            <Tooltip
              cursor={{ stroke: "rgba(139,92,246,0.35)", strokeWidth: 1 }}
              contentStyle={{
                background: "#1b1b26",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.45)" }}
              formatter={(v: unknown, name: string) => {
                if (v == null) return [null, null];
                const n = typeof v === "number" ? v : parseFloat(String(v));
                if (name === "ma7") return [`${n} ${unit}`, "7-day avg"];
                if (name === "waist") return [`${n}"`, "Waist"];
                return [`${n} ${unit}`, "Weight"];
              }}
            />
            {/* Raw daily area */}
            <Area
              yAxisId="w"
              type="monotone"
              dataKey="weight"
              stroke="url(#lineGrad)"
              strokeWidth={1.5}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "#4ade80", stroke: "#fff", strokeWidth: 1.5 }}
            />
            {/* 7-day MA */}
            {showMA && (
              <Line
                yAxisId="w"
                type="monotone"
                dataKey="ma7"
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#a78bfa", stroke: "#fff", strokeWidth: 1.5 }}
              />
            )}
            {/* Waist — secondary axis, pink */}
            {showWaist && hasWaist && (
              <Line
                yAxisId="waist"
                type="monotone"
                dataKey="waist"
                stroke="#f9a8d4"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f9a8d4", strokeWidth: 0 }}
                connectNulls
                activeDot={{ r: 4, fill: "#f9a8d4", stroke: "#fff", strokeWidth: 1.5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendBtn({
  color,
  label,
  active,
  onClick,
  asDiv,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
  asDiv?: boolean;
}) {
  const inner = (
    <>
      <span
        className="h-0.5 w-4 rounded-full"
        style={{ background: color, opacity: active ? 1 : 0.3 }}
      />
      <span className={`text-[0.7rem] transition ${active ? "text-white/60" : "text-white/25"}`}>
        {label}
      </span>
    </>
  );
  if (asDiv) return <div className="flex items-center gap-1.5">{inner}</div>;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 transition ${
        active ? "bg-white/8" : "bg-transparent"
      }`}
    >
      {inner}
    </button>
  );
}
