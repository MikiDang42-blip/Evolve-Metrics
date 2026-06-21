import { CloseIcon, DownloadIcon, HistoryIcon, ShieldIcon, UserIcon } from "../icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onNavigate: (tab: string) => void;
  entryCount: number;
}

export default function Drawer({
  isOpen,
  onClose,
  onExportCSV,
  onExportJSON,
  onNavigate,
  entryCount,
}: Props) {
  const go = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute inset-y-0 left-0 z-50 flex w-72 flex-col bg-bg transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-[1rem] font-semibold text-white">Menu</span>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/5"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Stats summary */}
        <div className="mx-4 rounded-xl border border-white/8 bg-card px-4 py-3">
          <p className="text-[0.72rem] uppercase tracking-wide text-white/40">Your data</p>
          <p className="mt-1 text-[0.9rem] font-semibold text-white">
            {entryCount} entries logged
          </p>
          <p className="mt-0.5 text-[0.72rem] text-white/40">
            Stored locally on this device
          </p>
        </div>

        {/* Nav shortcuts */}
        <div className="mt-4 space-y-1 px-3">
          <DrawerRow Icon={HistoryIcon} label="History" onClick={() => go("history")} />
          <DrawerRow Icon={UserIcon} label="Profile & Settings" onClick={() => go("profile")} />
        </div>

        <div className="mt-4 border-t border-white/8 pt-4 px-3 space-y-1">
          <p className="px-3 pb-1 text-[0.7rem] uppercase tracking-wider text-white/30">
            Export
          </p>
          <DrawerRow
            Icon={DownloadIcon}
            label="Export CSV"
            sub="Date + weight columns"
            onClick={onExportCSV}
          />
          <DrawerRow
            Icon={DownloadIcon}
            label="Export JSON"
            sub="Full data backup"
            onClick={onExportJSON}
          />
        </div>

        <div className="mt-auto px-4 pb-6">
          <div className="flex items-start gap-2 rounded-xl border border-white/8 bg-card p-3">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
            <p className="text-[0.72rem] leading-relaxed text-white/40">
              All data lives in your browser's localStorage. Export a backup
              before clearing site data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerRow({
  Icon,
  label,
  sub,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5 active:scale-[0.99]"
    >
      <Icon className="h-5 w-5 shrink-0 text-white/50" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9rem] font-medium text-white">{label}</p>
        {sub && <p className="text-[0.72rem] text-white/40">{sub}</p>}
      </div>
    </button>
  );
}
