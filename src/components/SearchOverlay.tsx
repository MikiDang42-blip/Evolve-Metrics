import { useEffect, useRef, useState } from "react";
import type { Entry } from "../types";
import type { Unit } from "../units";
import { fromLbs } from "../units";
import { formatShort } from "../metrics";
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, SearchIcon, TrashIcon } from "../icons";

interface Props {
  entries: Entry[];
  unit: Unit;
  onClose: () => void;
  onRemove: (id: string) => void;
  onEdit: (entry: Entry) => void;
}

export default function SearchOverlay({ entries, unit, onClose, onRemove, onEdit }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const chronological = entries;

  const filtered = q.trim()
    ? [...entries]
        .reverse()
        .filter((e) => {
          const weightStr = fromLbs(e.weight, unit).toFixed(1);
          const rawStr = e.weight.toFixed(1);
          return (
            e.date.includes(q) ||
            formatShort(e.date).toLowerCase().includes(q.toLowerCase()) ||
            weightStr.includes(q) ||
            rawStr.includes(q)
          );
        })
    : [...entries].reverse().slice(0, 30);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-bg">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <SearchIcon className="h-5 w-5 shrink-0 text-white/40" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by date or weight…"
          className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/5"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Results */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-[0.85rem] text-white/30">No entries match.</p>
        )}
        {filtered.map((e) => {
          const idx = chronological.findIndex((c) => c.id === e.id);
          const prev = idx > 0 ? chronological[idx - 1] : null;
          const delta = prev ? Math.round((e.weight - prev.weight) * 10) / 10 : 0;
          const down = delta < 0;
          const deltaDisp = fromLbs(Math.abs(delta), unit);

          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-card px-3.5 py-3"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15">
                {down ? (
                  <ArrowDownIcon className="h-4 w-4 text-loss" />
                ) : delta > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-xs text-white/50">•</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-white">
                  {fromLbs(e.weight, unit).toFixed(1)} {unit}
                </p>
                <p className="text-[0.72rem] text-white/40">{formatShort(e.date)}</p>
              </div>
              {prev && delta !== 0 && (
                <span className={`text-[0.78rem] font-medium ${down ? "text-loss" : "text-red-400"}`}>
                  {down ? "−" : "+"}
                  {deltaDisp.toFixed(1)}
                </span>
              )}
              <button
                onClick={() => { onEdit(e); onClose(); }}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-accentlight"
                aria-label="Edit"
              >
                ✎
              </button>
              <button
                onClick={() => onRemove(e.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/25 transition hover:bg-white/5 hover:text-red-400"
                aria-label="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!q && entries.length > 30 && (
          <p className="py-3 text-center text-[0.75rem] text-white/30">
            Showing most recent 30. Search to find older entries.
          </p>
        )}
      </div>
    </div>
  );
}
