import { useEffect, useState } from "react";
import { TrophyIcon } from "../icons";

interface Props {
  totalLost: string;
  unit: string;
  onDismiss: () => void;
}

export default function Celebration({ totalLost, unit, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg px-8 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Confetti dots (CSS-only) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-2 w-2 rounded-full"
            style={{
              left: `${5 + (i * 4) % 92}%`,
              top: `${10 + (i * 7) % 60}%`,
              background: ["#a78bfa", "#4ade80", "#f9a8d4", "#fbbf24", "#60a5fa"][i % 5],
              animation: `fadeUp ${0.6 + (i % 6) * 0.15}s ${(i % 8) * 0.07}s ease both`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Trophy */}
        <div className="mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-accent to-accentlight shadow-lg shadow-accent/40">
          <TrophyIcon className="h-12 w-12 text-white" />
        </div>

        <h2 className="text-[2rem] font-bold leading-tight text-white">
          Goal Reached!
        </h2>
        <p className="mt-2 text-[1.1rem] font-semibold text-loss">
          You lost {totalLost} {unit}
        </p>
        <p className="mt-1.5 text-[0.85rem] text-white/50">
          Incredible consistency. Your hard work paid off.
        </p>

        <button
          onClick={onDismiss}
          className="mt-8 rounded-2xl bg-accent px-8 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accentlight active:scale-[0.98]"
        >
          Keep Going 💪
        </button>
      </div>
    </div>
  );
}
