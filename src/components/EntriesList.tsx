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
          const goodForPhase = phaseMode === "bulk" ? vsMA > 0.1 : vsMA < -0.1;
          const aboveAvg = vsMA > 0.1;
          const belowAvg = vsMA < -0.1;
          const vsMaDisp = fromLbs(Math.abs(vsMA), unit);
          const hasMacros = e.calories != null || e.protein != null;

          return (
            <div
              key={e.id}
              className="rounded-xl border border-white/7 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2">
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
                  {goodForPhase
                    ? phaseMode === "bulk" ? "↑" : "↓"
                    : aboveAvg || belowAvg ? "~" : "="}
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

                {/* vs 7-day avg */}
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
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/6 hover:text-accentlight active:scale-90"
                    aria-label="Edit entry"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(e.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-red-500/10 hover:text-red-400 active:scale-90"
                  aria-label="Delete entry"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Macro pill — only shown if entry has macro data */}
              {hasMacros && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.calories != null && (
                    <MacroPill label={`${e.calories} kcal`} accent />
                  )}
                  {e.protein != null && <MacroPill label={`P ${e.protein}g`} />}
                  {e.carbs != null && <MacroPill label={`C ${e.carbs}g`} />}
                  {e.fats != null && <MacroPill label={`F ${e.fats}g`} />}
                </div>
              )}
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

function MacroPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.62rem] font-medium ${
        accent
          ? "bg-accent/12 text-accentlight/80"
          : "bg-white/6 text-white/35"
      }`}
    >
      {label}
    </span>
  );
}
