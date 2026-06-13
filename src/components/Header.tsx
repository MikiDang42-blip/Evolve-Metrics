import { Logo, MenuIcon, SearchIcon } from "../icons";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-5 pt-3 pb-2">
      <button className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/5 active:scale-95">
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <Logo className="h-5 w-5" />
        <span className="text-[1.05rem] font-semibold tracking-tight text-white">
          Evolve Metrics
        </span>
      </div>
      <button className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/5 active:scale-95">
        <SearchIcon className="h-5 w-5" />
      </button>
    </header>
  );
}
