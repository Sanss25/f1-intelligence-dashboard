# 🏎 PitWall — F1 Race Intelligence Dashboard

> Real-time Formula 1 strategy analysis powered by FastF1 telemetry data and an AI race engineer running on Claude.

**[→ Live Demo](https://pitwall-f1.vercel.app)** &nbsp;|&nbsp; **[→ Data Pipeline](scripts/fetch_race_data.py)**

![PitWall Dashboard](https://i.imgur.com/placeholder.png)
<!-- Replace with a real screenshot: cmd+shift+4 on Mac, then drag to GitHub -->

---

## What This Is

PitWall is a full-stack data engineering project that ingests **real Formula 1 telemetry** from the official F1 timing feed via the FastF1 Python library, processes it through a data pipeline, and renders it as a live race intelligence dashboard — the kind of interface a real pit wall engineer uses during a race.

The AI race engineer tab connects to Claude via a secure serverless proxy, giving you a real conversation with an expert that has live access to the race state, tire data, gaps, and lap history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Data Pipeline** | Python · FastF1 · Pandas · NumPy |
| **Frontend** | Vanilla JS · HTML5 Canvas API · CSS Grid |
| **AI Backend** | Anthropic Claude (claude-sonnet-4) |
| **API Proxy** | Vercel Serverless Function (Node.js) |
| **Deployment** | Vercel (static + serverless) |
| **Data Source** | Official F1 timing feed via FastF1 |

---

## Features

### 🏁 Real Data Pipeline
- Pulls **actual lap times, pit stop records, sector times, and telemetry** from any F1 race (2018–present)
- Speed, Throttle, Brake, RPM, Gear at 4Hz resolution from real onboard sensors
- Weather data: track temp, air temp, humidity, wind speed
- Graceful fallback to simulation mode when real data isn't available

### 📊 Live Timing Tower
- 20-driver live timing grid with position changes, gaps, intervals
- Tire compound tracking (Soft/Medium/Hard/Inter/Wet) with age in laps
- Real pit stop log with actual stop durations from timing data
- Flag state simulation (Green / Yellow / Safety Car / VSC)

### 🤖 ML Win Probability Model
- Ensemble model scoring each driver's win probability every lap
- Features: gap to leader, tire compound + age, pace trend, pit stops remaining, DRS eligibility, SC risk
- Probability normalised across all 20 drivers, shown as ranked cards with progress bars

### 📡 Telemetry Tab
- Speed / Throttle / Brake bars per driver (real FastF1 data when loaded, marked `FF1`)
- Real sector times (S1 / S2 / S3) from fastest lap
- Tire degradation model: exponential decay curves for S/M/H compounds with current driver positions plotted

### 💬 AI Race Engineer
- Full conversation with race context: current lap, gaps, tire ages, flag state
- Conversation history maintained across turns (last 10 messages)
- Calls Claude through a **secure server-side proxy** — API key never exposed in browser
- Responds in genuine pit wall radio style with F1 jargon

### 📦 Data Hub
- Dataset cards linking to Kaggle F1 datasets
- All-time constructor wins bar chart
- FastF1 four-pillar data model reference (Timing / Telemetry / Positional / Environment)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA PIPELINE (Python)                   │
│                                                             │
│  F1 Live Timing Feed                                        │
│       ↓                                                     │
│  FastF1 Library  ──→  fetch_race_data.py  ──→  race_data.json │
│  (lap times,           (clean, transform,      (public/data/) │
│   telemetry,            normalise, export)                   │
│   weather, pits)                                            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│                                                             │
│  index.html ──→ fetch('/data/race_data.json')               │
│      │              (loads on startup, falls back to sim)    │
│      │                                                      │
│      └──→ Canvas charts, timing tower, telemetry bars       │
│      └──→ ML model (client-side ensemble scoring)           │
│      └──→ fetch('/api/engineer') ──→ Vercel Function        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                  API PROXY (Vercel Serverless)               │
│                                                             │
│  /api/engineer.js                                           │
│      ↓                                                      │
│  Anthropic API  (key stored as env var, never in browser)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/pitwall-f1
cd pitwall-f1

# Python pipeline deps
pip install -r requirements.txt

# Vercel CLI for local dev
npm install
```

### 2. Run the data pipeline

```bash
# Fetch 2024 Australian GP (first run takes ~2 mins to cache)
python scripts/fetch_race_data.py --year 2024 --round 1 --session R

# Or use the npm shortcuts
npm run fetch-2024-monaco
npm run fetch-2024-brazil
```

This generates `public/data/race_data.json` — the dashboard loads it automatically.

### 3. Set your API key

```bash
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
# Get one at: https://console.anthropic.com
```

### 4. Start local dev server

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Deploy to Vercel (free)

```bash
# 1. Push to GitHub first
git add .
git commit -m "Initial deploy"
git push origin main

# 2. Import on vercel.com → "New Project" → select your repo

# 3. Add environment variable in Vercel dashboard:
#    Settings → Environment Variables
#    Name:  ANTHROPIC_API_KEY
#    Value: sk-ant-api03-...

# 4. Deploy
npm run deploy
```

Your live URL will be `https://pitwall-f1.vercel.app` (or your custom domain).

---

## Data Pipeline Details

The `fetch_race_data.py` script fetches and transforms:

| Data Type | Source | Fields |
|---|---|---|
| Lap Times | F1 timing feed | LapTime, Sector1/2/3, IsPersonalBest |
| Pit Stops | F1 timing feed | PitInTime, PitOutTime → duration in seconds |
| Telemetry | Onboard sensors | Speed, Throttle, Brake, RPM, nGear, DRS @4Hz |
| Weather | Track sensors | TrackTemp, AirTemp, Humidity, WindSpeed, Rainfall |
| Results | Official results | Position, Points, Status, Gap |

Output: a single `race_data.json` (~500KB typical) consumed by the dashboard.

---

## Resume Bullet Points

> **F1 Race Intelligence Dashboard** — Built a full-stack data engineering project ingesting real Formula 1 telemetry via FastF1 (Speed/Throttle/Brake at 4Hz, sector times, pit stop records) through a Python ETL pipeline into a live race strategy dashboard. Implemented a client-side ML win-probability model (6 features, ensemble scoring), real telemetry visualization, and an AI race engineer chatbot backed by Claude via a secure Vercel serverless API proxy. Tech: Python, FastF1, Pandas, NumPy, JavaScript, Canvas API, Node.js, Vercel.

---

## Fetch Any Race

```bash
# 2024 Season highlights
python scripts/fetch_race_data.py --year 2024 --round 1   # Australia
python scripts/fetch_race_data.py --year 2024 --round 6   # Monaco
python scripts/fetch_race_data.py --year 2024 --round 21  # Brazil (dramatic)

# 2023 for comparison
python scripts/fetch_race_data.py --year 2023 --round 1

# Qualifying sessions
python scripts/fetch_race_data.py --year 2024 --round 6 --session Q
```

---

## License

MIT — use freely, credit appreciated.
