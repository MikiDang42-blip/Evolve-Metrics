import { useState } from "react";
import type { Entry, Profile } from "../types";
import {
  bmi,
  formatMonthYear,
  getPhaseMode,
  loggingStreak,
  paceStatus,
  plateauCoach,
  projectedGoalDate,
  remainingToGoal,
  weeklyRate,
  latestWeight,
  type PlateauCoach,
} from "../metrics";
import { fromLbs } from "../units";
import { InfoIcon } from "../icons";

interface Props {
  entries: Entry[];
  profile: Profile;
}

export default function Insights({ entries, profile }: Props) {
  const unit = profile.unit;
  const mode = getPhaseMode(profile.phase);

  const rate = weeklyRate(entries, 28); // lbs/wk, negative = losing
  const rateDisp = fromLbs(Math.abs(rate), unit);
  const losing = rate < -0.05;

  const remaining = remainingToGoal(entries, profile);
  const remainingDisp = fromLbs(remaining, unit);

  const proj = projectedGoalDate(entries, profile);
  const projLabel =
    proj === "reached"
      ? "Reached 🎉"
      : proj
      ? formatMonthYear(proj)
      : "—";

  const current = latestWeight(entries) ?? profile.startWeight;
  const startBMI = bmi(profile.startWeight, profile.heightIn);
  const currentBMI = bmi(current, profile.heightIn);
  const bmiDrop = startBMI > 0 ? Math.round((startBMI - currentBMI) * 10) / 10 : 0;

  const streak = loggingStreak(entries);
  const pace = paceStatus(entries, profile);
  const coach = plateauCoach(entries, profile);

  // Rate display sign & label are phase-aware
  const ratePrefix =
    mode === "bulk"
      ? rate > 0.05 ? "+" : rate < -0.05 ? "−" : "±"
      : losing ? "−" : rate > 0.05 ? "+" : "±";
  const rateTone =
    mode === "bulk"
      ? rate > 0.05 ? "good" : rate < -0.05 ? "bad" : "neutral"
      : losing ? "good" : rate > 0.05 ? "bad" : "neutral";

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

      {/* Plateau coaching card */}
      {coach && <PlateauCard coach={coach} />}

      <div className="grid grid-cols-2 gap-2.5">
        {/* Rate + pace pill */}
        <div className="rounded-2xl border border-white/8 bg-card p-3.5">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-white/40">
            {mode === "bulk" ? "Gain / week" : mode === "maintain" ? "Change / week" : "Loss / week"}
          </p>
          <p className="mt-1.5 flex items-baseline gap-0.5">
            <span
              className={`text-[1.35rem] font-bold leading-none ${
                rateTone === "good" ? "text-loss" : rateTone === "bad" ? "text-red-400" : "text-white"
              }`}
            >
              {ratePrefix}{rateDisp.toFixed(1)}
            </span>
            <span className="ml-1 text-[0.75rem] font-medium text-white/40">{unit}</span>
          </p>
          {/* Phase-aware pace pill */}
          {mode === "cut" && pace && pace !== "reached" && (
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
          {mode === "maintain" && (
            <span className="mt-1.5 inline-block rounded-full bg-white/8 px-2 py-0.5 text-[0.65rem] font-medium text-white/50">
              {Math.abs(rate) < 0.15 ? "Holding steady" : "Drifting"}
            </span>
          )}
          {mode === "recomp" && (
            <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-medium text-accentlight/70">
              Recomp
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

        {/* BMI as trajectory */}
        <BMITile
          current={currentBMI}
          start={startBMI}
          drop={bmiDrop}
          heightIn={profile.heightIn}
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
  return (
    <div className="rounded-2xl border border-white/8 bg-card p-3.5">
      <p className="text-[0.7rem] font-medium uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`text-[1.35rem] font-bold leading-none ${
            tone === "good" ? "text-loss" : tone === "bad" ? "text-red-400" : "text-white"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-[0.75rem] font-medium text-white/40">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-[0.72rem] text-white/45">{sub}</p>}
    </div>
  );
}

function BMITile({
  current,
  start,
  drop,
  heightIn,
}: {
  current: number;
  start: number;
  drop: number;
  heightIn: number;
}) {
  const [showTip, setShowTip] = useState(false);

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
          BMI ignores muscle mass — athletic people often read as "Overweight" at a
          healthy body fat %. The trajectory (how much it's dropped) matters more
          than the label.
        </p>
      ) : !heightIn ? (
        <p className="mt-2 text-[0.78rem] text-white/30">Set height in Profile</p>
      ) : (
        <>
          <p className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[1.35rem] font-bold leading-none text-white">
              {current > 0 ? current.toFixed(1) : "—"}
            </span>
          </p>
          {start > 0 && drop > 0 && (
            <p className="mt-0.5 text-[0.72rem] text-loss">
              ↓ {drop.toFixed(1)} since start
            </p>
          )}
          {start > 0 && (
            <p className="text-[0.68rem] text-white/30">was {start.toFixed(1)}</p>
          )}
        </>
      )}
    </div>
  );
}

const PLATEAU_TIPS = [
  { icon: "🔥", tip: "Cut 200–300 more cal/day", detail: "A modest deficit increase is safer than a large drop." },
  { icon: "🍚", tip: "Try a refeed day", detail: "One higher-carb day can restore leptin and reset water weight." },
  { icon: "🚶", tip: "Add 2,000 steps/day", detail: "NEAT (non-exercise movement) is often easier than more gym time." },
  { icon: "😴", tip: "Check your sleep", detail: "Poor sleep raises cortisol, which increases water retention." },
  { icon: "📅", tip: "Consider a diet break", detail: "1–2 weeks at maintenance resets hormones — weight may dip after." },
];

function PlateauCard({ coach }: { coach: PlateauCoach }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-3.5 py-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[0.83rem] font-semibold text-yellow-300">
          ⚡ Plateau — 14 days, no net change
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-yellow-400/15 px-2.5 py-1 text-[0.68rem] font-semibold text-yellow-200 transition hover:bg-yellow-400/25"
        >
          {open ? "Hide tips ↑" : "Break it ↓"}
        </button>
      </div>

      {coach.currentPaceDate && (
        <p className="text-[0.76rem] text-yellow-200/70">
          At current pace:{" "}
          <span className="font-medium text-yellow-100">
            goal by {formatMonthYear(coach.currentPaceDate)}
          </span>
        </p>
      )}
      {coach.historicalPaceDate && (
        <p className="text-[0.76rem] text-yellow-200/70">
          Historical −{coach.historicalRate} lb/wk pace:{" "}
          <span className="font-medium text-yellow-100">
            {formatMonthYear(coach.historicalPaceDate)}
          </span>
        </p>
      )}
      <p className="text-[0.76rem] text-yellow-200/60">
        To return to pace: −{coach.requiredRate} lb/wk (~{Math.round(coach.requiredRate * 500)} cal/day deficit).
      </p>

      {open && (
        <div className="animate-fade-up mt-2.5 space-y-2 border-t border-yellow-500/20 pt-2.5">
          <p className="text-[0.68rem] font-medium uppercase tracking-wide text-yellow-300/60">
            Plateau-breaking checklist
          </p>
          {PLATEAU_TIPS.map(({ icon, tip, detail }) => (
            <div key={tip} className="flex gap-2">
              <span className="shrink-0 text-[0.85rem]">{icon}</span>
              <div>
                <p className="text-[0.78rem] font-semibold text-yellow-100">{tip}</p>
                <p className="text-[0.7rem] text-yellow-200/55">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
