import type { Profile } from "../types";
import { ArrowDownIcon, ArrowUpIcon } from "../icons";
import { formatLong, weeksSince } from "../metrics";

interface Props {
  totalLost: number;
  profile: Profile;
}

export default function JourneyMetrics({ totalLost, profile }: Props) {
  const lost = totalLost >= 0;
  const weeks = weeksSince(profile.startDate);

  return (
    <section className="rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/[0.08] to-transparent p-4">
      <h2 className="text-[0.95rem] font-semibold text-white">Total Journey Metrics</h2>
      <div className="mt-2 flex items-center gap-2">
        {lost ? (
          <ArrowDownIcon className="h-7 w-7 text-loss" />
        ) : (
          <ArrowUpIcon className="h-7 w-7 text-red-400" />
        )}
        <span className="text-[2rem] font-bold leading-none text-white">
          {Math.abs(totalLost).toFixed(1)} {profile.unit}
        </span>
        <span className={`text-[1.05rem] font-semibold ${lost ? "text-loss" : "text-red-400"}`}>
          Total
        </span>
      </div>
      <div className="mt-3 space-y-0.5 text-[0.8rem] text-white/45">
        <p>Started on: {formatLong(profile.startDate)}</p>
        <p>
          {weeks} {weeks === 1 ? "Week" : "Weeks"} in the {profile.phase}
        </p>
      </div>
    </section>
  );
}
