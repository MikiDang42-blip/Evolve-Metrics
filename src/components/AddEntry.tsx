import { useState } from "react";
import { PlusIcon, ScaleIcon } from "../icons";
import type { Unit } from "../units";
import { toLbs } from "../units";
import { todayISO } from "../dateUtils";

interface Props {
  unit: Unit;
  onAdd: (weightLbs: number, waist: number | null, note: string | undefined, date: string) => void;
}

export default function AddEntry({ unit, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [waist, setWaist] = useState("");
  const [date, setDate] = useState(todayISO);
  const [showExtra, setShowExtra] = useState(false);
  const [flash, setFlash] = useState(false);

  const today = todayISO();

  const submit = () => {
    const entered = parseFloat(value);
    if (!isFinite(entered) || entered <= 0) return;
    const lbs = Math.round(toLbs(entered, unit) * 10) / 10;
    const waistVal = waist ? parseFloat(waist) : null;
    onAdd(lbs, waistVal && isFinite(waistVal) ? waistVal : null, undefined, date);
    setValue("");
    setWaist("");
    setDate(today);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  const isToday = date === today;

  return (
    <section>
      <h2 className="mb-2 px-1 text-[0.95rem] font-semibold text-white">Add Entry</h2>
      <div
        className={`rounded-2xl border bg-card transition ${
          flash ? "border-loss/60" : "border-white/8"
        }`}
      >
        {/* Weight row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <ScaleIcon className="h-5 w-5 shrink-0 text-white/35" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="decimal"
            placeholder={`Weight (${unit})`}
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!value}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition enabled:hover:bg-accentlight enabled:active:scale-95 disabled:opacity-40"
            aria-label="Add entry"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Optional waist row */}
        {showExtra && (
          <div className="flex items-center gap-2 border-t border-white/8 px-3 py-2">
            <span className="text-[0.85rem] text-white/40">Waist (in)</span>
            <input
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 34.5"
              className="min-w-0 flex-1 bg-transparent text-[0.85rem] text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center gap-3 border-t border-white/6 px-3 py-1.5">
          <label className="flex items-center gap-2 text-[0.72rem] text-white/35">
            <span>For:</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value || today)}
              className="rounded border border-white/10 bg-cardalt px-1.5 py-0.5 text-white/60 focus:border-accent focus:outline-none"
            />
            {!isToday && <span className="text-accentlight">backdated</span>}
          </label>
          <button
            onClick={() => setShowExtra((v) => !v)}
            className={`ml-auto text-[0.7rem] transition ${
              showExtra ? "text-accentlight" : "text-white/30 hover:text-white/50"
            }`}
          >
            {showExtra ? "− waist" : "+ waist"}
          </button>
        </div>
      </div>
    </section>
  );
}
