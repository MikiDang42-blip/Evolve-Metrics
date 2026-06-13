export interface Toast {
  id: number;
  message: string;
  tone?: "success" | "info" | "error";
}

interface Props {
  toasts: Toast[];
}

export default function Toasts({ toasts }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2 px-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-up pointer-events-auto rounded-full border px-4 py-2 text-[0.82rem] font-medium shadow-lg backdrop-blur ${
            t.tone === "error"
              ? "border-red-400/30 bg-red-500/15 text-red-200"
              : "border-accent/30 bg-accent/15 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
