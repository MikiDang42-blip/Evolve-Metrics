import { useMemo, useState } from "react";
import type { Entry, PhaseMode, Profile } from "../types";
import EntriesList from "./EntriesList";
import { groupByMonth, groupByWeek, type PeriodGroup } from "../grouping";
import type { Unit } from "../units";
import { fromLbs } from "../units";
import { formatShort } from "../metrics";

type View = "daily" | "weekly" | "monthly";

interface Props {
  entries: Entry[];
  profile: Profile;
  phaseMode: PhaseMode;
  onRemove: (id: string) => void;
  onEdit: (entry: Entry) => void;
}

const VIEWS: { id: View; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function HistoryView({ entries, profile, phaseMode, onRemove, onEdit }: Props) {
  const [view, setView] = useState<View>("daily");

  const weeks = useMemo(
    () => groupByWeek(entries, profile.startDate),
    [entries, profile.startDate]
  );
  const months = useMemo(() => groupByMonth(entries), [entries]);

  return (
    <div>
      {/* Segmented control */}
      <div className="sticky top-0 z-10 -mx-5 mb-3 bg-bg/95 px-5 pb-2 pt-1 backdrop-blur">
        <div className="flex gap-1 rounded-xl bg-cardalt p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 rounded-lg py-1.5 text-[0.8rem] font-medium transition ${
                view === v.id
                  ? "bg-accent text-white shadow-sm shadow-accent/30"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "daily" && (
        <EntriesList
          entries={entries}
          unit={profile.unit}
          phaseMode={phaseMode}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      )}

      {view === "weekly" && (
        <PeriodList
          groups={weeks}
          unit={profile.unit}
          phaseMode={phaseMode}
          metric="net"
          emptyLabel="Log a few weigh-ins to see weekly averages."
        />
      )}

      {view === "monthly" && (
        <PeriodList
          groups={months}
          unit={profile.unit}
          phaseMode={phaseMode}
          metric="total"
          emptyLabel="Log across a month to see the monthly roll-up."
        />
      )}
    </div>
  );
}

function PeriodList({
  groups,
  unit,
  phaseMode,
  metric,
  emptyLabel,
}: {
  groups: PeriodGroup[];
  unit: Unit;
  phaseMode: PhaseMode;
  metric: "net" | "total";
  emptyLabel: string;
}) {
  if (!groups.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/30">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {groups.map((g, i) => (
        <div
          key={g.key}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
        >
          <PeriodCard group={g} unit={unit} phaseMode={phaseMode} metric={metric} />
        </div>
      ))}
    </div>
  );
}

function PeriodCard({
  group,
  unit,
  phaseMode,
  metric,
}: {
  group: PeriodGroup;
  unit: Unit;
  phaseMode: PhaseMode;
  metric: "net" | "total";
}) {
  const [open, setOpen] = useState(false);

  // "net" view shows change vs previous bucket; "total" shows loss within the bucket
  const value = metric === "net" ? group.netChange : group.lostInPeriod;
  const goodWhenDown = phaseMode !== "bulk";

  const down = value != null && value < -0.05;
  const up = value != null && value > 0.05;
  const isGood = goodWhenDown ? down : up;
  const isBad = goodWhenDown ? up : down;

  const changeDisp = value == null ? null : fromLbs(Math.abs(value), unit);
  const changeWord =
    metric === "total"
      ? down ? "lost" : up ? "gained" : "no change"
      : down ? "lost" : up ? "gained" : "flat";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/3"
      >
        {/* Left: period label */}
        <div className="min-w-0 flex-1">
          <p className="text-[1.05rem] font-bold text-white">{group.title}</p>
          <p className="text-[0.72rem] text-white/45">{group.range}</p>
        </div>

        {/* Right: true weight + change */}
        <div className="shrink-0 text-right">
          <p className="text-[1.05rem] font-semibold text-white">
            {fromLbs(group.avgWeight, unit).toFixed(1)}{" "}
            <span className="text-[0.72rem] font-normal text-white/40">{unit}</span>
          </p>
          {changeDisp != null ? (
            <p
              className={`text-[0.75rem] font-medium ${
                isGood ? "text-loss" : isBad ? "text-red-400" : "text-white/35"
              }`}
            >
              {down ? "↓" : up ? "↑" : "→"} {changeDisp.toFixed(1)} {unit} {changeWord}
            </p>
          ) : (
            <p className="text-[0.72rem] text-white/40">
              {metric === "total" ? "avg weight" : "first period"}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 text-white/25 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      {/* Accordion: the daily logs that make up this period */}
      {open && (
        <div className="animate-fade-up border-t border-white/6 px-4 py-2">
          {[...group.entries].reverse().map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between py-1.5 text-[0.82rem]"
            >
              <span className="text-white/40">{formatShort(e.date)}</span>
              <span className="font-medium text-white/75">
                {fromLbs(e.weight, unit).toFixed(1)} {unit}
              </span>
            </div>
          ))}
          <p className="mt-1 border-t border-white/5 pt-1.5 text-[0.68rem] text-white/30">
            {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"} · avg{" "}
            {fromLbs(group.avgWeight, unit).toFixed(1)} {unit}
          </p>
        </div>
      )}
    </div>
  );
}
