import { useMemo } from "react";
import type { Entry } from "../types";
import { isoAddDays, isoToUTCDate, todayISO } from "../dateUtils";

const WEEKS = 12;

interface Props {
  entries: Entry[];
}

/**
 * GitHub-style logging heatmap: 12 columns (weeks) x 7 rows (Sun-Sat),
 * ending at today. Binary fill — a day is either logged or not — so the
 * encoding is pure luminance (accent vs faint gray), safe for all CVD types.
 */
export default function ConsistencyGrid({ entries }: Props) {
  const today = todayISO();

  const { cells, loggedCount, windowDays } = useMemo(() => {
    const logged = new Set(entries.map((e) => e.date));
    const todayDow = isoToUTCDate(today).getUTCDay(); // 0 = Sun
    // Last column holds today; pad back to that column's Sunday
    const start = isoAddDays(today, -((WEEKS - 1) * 7 + todayDow));

    const cells: { date: string; state: "logged" | "missed" | "future" }[] = [];
    let loggedCount = 0;
    let windowDays = 0;
    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < 7; row++) {
        const date = isoAddDays(start, col * 7 + row);
        if (date > today) {
          cells.push({ date, state: "future" });
        } else {
          windowDays++;
          const isLogged = logged.has(date);
          if (isLogged) loggedCount++;
          cells.push({ date, state: isLogged ? "logged" : "missed" });
        }
      }
    }
    return { cells, loggedCount, windowDays };
  }, [entries, today]);

  const startLabel = isoToUTCDate(cells[0].date).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const endLabel = isoToUTCDate(today).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[0.95rem] font-semibold text-white">Consistency</h2>
        <span className="text-[0.72rem] text-white/40">
          {loggedCount} of last {windowDays} days
        </span>
      </div>

      <div
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, 1fr)" }}
      >
        {cells.map(({ date, state }, i) => (
          <div
            key={date}
            title={
              state === "future"
                ? undefined
                : `${date} — ${state === "logged" ? "logged" : "not logged"}`
            }
            className={`animate-cell-in aspect-square w-full rounded-[3px] ${
              state === "logged"
                ? "bg-accent"
                : state === "missed"
                ? "bg-white/6"
                : "bg-transparent"
            } ${date === today ? "ring-1 ring-accentlight/70" : ""}`}
            style={{ animationDelay: `${Math.floor(i / 7) * 25}ms` }}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.65rem] text-white/40">
        <span>{startLabel}</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px] bg-white/6" /> missed
          <span className="ml-1.5 inline-block h-2 w-2 rounded-[2px] bg-accent" /> logged
        </span>
        <span>{endLabel}</span>
      </div>
    </section>
  );
}
