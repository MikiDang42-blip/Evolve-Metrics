import { useState } from "react";
import { PlusIcon, ScaleIcon } from "../icons";
import type { Unit } from "../units";
import { toLbs } from "../units";
import { todayISO } from "../dateUtils";

export type Macros = { protein?: number; carbs?: number; fats?: number; calories?: number };

interface Props {
  unit: Unit;
  onAdd: (
    weightLbs: number,
    waist: number | null,
    note: string | undefined,
    date: string,
    macros?: Macros,
  ) => void;
}

export default function AddEntry({ unit, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [waist, setWaist] = useState("");
  const [date, setDate] = useState(todayISO);
  const [showExtra, setShowExtra] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [calories, setCalories] = useState("");
  const [flash, setFlash] = useState(false);

  const today = todayISO();

  const submit = () => {
    const entered = parseFloat(value);
    if (!isFinite(entered) || entered <= 0) return;
    const lbs = Math.round(toLbs(entered, unit) * 10) / 10;
    const waistVal = waist ? parseFloat(waist) : null;
    const macros: Macros = {};
    const p = parseFloat(protein); if (p > 0) macros.protein = p;
    const c = parseFloat(carbs);   if (c > 0) macros.carbs = c;
    const f = parseFloat(fats);    if (f > 0) macros.fats = f;
    const k = parseFloat(calories); if (k > 0) macros.calories = k;
    onAdd(lbs, waistVal && isFinite(waistVal) ? waistVal : null, undefined, date, macros);
    setValue(""); setWaist(""); setDate(today);
    setProtein(""); setCarbs(""); setFats(""); setCalories("");
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
        <div className="flex items-center gap-2 px-4 py-3">
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
          <div className="flex items-center gap-2 border-t border-white/8 px-4 py-2.5">
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

        {/* Optional macros section */}
        {showMacros && (
          <div className="border-t border-white/8 px-4 py-3 space-y-2.5">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-white/30">
              Today's macros — optional
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MacroField label="Calories" unit="kcal" value={calories} onChange={setCalories} />
              <MacroField label="Protein" unit="g" value={protein} onChange={setProtein} />
              <MacroField label="Carbs" unit="g" value={carbs} onChange={setCarbs} />
              <MacroField label="Fats" unit="g" value={fats} onChange={setFats} />
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/6 px-4 py-1.5">
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
          <div className="ml-auto flex gap-3">
            <button
              onClick={() => setShowExtra((v) => !v)}
              className={`text-[0.7rem] transition ${
                showExtra ? "text-accentlight" : "text-white/30 hover:text-white/50"
              }`}
            >
              {showExtra ? "− waist" : "+ waist"}
            </button>
            <button
              onClick={() => setShowMacros((v) => !v)}
              className={`text-[0.7rem] transition ${
                showMacros ? "text-accentlight" : "text-white/30 hover:text-white/50"
              }`}
            >
              {showMacros ? "− macros" : "+ macros"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MacroField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.68rem] text-white/40">
        {label} <span className="text-white/25">({unit})</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder="—"
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-cardalt px-2.5 py-1.5 text-[0.88rem] text-white placeholder:text-white/20 focus:border-accent focus:outline-none"
      />
    </div>
  );
}
