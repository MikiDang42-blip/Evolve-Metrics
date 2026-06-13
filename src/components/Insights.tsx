import type { Entry, Profile } from "../types";
import {
  bmi,
  bmiCategory,
  latestWeight,
  loggingStreak,
  projectedGoalDate,
  remainingToGoal,
  weeklyRate,
} from "../metrics";
import { fromLbs } from "../units";

interface Props {
  entries: Entry[];
  profile: Profile;
}

export default function Insights({ entries, profile }: Props) {
  const unit = profile.unit;
  const rate = weeklyRate(entries); // lbs/week, negative = losing
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
      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          label="Avg / week"
          value={`${losing ? "−" : rate > 0.05 ? "+" : ""}${rateDisp.toFixed(1)}`}
          unit={unit}
          tone={losing ? "good" : rate > 0.05 ? "bad" : "neutral"}
        />
        <Tile
          label="To goal"
          value={remaining > 0 ? remainingDisp.toFixed(1) : "0.0"}
          unit={unit}
          tone={remaining > 0 ? "neutral" : "good"}
        />
        <Tile label="Est. goal date" value={projLabel} />
        <Tile
          label="BMI"
          value={bmiVal > 0 ? bmiVal.toFixed(1) : "—"}
          sub={bmiVal > 0 ? bmiCategory(bmiVal) : undefined}
        />
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
