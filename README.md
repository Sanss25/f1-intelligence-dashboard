# 🏎 PitWall — F1 Race Intelligence Dashboard

> Real-time Formula 1 strategy analysis powered by OpenF1 live telemetry data and an AI race engineer powered by Groq (Llama 3).

**[→ Live Demo](https://pitwall-lilac.vercel.app)** &nbsp;|&nbsp; **[→ Data Pipeline](scripts/fetch_race_data.py)**

![PitWall Dashboard](public/screenshot.jpeg)

---

## What This Is

PitWall is a full-stack data engineering project that ingests **real Formula 1 telemetry** from the OpenF1 API (live, free, no auth required), processes it through a serverless proxy, and renders it as a live race intelligence dashboard — the kind of interface a real pit wall engineer uses during a race.

The AI race engineer is a **floating chat interface** powered by Groq's free Llama 3 API via a secure serverless proxy, giving you real pit wall radio-style strategy advice with live access to race state, tire data, gaps, and lap history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Live Data** | OpenF1 API · Real lap times, tires, pit stops, weather, race control |
| **Data Pipeline** | Python · FastF1 · Pandas · NumPy (historical fallback) |
| **Frontend** | Vanilla JS · HTML5 Canvas API · CSS Grid |
| **AI Backend** | Groq API · Llama 3.3-70B (free tier) |
| **API Proxy** | Vercel Serverless Functions (Node.js) |
| **Deployment** | Vercel (static + serverless) |

---

## Features

### 🏁 Live Race Data (OpenF1 API)
- Polls **real F1 data every 5 seconds** — lap times, positions, gaps, pit stops, tire compounds
- Weather: track temp, air temp, humidity, wind speed from circuit sensors
- Race control messages: safety car, VSC, flag states from official feed
- Auto-detects live sessions vs. latest completed race
- Graceful fallback to FastF1 historical data or simulation mode

### 📊 Full-Width Dashboard Layout
- **Top navigation bar** — 10 views, each taking the full screen width
- **Timing tower** always visible on the left (20 drivers, live updating)
- Every panel uses a **2-column grid layout** — no more cramped side panels
- Click any driver row to open a **detail drawer** with lap chart, gap chart, and stats

### 📈 Intervals & Fastest Laps
- Gap to leader visualised as animated bars
- Session fastest lap leaderboard with delta to leader
- Both shown side-by-side on the same screen

### 🎯 Strategy Recommender
- Live **PIT NOW / STAY OUT / WATCH** recommendations for every driver
- Reasoning based on tire age, gap to car ahead/behind, laps remaining
- **Undercut / overcut window** detection with gap analysis
- Tire strategy overview — visual stint breakdown per driver

### 🔮 ML Win Probability Model
- Ensemble model scoring each driver's win probability every lap
- Features: gap to leader, tire compound + age, pace trend, pit stops remaining, DRS eligibility, SC risk
- Probability normalised across all 20 drivers, shown as ranked cards with progress bars
- Key feature breakdown panel for the race leader

### ⚖️ Driver Comparison
- Pick any two drivers for a full head-to-head stat table
- Best lap, last lap, avg lap, tire health, gap, DRS, pit stops
- Overlaid lap time chart showing pace trend for both drivers

### 📡 Telemetry
- Speed / Throttle / Brake bars per driver (real FastF1 data when loaded)
- Tire degradation model: exponential decay curves for S/M/H compounds
- Side-by-side with degradation chart in full-width layout

### 💬 AI Race Engineer (Floating Chat)
- **Always accessible** via the floating `🎙️` bubble — bottom-right corner, any view
- Full conversation with race context: current lap, gaps, tire ages, flag state
- Conversation history maintained across turns (last 10 messages)
- Powered by **Groq's free Llama 3.3-70B** via a secure server-side proxy — API key never in browser
- Responds in genuine pit wall radio style with F1 jargon

### 🔧 Pit Stops
- Full pit stop log with lap, driver, duration, and tire change (from → to)
- Tire strategy overview and stop duration chart side-by-side

### 📦 Data Hub
- Dataset cards linking to Kaggle F1 datasets
- All-time constructor wins bar chart
- FastF1 four-pillar data model reference

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  LIVE DATA (OpenF1 API)                      │
│                                                             │
│  api.openf1.org  ──→  /api/openf1.js  ──→  Dashboard        │
│  (positions, laps,     (Vercel proxy,      (polls every 5s) │
│   stints, weather,      no auth needed)                     │
│   race control, pits)                                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ fallback if no live session
                               ↓
┌─────────────────────────────────────────────────────────────┐
│               HISTORICAL PIPELINE (Python)                   │
│                                                             │
│  FastF1 Library  ──→  fetch_race_data.py  ──→  race_data.json│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│                                                             │
│  index.html ──→ Top Nav + Timing Tower + Full-Width Panels  │
│      │                                                      │
│      ├──→ Canvas charts, timing tower, telemetry bars       │
│      ├──→ ML model (client-side ensemble scoring)           │
│      ├──→ fetch('/api/openf1') ──→ OpenF1 Proxy (5s poll)  │
│      └──→ fetch('/api/engineer') ──→ Groq AI Proxy         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI PROXY (Vercel Serverless)                │
│                                                             │
│  /api/engineer.js  ──→  Groq API (Llama 3.3-70B, free)     │
│  (GROQ_API_KEY stored as env var, never in browser)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Sanss25/f1-intelligence-dashboard
cd f1-intelligence-dashboard

# Python pipeline deps (optional, for historical data)
pip install -r requirements.txt

# Vercel CLI for local dev
npm install
```

### 2. Set your API keys

```bash
cp .env.example .env.local
# Add your Groq API key (free at console.groq.com)
# GROQ_API_KEY=gsk_...
```

### 3. Start local dev server

```bash
npm run dev
# Opens at http://localhost:3000
# Live data auto-fetches from OpenF1 — no setup needed
```

### 4. (Optional) Run the historical data pipeline

```bash
# Fetch 2024 Australian GP (first run takes ~2 mins to cache)
python scripts/fetch_race_data.py --year 2024 --round 1 --session R

# Or use the npm shortcuts
npm run fetch-2024-monaco
npm run fetch-2024-brazil
```

This generates `public/data/race_data.json` as a fallback when no live session is active.

---

## Deploy to Vercel (free)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy"
git push origin main

# 2. Import on vercel.com → "New Project" → select your repo

# 3. Add environment variable in Vercel dashboard:
#    Settings → Environment Variables
#    Name:  GROQ_API_KEY
#    Value: gsk_...

# 4. Deploy
npm run deploy
```

Your live URL: **https://pitwall-lilac.vercel.app**

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

Live data (OpenF1 API) provides the same fields updated every 5 seconds during race weekends.

---

## Resume Bullet Points

> **F1 Race Intelligence Dashboard** — Built a full-stack data engineering project with live Formula 1 telemetry via the OpenF1 API (5-second polling, positions/lap times/tire compounds/pit stops/weather) and a Python FastF1 ETL pipeline for historical fallback. Implemented a full-width multi-view dashboard (10 panels: strategy recommender, ML win-probability model, driver comparison, telemetry, replay scrubber) and an always-available floating AI race engineer chatbot backed by Groq's Llama 3.3-70B via a secure Vercel serverless proxy. Tech: Python, FastF1, OpenF1, Pandas, JavaScript, Canvas API, Node.js, Vercel, Groq.

---

## Fetch Any Race (Historical)

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
