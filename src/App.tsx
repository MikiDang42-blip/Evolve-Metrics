import { useRef, useState } from "react";
import Header from "./components/Header";
import ProgressRing from "./components/ProgressRing";
import AddEntry from "./components/AddEntry";
import JourneyMetrics from "./components/JourneyMetrics";
import WeeklyTrend from "./components/WeeklyTrend";
import EntriesList from "./components/EntriesList";
import Insights from "./components/Insights";
import BottomNav from "./components/BottomNav";
import Toasts, { type Toast } from "./components/Toasts";
import { useEntries, useProfile } from "./storage";
import type { Profile } from "./types";
import { goalProgress, lastChange, latestWeight, totalLost } from "./metrics";
import { fromLbs, toLbs, type Unit } from "./units";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";

export default function App() {
  const { entries, addEntry, removeEntry, resetAll } = useEntries();
  const { profile, setProfile } = useProfile();
  const [tab, setTab] = useState("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const notify = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };

  const handleAdd = (weightLbs: number, note: string | undefined, date: string) => {
    addEntry(weightLbs, note, date);
    const isToday = date === new Date().toISOString().slice(0, 10);
    notify(
      `Logged ${fromLbs(weightLbs, profile.unit).toFixed(1)} ${profile.unit}${
        isToday ? "" : ` for ${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      }`
    );
  };

  const handleRemove = (id: string) => {
    removeEntry(id);
    notify("Entry deleted", "info");
  };

  const current = latestWeight(entries) ?? profile.startWeight;
  const change = lastChange(entries);
  const changeDisp = fromLbs(Math.abs(change), profile.unit);
  const lost = totalLost(entries, profile);
  const progress = goalProgress(entries, profile);

  const goTo = (id: string) => {
    setTab(id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#050507] p-0 sm:p-6">
      {/* Phone frame */}
      <div className="relative h-[100dvh] w-full max-w-[420px] overflow-hidden bg-bg sm:h-[860px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-black sm:shadow-2xl sm:shadow-black/60">
        <Header />

        <div
          ref={scrollRef}
          className="no-scrollbar absolute inset-x-0 bottom-0 top-[52px] overflow-y-auto px-5 pb-28"
        >
          {/* Hero: current weight + ring (shown on home & trends) */}
          {(tab === "home" || tab === "trends") && (
            <div className="animate-fade-up flex flex-col items-center pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[2.6rem] font-bold leading-none text-white">
                  {fromLbs(current, profile.unit).toFixed(1)}
                </span>
                <span className="text-[1.1rem] font-medium text-white/50">
                  {profile.unit}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[0.85rem]">
                {change <= 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-loss" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4 text-red-400" />
                )}
                <span className={change <= 0 ? "text-loss" : "text-red-400"}>
                  {changeDisp.toFixed(1)} {profile.unit}
                </span>
                <span className="text-white/30">since last</span>
              </div>
              <div className="mt-5">
                <ProgressRing percent={progress} />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-5">
            {tab === "home" && (
              <>
                <AddEntry unit={profile.unit} onAdd={handleAdd} />
                <JourneyMetrics totalLost={lost} profile={profile} />
                <Insights entries={entries} profile={profile} />
                {entries.length > 1 && <WeeklyTrend entries={entries} profile={profile} />}
                <EntriesList
                  entries={entries.slice(-6)}
                  unit={profile.unit}
                  onRemove={handleRemove}
                />
              </>
            )}

            {tab === "trends" && (
              <>
                {entries.length > 1 && <WeeklyTrend entries={entries} profile={profile} />}
                <Insights entries={entries} profile={profile} />
                <JourneyMetrics totalLost={lost} profile={profile} />
              </>
            )}

            {tab === "log" && (
              <div className="animate-fade-up">
                <AddEntry unit={profile.unit} onAdd={handleAdd} />
                <p className="mt-3 px-1 text-[0.8rem] text-white/40">
                  Logging once a day keeps your trend smooth. A new entry replaces any
                  earlier weigh-in for the same day.
                </p>
                <div className="mt-5">
                  <EntriesList
                    entries={entries.slice(-4)}
                    unit={profile.unit}
                    onRemove={handleRemove}
                  />
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="animate-fade-up">
                <EntriesList
                  entries={entries}
                  unit={profile.unit}
                  onRemove={handleRemove}
                />
              </div>
            )}

            {tab === "profile" && (
              <ProfilePanel
                profile={profile}
                setProfile={setProfile}
                onReset={() => {
                  resetAll();
                  notify("Reset to sample data", "info");
                }}
              />
            )}
          </div>
        </div>

        <Toasts toasts={toasts} />
        <BottomNav active={tab} onChange={goTo} />
      </div>
    </div>
  );
}

function ProfilePanel({
  profile,
  setProfile,
  onReset,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onReset: () => void;
}) {
  const unit = profile.unit;
  const field =
    "w-24 rounded-lg border border-white/10 bg-cardalt px-2.5 py-1.5 text-right text-white focus:border-accent focus:outline-none";

  const setWeight = (key: "startWeight" | "goalWeight", display: string) => {
    const v = parseFloat(display);
    setProfile({ ...profile, [key]: isFinite(v) ? Math.round(toLbs(v, unit) * 10) / 10 : 0 });
  };

  return (
    <div className="animate-fade-up space-y-4">
      <h2 className="px-1 text-[0.95rem] font-semibold text-white">Your Goal</h2>

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
            value={profile.heightIn}
            onChange={(e) =>
              setProfile({ ...profile, heightIn: parseFloat(e.target.value) || 0 })
            }
          />
        </Row>
        <Row label="Phase">
          <input
            className={`${field} w-36`}
            value={profile.phase}
            onChange={(e) => setProfile({ ...profile, phase: e.target.value })}
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

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-white/10 bg-card py-2.5 text-[0.85rem] font-medium text-white/60 transition hover:border-red-400/40 hover:text-red-400 active:scale-[0.99]"
      >
        Reset to sample data
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{label}</span>
      {children}
    </div>
  );
}
