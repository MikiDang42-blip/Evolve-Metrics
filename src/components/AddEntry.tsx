import { useState } from "react";
import { PlusIcon, ScaleIcon } from "../icons";
import type { Unit } from "../units";
import { toLbs } from "../units";

interface Props {
  unit: Unit;
  onAdd: (weightLbs: number, note: string | undefined, date: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddEntry({ unit, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today());
  const [flash, setFlash] = useState(false);

  const submit = () => {
    const entered = parseFloat(value);
    if (!isFinite(entered) || entered <= 0) return;
    const lbs = Math.round(toLbs(entered, unit) * 10) / 10;
    onAdd(lbs, undefined, date);
    setValue("");
    setDate(today());
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  const isToday = date === today();

  return (
    <section>
      <h2 className="mb-2 px-1 text-[0.95rem] font-semibold text-white">Add Entry</h2>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-card px-3 py-2.5 transition ${
          flash ? "border-loss/60" : "border-white/8"
        }`}
      >
        <ScaleIcon className="h-5 w-5 shrink-0 text-white/35" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          inputMode="decimal"
          placeholder={`Log weight (${unit})`}
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
      <label className="mt-2 flex items-center gap-2 px-1 text-[0.75rem] text-white/40">
        <span>For:</span>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value || today())}
          className="rounded-md border border-white/10 bg-cardalt px-2 py-1 text-white/70 focus:border-accent focus:outline-none"
        />
        {!isToday && <span className="text-accentlight">backdated</span>}
      </label>
    </section>
  );
}
