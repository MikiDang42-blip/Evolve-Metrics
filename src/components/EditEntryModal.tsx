import { useEffect, useState } from "react";
import type { Entry } from "../types";
import type { Unit } from "../units";
import { fromLbs, toLbs } from "../units";
import { CloseIcon } from "../icons";
import { todayISO } from "../dateUtils";

interface Props {
  entry: Entry | null;
  unit: Unit;
  onSave: (id: string, weightLbs: number, date: string, waist?: number | null) => void;
  onClose: () => void;
}

export default function EditEntryModal({ entry, unit, onSave, onClose }: Props) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [waist, setWaist] = useState("");

  useEffect(() => {
    if (entry) {
      setWeight(fromLbs(entry.weight, unit).toFixed(1));
      setDate(entry.date);
      setWaist(entry.waist != null ? String(entry.waist) : "");
    }
  }, [entry, unit]);

  if (!entry) return null;

  const save = () => {
    const w = parseFloat(weight);
    if (!isFinite(w) || w <= 0 || !date) return;
    const waistVal = waist ? parseFloat(waist) : null;
    onSave(
      entry.id,
      Math.round(toLbs(w, unit) * 10) / 10,
      date,
      waistVal && isFinite(waistVal) && waistVal > 0 ? waistVal : null,
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
