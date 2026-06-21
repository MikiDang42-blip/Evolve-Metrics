import { useState } from "react";
import type { Entry, Profile } from "../types";
import {
  bmi,
  bmiCategory as bmiCat,
  isOnPlateau,
  latestWeight,
  loggingStreak,
  paceStatus,
  projectedGoalDate,
  remainingToGoal,
  weeklyRate,
} from "../metrics";
import { fromLbs } from "../units";
import { InfoIcon } from "../icons";

interface Props {
  entries: Entry[];
  profile: Profile;
}

export default function Insights({ entries, profile }: Props) {
  const unit = profile.unit;
  const rate = weeklyRate(entries, 28);
  const rateDisp = fromLbs(Math.abs(rate), unit);
  const losing = rate < -0.05;

  const remaining = remainingToGoal(entries, profile);
  const remainingDisp = fromLbs(remaining, unit);

  const proj = projectedGoalDate(entries, profile);
  const projLabel =
    proj === "reached"
      ? "Reached 🎉"
      : proj
      ? new Date(proj).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "—";

  const current = latestWeight(entries) ?? profile.startWeight;
  const bmiVal = bmi(current, profile.heightIn);

  const streak = loggingStreak(entries);
  const pace = paceStatus(entries, profile);
  const plateau = isOnPlateau(entries);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[0.95rem] font-semibold text-white">Insights</h2>
        {streak > 1 && (
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[0.72rem] font-semibold text-accentlight">
            🔥 {streak}-day streak
          </span>
        )}
      </div>

      {/* Plateau warning */}
      {plateau && (
        <div className="mb-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3.5 py-3">
          <p className="text-[0.82rem] font-semibold text-yellow-300">⚡ Plateau detected</p>
          <p className="mt-0.5 text-[0.75rem] text-yellow-200/60">
            No net change in the last 14 days. Consider adjusting calories or increasing
            activity to break through.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {/* Rate + pace indicator */}
        <div className="rounded-2xl border border-white/8 bg-card p-3.5">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-white/40">
            Avg / week
          </p>
          <p className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`text-[1.35rem] font-bold leading-none ${
                losing ? "text-loss" : rate > 0.05 ? "text-red-400" : "text-white"
              }`}
            >
              {losing ? "−" : rate > 0.05 ? "+" : ""}
              {rateDisp.toFixed(1)}
            </span>
            <span className="text-[0.75rem] font-medium text-white/40">{unit}</span>
          </p>
          {pace && pace !== "reached" && (
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                pace === "ahead"
                  ? "bg-loss/15 text-loss"
                  : pace === "on_track"
                  ? "bg-accent/15 text-accentlight"
                  : "bg-red-400/15 text-red-400"
              }`}
            >
              {pace === "ahead" ? "Ahead of pace" : pace === "on_track" ? "On track" : "Behind pace"}
            </span>
          )}
        </div>

        <Tile
          label="To goal"
          value={remaining > 0 ? remainingDisp.toFixed(1) : "0.0"}
          unit={unit}
          tone={remaining > 0 ? "neutral" : "good"}
        />
        <Tile label="Est. goal date" value={projLabel} />
        <BMITile bmiVal={bmiVal} heightIn={profile.heightIn} />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  unit,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good" ? "text-loss" : tone === "bad" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/8 bg-card p-3.5">
      <p className="text-[0.7rem] font-medium uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-[1.35rem] font-bold leading-none ${toneClass}`}>{value}</span>
        {unit && <span className="text-[0.75rem] font-medium text-white/40">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-[0.72rem] text-white/45">{sub}</p>}
    </div>
  );
}

function BMITile({ bmiVal, heightIn }: { bmiVal: number; heightIn: number }) {
  const [showTip, setShowTip] = useState(false);
  const cat = bmiVal > 0 ? bmiCat(bmiVal) : undefined;

  return (
    <div className="rounded-2xl border border-white/8 bg-card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-white/40">BMI</p>
        <button
          onClick={() => setShowTip((v) => !v)}
          className="rounded-full p-0.5 text-white/25 hover:text-white/50"
          aria-label="BMI info"
        >
          <InfoIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {showTip ? (
        <p className="mt-1.5 text-[0.68rem] leading-relaxed text-white/45">
          BMI doesn't account for muscle mass. Muscular or athletic people often
          read as "Overweight" even at a healthy body composition.
        </p>
      ) : (
        <>
          {!heightIn ? (
            <p className="mt-1.5 text-[0.78rem] text-white/30">Set height in Profile</p>
          ) : (
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className="text-[1.35rem] font-bold leading-none text-white">
                {bmiVal > 0 ? bmiVal.toFixed(1) : "—"}
              </span>
            </p>
          )}
          {cat && <p className="mt-0.5 text-[0.72rem] text-white/45">{cat}</p>}
        </>
      )}
    </div>
  );
}

