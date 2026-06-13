import type { Entry } from "../types";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "../icons";
import { formatShort } from "../metrics";

interface Props {
  entries: Entry[];
  unit: string;
  onRemove: (id: string) => void;
}

export default function EntriesList({ entries, unit, onRemove }: Props) {
  // newest first, with delta vs the chronologically previous entry
  const chronological = entries;
  const rows = [...entries].reverse();

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[0.95rem] font-semibold text-white">All Entries</h2>
        <span className="text-[0.75rem] text-white/35">{entries.length} logged</span>
      </div>
      <div className="space-y-2">
        {rows.map((e) => {
          const idx = chronological.findIndex((c) => c.id === e.id);
          const prev = idx > 0 ? chronological[idx - 1] : null;
          const delta = prev ? Math.round((e.weight - prev.weight) * 10) / 10 : 0;
          const down = delta < 0;
          return (
            <div
              key={e.id}
              className="group flex items-center gap-3 rounded-xl border border-white/8 bg-card px-3.5 py-3"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accentlight">
                {down ? (
                  <ArrowDownIcon className="h-4 w-4 text-loss" />
                ) : delta > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-xs">•</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-white">
                  {e.weight.toFixed(1)} {unit}
                </p>
                <p className="text-[0.72rem] text-white/40">{formatShort(e.date)}</p>
              </div>
              {prev && delta !== 0 && (
                <span
                  className={`text-[0.78rem] font-medium ${
                    down ? "text-loss" : "text-red-400"
                  }`}
                >
                  {down ? "" : "+"}
                  {delta.toFixed(1)}
                </span>
              )}
              <button
                onClick={() => onRemove(e.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/25 transition hover:bg-white/5 hover:text-red-400 active:scale-90"
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
