import { useState } from "react";
import { PlusIcon, ScaleIcon } from "../icons";

interface Props {
  unit: string;
  onAdd: (weight: number, note?: string) => void;
}

export default function AddEntry({ unit, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);

  const submit = () => {
    const w = parseFloat(value);
    if (!isFinite(w) || w <= 0) return;
    onAdd(Math.round(w * 10) / 10);
    setValue("");
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

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
          placeholder={`Log today's weight (${unit})`}
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
    </section>
  );
}
