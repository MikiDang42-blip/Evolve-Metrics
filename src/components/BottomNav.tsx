import { ChartIcon, HistoryIcon, HomeIcon, SmileIcon, UserIcon } from "../icons";

interface Props {
  active: string;
  onChange: (id: string) => void;
}

const items = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "trends", label: "Trends", Icon: ChartIcon },
  { id: "log", label: "Log", Icon: SmileIcon, center: true },
  { id: "history", label: "History", Icon: HistoryIcon },
  { id: "profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-white/8 bg-bg/95 px-3 pb-5 pt-2 backdrop-blur">
      <div className="flex items-end justify-between">
        {items.map(({ id, label, Icon, center }) => {
          const isActive = active === id;
          if (center) {
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="relative -mt-6 flex flex-col items-center gap-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-accentlight to-accent text-white shadow-lg shadow-accent/40 transition active:scale-95">
                  <Icon className="h-6 w-6" />
                </span>
              </button>
            );
          }
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <Icon
                className={`h-[1.35rem] w-[1.35rem] transition ${
                  isActive ? "text-accentlight" : "text-white/40"
                }`}
              />
              <span
                className={`text-[0.6rem] font-medium transition ${
                  isActive ? "text-accentlight" : "text-white/35"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
