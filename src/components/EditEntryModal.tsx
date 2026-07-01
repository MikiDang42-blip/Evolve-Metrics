import { useEffect, useState } from "react";
import type { Entry } from "../types";
import type { Unit } from "../units";
import { fromLbs, toLbs } from "../units";
import { CloseIcon } from "../icons";
import { todayISO } from "../dateUtils";

type Macros = { protein?: number; carbs?: number; fats?: number; calories?: number };

interface Props {
  entry: Entry | null;
  unit: Unit;
  onSave: (
    id: string,
    weightLbs: number,
    date: string,
    waist?: number | null,
    macros?: Macros,
    note?: string | null,
  ) => void;
  onClose: () => void;
}

export default function EditEntryModal({ entry, unit, onSave, onClose }: Props) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [calories, setCalories] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (entry) {
      setWeight(fromLbs(entry.weight, unit).toFixed(1));
      setDate(entry.date);
      setWaist(entry.waist != null ? String(entry.waist) : "");
      setNote(entry.note ?? "");
      setProtein(entry.protein != null ? String(entry.protein) : "");
      setCarbs(entry.carbs != null ? String(entry.carbs) : "");
      setFats(entry.fats != null ? String(entry.fats) : "");
      setCalories(entry.calories != null ? String(entry.calories) : "");
      // Auto-expand the extras section when the entry already has extras
      setShowMore(
        entry.note != null || entry.protein != null || entry.calories != null
      );
    }
  }, [entry, unit]);

  if (!entry) return null;

  const save = () => {
    const w = parseFloat(weight);
    if (!isFinite(w) || w <= 0 || !date) return;
    const waistVal = waist ? parseFloat(waist) : null;
    const macros: Macros = {};
    const p = parseFloat(protein); if (p > 0) macros.protein = p;
    const c = parseFloat(carbs);   if (c > 0) macros.carbs = c;
    const f = parseFloat(fats);    if (f > 0) macros.fats = f;
    const k = parseFloat(calories); if (k > 0) macros.calories = k;
    onSave(
      entry.id,
      Math.round(toLbs(w, unit) * 10) / 10,
      date,
      waistVal && isFinite(waistVal) && waistVal > 0 ? waistVal : null,
      macros,
      note.trim() || null,
    );
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-50 bg-black/60"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-card px-5 pb-8 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[1.05rem] font-semibold text-white">Edit Entry</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/5"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] text-white/50">
              Weight ({unit})
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-cardalt px-4 py-3 text-[1.1rem] font-semibold text-white focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] text-white/50">Waist (in) — optional</span>
            <input
              type="number"
              inputMode="decimal"
              value={waist}
              placeholder="e.g. 34.5"
              onChange={(e) => setWaist(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-cardalt px-4 py-3 text-[0.95rem] text-white placeholder:text-white/25 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] text-white/50">Date</span>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-cardalt px-4 py-3 text-[0.95rem] text-white focus:border-accent focus:outline-none"
            />
          </label>

          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-[0.75rem] text-accentlight/70 transition hover:text-accentlight"
          >
            {showMore ? "− Hide note & macros" : "+ Note & macros"}
          </button>

          {showMore && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] text-white/50">Note</span>
                <input
                  value={note}
                  maxLength={200}
                  placeholder="e.g. salty dinner, refeed day…"
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-cardalt px-4 py-3 text-[0.9rem] text-white placeholder:text-white/25 focus:border-accent focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <MacroInput label="Calories (kcal)" value={calories} onChange={setCalories} />
                <MacroInput label="Protein (g)" value={protein} onChange={setProtein} />
                <MacroInput label="Carbs (g)" value={carbs} onChange={setCarbs} />
                <MacroInput label="Fats (g)" value={fats} onChange={setFats} />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-[0.9rem] font-medium text-white/60 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-xl bg-accent py-3 text-[0.9rem] font-semibold text-white transition hover:bg-accentlight active:scale-[0.99]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.72rem] text-white/45">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder="—"
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-cardalt px-3 py-2 text-[0.9rem] text-white placeholder:text-white/20 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
