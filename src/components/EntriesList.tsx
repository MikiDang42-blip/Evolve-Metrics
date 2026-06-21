import { useMemo } from "react";
import type { Entry } from "../types";
import { PencilIcon, TrashIcon } from "../icons";
import { formatShort, movingAverageMap } from "../metrics";
import type { Unit } from "../units";
import { fromLbs } from "../units";

interface Props {
  entries: Entry[];
  unit: Unit;
  title?: string;
  phaseMode?: "cut" | "bulk" | "maintain" | "recomp";
  onRemove: (id: string) => void;
  onEdit?: (entry: Entry) => void;
}

export default function EntriesList({
  entries,
  unit,
  title = "All Entries",
  phaseMode = "cut",
  onRemove,
  onEdit,
}: Props) {
  // Pre-compute 7-day MA for every entry date — O(n²) but n is small
  const maMap = useMemo(() => movingAverageMap(entries), [entries]);

  const rows = [...entries].reverse();

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[0.95rem] font-semibold text-white">{title}</h2>
        <span className="text-[0.75rem] text-white/35">{entries.length} logged</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((e) => {
          const ma = maMap[e.date] ?? e.weight;
          const vsMA = Math.round((e.weight - ma) * 10) / 10;
          // For a cut: below MA is encouraging, above MA is just water (neutral)
          // For a bulk: above MA is encouraging, below is neutral
          const goodForPhase =
            phaseMode === "bulk" ? vsMA > 0.1 : vsMA < -0.1;
          const aboveAvg = vsMA > 0.1;
          const belowAvg = vsMA < -0.1;
          const vsMaDisp = fromLbs(Math.abs(vsMA), unit);

          return (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-xl border border-white/7 bg-card px-3 py-2.5"
            >
              {/* Trend indicator vs MA */}
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[0.65rem] font-bold ${
                  goodForPhase
                    ? "bg-loss/12 text-loss"
                    : aboveAvg || belowAvg
                    ? "bg-white/6 text-white/30"
                    : "bg-white/5 text-white/20"
                }`}
              >
                {goodForPhase ? (phaseMode === "bulk" ? "↑" : "↓") : aboveAvg || belowAvg ? "~" : "="}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[0.93rem] font-semibold text-white">
                  {fromLbs(e.weight, unit).toFixed(1)}{" "}
                  <span className="text-[0.78rem] font-normal text-white/45">{unit}</span>
                  {e.waist != null && (
                    <span className="ml-2 text-[0.72rem] font-normal text-white/35">
                      {e.waist}" waist
                    </span>
                  )}
                </p>
                <p className="text-[0.7rem] text-white/35">{formatShort(e.date)}</p>
              </div>

              {/* vs 7-day avg — only show meaningful deviations */}
              {(aboveAvg || belowAvg) && (
                <span
                  className={`shrink-0 text-[0.75rem] font-medium tabular-nums ${
                    goodForPhase ? "text-loss" : "text-white/35"
                  }`}
                >
                  {aboveAvg ? "+" : "−"}
                  {vsMaDisp.toFixed(1)} avg
                </span>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(e)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/25 transition hover:bg-white/5 hover:text-accentlight active:scale-90"
                  aria-label="Edit entry"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onRemove(e.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/25 transition hover:bg-red-500/10 hover:text-red-400 active:scale-90"
                aria-label="Delete entry"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!rows.length && (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/30">
            No entries yet. Log your first weigh-in above.
          </p>
        )}
      </div>
    </section>
  );
}
