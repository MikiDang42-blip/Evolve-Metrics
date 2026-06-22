import { useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import ProgressRing from "./components/ProgressRing";
import AddEntry from "./components/AddEntry";
import type { Macros } from "./components/AddEntry";
import JourneyMetrics from "./components/JourneyMetrics";
import WeeklyTrend from "./components/WeeklyTrend";
import EntriesList from "./components/EntriesList";
import Insights from "./components/Insights";
import BottomNav from "./components/BottomNav";
import Toasts, { type Toast } from "./components/Toasts";
import Drawer from "./components/Drawer";
import SearchOverlay from "./components/SearchOverlay";
import EditEntryModal from "./components/EditEntryModal";
import Celebration from "./components/Celebration";
import QuickLogModal from "./components/QuickLogModal";
import HistoryView from "./components/HistoryView";
import { useEntries, useProfile } from "./storage";
import type { Entry, Profile } from "./types";
import {
  currentMA7,
  getPhaseMode,
  goalProgress,
  latestWeight,
  totalLost,
  trendDisplayForPhase,
  weeklyRate,
} from "./metrics";
import { fromLbs, toLbs, type Unit } from "./units";
import { exportCSV, exportJSON } from "./export";
import { todayISO } from "./dateUtils";
import { BellIcon, DownloadIcon, ScaleIcon } from "./icons";

export default function App() {
  const { entries, addEntry, updateEntry, removeEntry, resetAll } = useEntries();
  const { profile, setProfile } = useProfile();

  const [tab, setTab] = useState("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const notify = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };

  const handleAdd = (
    weightLbs: number,
    waist: number | null,
    note: string | undefined,
    date: string,
    macros?: Macros,
  ) => {
    addEntry(weightLbs, waist, note, date, macros);
    const isToday = date === todayISO();
    notify(
      `Logged ${fromLbs(weightLbs, profile.unit).toFixed(1)} ${profile.unit}` +
        (isToday ? "" : ` for ${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
    );
  };

  const handleUpdate = (id: string, weightLbs: number, date: string, waist?: number | null) => {
    updateEntry(id, weightLbs, date, waist);
    notify(`Updated to ${fromLbs(weightLbs, profile.unit).toFixed(1)} ${profile.unit}`);
  };

  const handleRemove = (id: string) => {
    removeEntry(id);
    notify("Entry deleted", "info");
  };

  const current = latestWeight(entries) ?? profile.startWeight;
  const ma7 = currentMA7(entries);
  const lost = totalLost(entries, profile);
  const progress = goalProgress(entries, profile);
  const mode = getPhaseMode(profile.phase);
  const rate = weeklyRate(entries, 28);
  const trendDisplay = trendDisplayForPhase(rate, mode);

  const loggedToday = useMemo(
    () => entries.some((e) => e.date === todayISO()),
    [entries]
  );

  const showCelebration = progress >= 100 && !celebrationDismissed;

  const goTo = (id: string) => {
    setTab(id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#050507] p-0 sm:p-6">
      <div className="relative h-[100dvh] w-full max-w-[420px] overflow-hidden bg-bg sm:h-[860px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-black sm:shadow-2xl sm:shadow-black/60">

        <Header
          onMenuClick={() => setDrawerOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />

        <div
          ref={scrollRef}
          className="no-scrollbar absolute inset-x-0 bottom-0 top-[52px] overflow-y-auto px-5 pb-28"
        >
          {/* ── HOME ─────────────────────────────────────── */}
          {tab === "home" && (
            <div className="animate-fade-up">
              {/* Hero — 7-day average is the star */}
              <div className="flex flex-col items-center pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[2.6rem] font-bold leading-none text-white">
                    {fromLbs(ma7 ?? current, profile.unit).toFixed(1)}
                  </span>
                  <span className="text-[1.1rem] font-medium text-white/50">
                    {profile.unit}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.72rem] text-white/35">7-day average</p>

                {/* Weekly slope */}
                <div className="mt-2 flex items-center gap-1.5 text-[0.88rem]">
                  <span
                    className={
                      trendDisplay.tone === "good"
                        ? "font-semibold text-loss"
                        : trendDisplay.tone === "warn"
                        ? "font-semibold text-red-400"
                        : "font-medium text-white/55"
                    }
                  >
                    {rate < -0.05 ? "−" : rate > 0.05 ? "+" : "±"}
                    {fromLbs(Math.abs(rate), profile.unit).toFixed(1)} {profile.unit}/wk
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="text-white/45">{trendDisplay.label}</span>
                </div>

                {/* Today's raw log — secondary context */}
                {loggedToday && (
                  <p className="mt-1 text-[0.72rem] text-white/28">
                    Today's log: {fromLbs(current, profile.unit).toFixed(1)} {profile.unit}
                  </p>
                )}

                <div className="mt-5">
                  <ProgressRing percent={progress} />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {/* "Log today" nudge — purple gradient CTA */}
                {!loggedToday && (
                  <button
                    onClick={() => setQuickLogOpen(true)}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99]"
                    style={{
                      background: "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(167,139,250,0.12) 100%)",
                      border: "1px solid rgba(139,92,246,0.45)",
                    }}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/25">
                      <ScaleIcon className="h-5 w-5 text-accentlight" />
                    </span>
                    <div className="flex-1">
                      <p className="text-[0.9rem] font-semibold text-white">
                        Log today's weigh-in
                      </p>
                      <p className="text-[0.73rem] text-white/50">
                        Keep your streak going — tap to log
                      </p>
                    </div>
                    <span className="text-[1.1rem] text-accentlight">→</span>
                  </button>
                )}

                <JourneyMetrics totalLost={lost} profile={profile} />
              </div>
            </div>
          )}

          {/* ── TRENDS ───────────────────────────────────── */}
          {tab === "trends" && (
            <div className="animate-fade-up space-y-5 pt-1">
              {entries.length > 1 ? (
                <WeeklyTrend entries={entries} profile={profile} />
              ) : (
                <div className="rounded-2xl border border-white/8 bg-card px-4 py-8 text-center text-[0.85rem] text-white/35">
                  Log at least 2 entries to see your trend.
                </div>
              )}
              <Insights entries={entries} profile={profile} />
            </div>
          )}

          {/* ── LOG ──────────────────────────────────────── */}
          {tab === "log" && (
            <div className="animate-fade-up space-y-5 pt-1">
              <AddEntry unit={profile.unit} onAdd={handleAdd} />
              <p className="px-1 text-[0.78rem] text-white/35">
                A new entry replaces any earlier weigh-in on the same day.
              </p>
              {entries.length > 0 && (
                <EntriesList
                  entries={entries.slice(-5)}
                  unit={profile.unit}
                  title="Recent"
                  phaseMode={mode}
                  onRemove={handleRemove}
                  onEdit={setEditEntry}
                />
              )}
            </div>
          )}

          {/* ── HISTORY ──────────────────────────────────── */}
          {tab === "history" && (
            <div className="animate-fade-up pt-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="mb-4 flex w-full items-center gap-2.5 rounded-xl border border-white/8 bg-card px-4 py-2.5 text-left text-[0.9rem] text-white/35 hover:border-white/15"
              >
                <span>🔍</span>
                <span>Search entries…</span>
              </button>
              <HistoryView
                entries={entries}
                profile={profile}
                phaseMode={mode}
                onRemove={handleRemove}
                onEdit={setEditEntry}
              />
            </div>
          )}

          {/* ── PROFILE ──────────────────────────────────── */}
          {tab === "profile" && (
            <ProfilePanel
              profile={profile}
              setProfile={setProfile}
              onReset={() => {
                resetAll();
                notify("Reset to sample data", "info");
              }}
              onExportCSV={() => { exportCSV(entries, profile); notify("CSV downloaded"); }}
              onExportJSON={() => { exportJSON(entries, profile); notify("JSON downloaded"); }}
            />
          )}
        </div>

        {/* Overlays */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onExportCSV={() => { exportCSV(entries, profile); notify("CSV downloaded"); setDrawerOpen(false); }}
          onExportJSON={() => { exportJSON(entries, profile); notify("JSON downloaded"); setDrawerOpen(false); }}
          onNavigate={goTo}
          entryCount={entries.length}
        />

        {searchOpen && (
          <SearchOverlay
            entries={entries}
            unit={profile.unit}
            onClose={() => setSearchOpen(false)}
            onRemove={(id) => { handleRemove(id); }}
            onEdit={(e) => { setEditEntry(e); setSearchOpen(false); }}
          />
        )}

        <EditEntryModal
          entry={editEntry}
          unit={profile.unit}
          onSave={handleUpdate}
          onClose={() => setEditEntry(null)}
        />

        {showCelebration && (
          <Celebration
            totalLost={fromLbs(lost, profile.unit).toFixed(1)}
            unit={profile.unit}
            onDismiss={() => setCelebrationDismissed(true)}
          />
        )}

        <QuickLogModal
          isOpen={quickLogOpen}
          unit={profile.unit}
          entries={entries}
          onAdd={(weightLbs, waist, note, date) => {
            handleAdd(weightLbs, waist, note, date);
            setQuickLogOpen(false);
          }}
          onClose={() => setQuickLogOpen(false)}
        />

        <Toasts toasts={toasts} />
        <BottomNav active={tab} onChange={goTo} onFABClick={() => setQuickLogOpen(true)} />
      </div>
    </div>
  );
}

const PHASES = ["Cutting", "Bulking", "Maintenance", "Recomp"] as const;

function ProfilePanel({
  profile,
  setProfile,
  onReset,
  onExportCSV,
  onExportJSON,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onReset: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}) {
  const unit = profile.unit;
  const field =
    "w-28 rounded-lg border border-white/10 bg-cardalt px-2.5 py-1.5 text-right text-white focus:border-accent focus:outline-none";

  const setWeight = (key: "startWeight" | "goalWeight", display: string) => {
    const v = parseFloat(display);
    setProfile({ ...profile, [key]: isFinite(v) ? Math.round(toLbs(v, unit) * 10) / 10 : 0 });
  };

  const isPreset = (PHASES as readonly string[]).includes(profile.phase.replace(" Phase", "").trim());
  const activePreset = PHASES.find((p) => profile.phase.startsWith(p)) ?? null;

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification("Evolve Metrics", {
        body: "Daily reminders enabled! We'll nudge you if you haven't logged.",
        icon: "/icon-192.png",
      });
    }
  };

  return (
    <div className="animate-fade-up space-y-4 pt-1">
      <h2 className="px-1 text-[0.95rem] font-semibold text-white">Profile & Settings</h2>

      {/* Units */}
      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-card px-4 py-3">
        <span className="text-[0.9rem] text-white/55">Units</span>
        <div className="flex gap-1 rounded-lg bg-cardalt p-0.5">
          {(["lbs", "kg"] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setProfile({ ...profile, unit: u })}
              className={`rounded-md px-3 py-1 text-[0.8rem] font-medium transition ${
                unit === u ? "bg-accent text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Goal settings */}
      <div className="space-y-3 rounded-2xl border border-white/8 bg-card p-4 text-[0.9rem]">
        <Row label={`Start weight (${unit})`}>
          <input
            type="number"
            className={field}
            value={fromLbs(profile.startWeight, unit).toFixed(1)}
            onChange={(e) => setWeight("startWeight", e.target.value)}
          />
        </Row>
        <Row label={`Goal weight (${unit})`}>
          <input
            type="number"
            className={field}
            value={fromLbs(profile.goalWeight, unit).toFixed(1)}
            onChange={(e) => setWeight("goalWeight", e.target.value)}
          />
        </Row>
        <Row label="Height (in)">
          <input
            type="number"
            className={field}
            value={profile.heightIn || ""}
            placeholder="e.g. 70"
            onChange={(e) =>
              setProfile({ ...profile, heightIn: parseFloat(e.target.value) || 0 })
            }
          />
        </Row>
        <Row label="Start date">
          <input
            type="date"
            className={`${field} w-36`}
            value={profile.startDate}
            onChange={(e) => setProfile({ ...profile, startDate: e.target.value })}
          />
        </Row>
      </div>

      {/* Phase */}
      <div className="rounded-2xl border border-white/8 bg-card p-4">
        <p className="mb-2.5 text-[0.85rem] text-white/50">Current phase</p>
        <div className="grid grid-cols-2 gap-2">
          {PHASES.map((p) => (
            <button
              key={p}
              onClick={() => setProfile({ ...profile, phase: p })}
              className={`rounded-xl border py-2 text-[0.82rem] font-medium transition ${
                activePreset === p
                  ? "border-accent bg-accent/15 text-accentlight"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {!isPreset && (
          <input
            className="mt-2 w-full rounded-lg border border-white/10 bg-cardalt px-3 py-1.5 text-[0.85rem] text-white focus:border-accent focus:outline-none"
            value={profile.phase}
            onChange={(e) => setProfile({ ...profile, phase: e.target.value })}
            placeholder="Custom phase name"
          />
        )}
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-white/8 bg-card p-4 space-y-2">
        <p className="text-[0.85rem] text-white/50">Export your data</p>
        <div className="flex gap-2">
          <button
            onClick={onExportCSV}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[0.82rem] font-medium text-white/70 transition hover:border-accent/40 hover:text-accentlight"
          >
            <DownloadIcon className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={onExportJSON}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[0.82rem] font-medium text-white/70 transition hover:border-accent/40 hover:text-accentlight"
          >
            <DownloadIcon className="h-4 w-4" />
            JSON
          </button>
        </div>
        <p className="text-[0.72rem] text-white/35">
          Data is stored locally. Export a backup before clearing browser data.
        </p>
      </div>

      {/* Daily reminder */}
      {"Notification" in window && (
        <button
          onClick={requestNotifications}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-card px-4 py-3 text-left transition hover:bg-white/3"
        >
          <BellIcon className="h-5 w-5 shrink-0 text-white/40" />
          <div>
            <p className="text-[0.9rem] font-medium text-white">Enable reminders</p>
            <p className="text-[0.72rem] text-white/40">
              Get a nudge when you open the app without logging
            </p>
          </div>
        </button>
      )}

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-white/10 bg-card py-2.5 text-[0.85rem] font-medium text-white/50 transition hover:border-red-400/40 hover:text-red-400 active:scale-[0.99]"
      >
        Reset to sample data
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55">{label}</span>
      {children}
    </div>
  );
}
