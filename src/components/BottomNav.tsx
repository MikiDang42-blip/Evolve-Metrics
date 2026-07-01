import { ChartIcon, HistoryIcon, HomeIcon, PlusIcon, UserIcon } from "../icons";

interface Props {
  active: string;
  onChange: (id: string) => void;
  onFABClick: () => void;
  pulseFAB?: boolean;
}

const items = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "trends", label: "Trends", Icon: ChartIcon },
  { id: "history", label: "History", Icon: HistoryIcon },
  { id: "profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav({ active, onChange, onFABClick, pulseFAB }: Props) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-white/8 bg-bg/95 px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2 backdrop-blur">
      <div className="flex items-end justify-between">
        {/* Left two tabs */}
        {items.slice(0, 2).map(({ id, label, Icon }) => (
          <NavTab key={id} id={id} label={label} Icon={Icon} active={active} onChange={onChange} />
        ))}

        {/* Center FAB — halo pulses gently until today is logged */}
        <button
          onClick={onFABClick}
          className="relative -mt-6 flex flex-col items-center gap-1"
          aria-label="Quick log"
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-accentlight to-accent text-white shadow-lg shadow-accent/40 transition active:scale-95 ${
              pulseFAB ? "animate-pulse-glow" : ""
            }`}
          >
            <PlusIcon className="h-6 w-6" />
          </span>
        </button>

        {/* Right two tabs */}
        {items.slice(2).map(({ id, label, Icon }) => (
          <NavTab key={id} id={id} label={label} Icon={Icon} active={active} onChange={onChange} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({
  id,
  label,
  Icon,
  active,
  onChange,
}: {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  const isActive = active === id;
  return (
    <button
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
}
