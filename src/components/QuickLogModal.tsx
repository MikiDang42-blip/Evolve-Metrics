import { useEffect, useRef, useState } from "react";
import { CloseIcon, ScaleIcon } from "../icons";
import type { Unit } from "../units";
import { fromLbs, toLbs } from "../units";
import { todayISO } from "../dateUtils";
import { latestWeight } from "../metrics";
import type { Entry } from "../types";

interface Props {
  isOpen: boolean;
  unit: Unit;
  entries: Entry[];
  onAdd: (weightLbs: number, waist: null, note: undefined, date: string) => void;
  onClose: () => void;
}

export default function QuickLogModal({ isOpen, unit, entries, onAdd, onClose }: Props) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastWeight = latestWeight(entries);
  const placeholder = lastWeight
    ? fromLbs(lastWeight, unit).toFixed(1)
    : unit === "kg" ? "84.0" : "185.0";

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = () => {
    const entered = parseFloat(value || placeholder);
    if (!isFinite(entered) || entered <= 0) return;
    const lbs = Math.round(toLbs(entered, unit) * 10) / 10;
    onAdd(lbs, null, undefined, todayISO());
    setFlash(true);
    setTimeout(() => { setFlash(false); onClose(); }, 600);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-card px-5 pb-10 pt-4 animate-slide-up">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[1rem] font-semibold text-white">Quick Log</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/40 hover:bg-white/6 hover:text-white/70"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mb-4 text-[0.75rem] text-white/35">
          Today · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>

        {/* Big weight input */}
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
            flash ? "border-loss/60 bg-loss/5" : "border-white/10 bg-cardalt"
          }`}
        >
          <ScaleIcon className="h-5 w-5 shrink-0 text-white/35" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="decimal"
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-[1.3rem] font-semibold text-white placeholder:text-white/20 focus:outline-none"
          />
          <span className="shrink-0 text-[0.9rem] text-white/40">{unit}</span>
        </div>

        <button
          onClick={submit}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-accent to-accentlight py-3.5 text-[1rem] font-semibold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
        >
          {flash ? "Logged ✓" : "Log Weight"}
        </button>

        <p className="mt-3 text-center text-[0.72rem] text-white/25">
          For detailed options, go to the Log tab
        </p>
      </div>
    </>
  );
}
