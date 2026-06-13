interface IconProps {
  className?: string;
  strokeWidth?: number;
}

const base = (cn?: string) => ({
  className: cn,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
});

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={2}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ArrowDownIcon({ className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={strokeWidth}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function ArrowUpIcon({ className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={strokeWidth}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ScaleIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 8h8" />
      <path d="M12 8v3" />
      <circle cx="12" cy="14.5" r="2" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.9}>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.9}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.9}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.9}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={1.9}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}

export function SmileIcon({ className }: IconProps) {
  return (
    <svg {...base(className)} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4 4 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

export function Logo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5 14 9l6.5 1.2L15.5 14l1.4 6.6L12 17l-4.9 3.6L8.5 14 3.5 10.2 10 9z"
        fill="url(#logoGrad)"
      />
    </svg>
  );
}
