import type { Profile } from "../types";
import { ArrowDownIcon, ArrowUpIcon } from "../icons";
import { formatLong, weeksSince } from "../metrics";
import { fromLbs } from "../units";

interface Props {
  totalLost: number; // in lbs
  profile: Profile;
}

export default function JourneyMetrics({ totalLost, profile }: Props) {
  const lost = totalLost >= 0;
  const weeks = weeksSince(profile.startDate);
  const magnitude = fromLbs(Math.abs(totalLost), profile.unit);

  return (
    <section className="rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/[0.08] to-transparent p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[0.95rem] font-semibold text-white">Journey</h2>
        <span className="text-[0.7rem] text-white/45">
          since {formatLong(profile.startDate)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-white/8">
        <div className="flex flex-col items-center gap-0.5 px-1">
          <div className="flex items-center gap-1">
            {lost ? (
              <ArrowDownIcon className="h-4 w-4 text-loss" />
            ) : (
              <ArrowUpIcon className="h-4 w-4 text-red-400" />
            )}
            <span
              className={`text-[1.25rem] font-bold leading-none ${
                lost ? "text-loss" : "text-red-400"
              }`}
            >
              {magnitude.toFixed(1)}
            </span>
          </div>
          <span className="text-[0.65rem] uppercase tracking-wide text-white/45">
            {profile.unit} {lost ? "lost" : "gained"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-1">
          <span className="text-[1.25rem] font-bold leading-none text-white">
            {weeks}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-white/45">
            weeks in
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-0.5 px-1">
          <span className="truncate text-[1rem] font-bold leading-none text-accentlight">
            {profile.phase}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-white/45">
            phase
          </span>
        </div>
      </div>
    </section>
  );
}
