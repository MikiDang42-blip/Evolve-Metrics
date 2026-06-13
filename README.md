# Evolve Metrics

A polished, mobile-first weight-tracking app built from the original design mockup.
Dark theme, violet accents, animated progress ring, and a live weight-trend chart.

![Evolve Metrics](docs/preview.png)

## Features

- **Hero dashboard** — current weight, change since last weigh-in, and an animated
  circular ring showing progress toward your goal.
- **Add Entry** — log today's weight in one tap. A second entry on the same day
  replaces the first so your trend stays clean.
- **Total Journey Metrics** — pounds lost since you started and how many weeks
  you've been in your current phase.
- **Weekly Trend** — an interactive area chart (powered by Recharts) of your
  weigh-in history.
- **All Entries** — full, deletable history with per-entry deltas.
- **Profile** — edit start weight, goal weight, phase, and start date. Everything
  recalculates instantly.
- **Local persistence** — entries and profile are saved to `localStorage`, so your
  data survives reloads. Ships with realistic sample data on first run.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  components/      UI sections (Header, ProgressRing, AddEntry, WeeklyTrend, ...)
  metrics.ts       pure calculations (progress, totals, trend series)
  storage.ts       localStorage-backed hooks + sample data
  types.ts         shared types
  icons.tsx        inline SVG icon set
  App.tsx          screen layout, tabs, and the phone frame
```
