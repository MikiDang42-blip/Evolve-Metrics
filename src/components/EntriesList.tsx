import type { Entry } from "../types";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, TrashIcon } from "../icons";
import { formatShort } from "../metrics";
import type { Unit } from "../units";
import { fromLbs } from "../units";

interface Props {
  entries: Entry[];
  unit: Unit;
  title?: string;
  onRemove: (id: string) => void;
  onEdit?: (entry: Entry) => void;
}

export default function EntriesList({ entries, unit, title = "All Entries", onRemove, onEdit }: Props) {
  const chronological = entries;
  const rows = [...entries].reverse();

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[0.95rem] font-semibold text-white">{title}</h2>
        <span className="text-[0.75rem] text-white/35">{entries.length} logged</span>
      </div>
      <div className="space-y-2">
        {rows.map((e) => {
          const idx = chronological.findIndex((c) => c.id === e.id);
          const prev = idx > 0 ? chronological[idx - 1] : null;
          const delta = prev ? Math.round((e.weight - prev.weight) * 10) / 10 : 0;
          const down = delta < 0;
          const deltaDisp = fromLbs(Math.abs(delta), unit);

          return (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-card px-3 py-2.5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15">
                {down ? (
                  <ArrowDownIcon className="h-4 w-4 text-loss" />
                ) : delta > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-xs text-white/40">•</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-white">
                  {fromLbs(e.weight, unit).toFixed(1)}{" "}
                  <span className="text-[0.8rem] font-normal text-white/50">{unit}</span>
                </p>
                <p className="text-[0.72rem] text-white/40">{formatShort(e.date)}</p>
              </div>
              {prev && delta !== 0 && (
                <span
                  className={`shrink-0 text-[0.78rem] font-medium ${
                    down ? "text-loss" : "text-red-400"
                  }`}
                >
                  {down ? "−" : "+"}
                  {deltaDisp.toFixed(1)}
                </span>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(e)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-accentlight active:scale-90"
                  aria-label="Edit entry"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onRemove(e.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-red-500/10 hover:text-red-400 active:scale-90"
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
