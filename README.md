# 🏎 Pit Wall — F1 Intelligence Dashboard

> A real-time F1 race analysis dashboard built with vanilla HTML/CSS/JS + FastF1 data, an AI Race Engineer powered by Groq (Llama 3), and live OpenF1 polling.

![Pit Wall Dashboard](https://img.shields.io/badge/F1-Dashboard-E8003D?style=flat-square) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?style=flat-square) ![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203-8B5CF6?style=flat-square)

---

## 🚀 Live Demo

**[pitwall-lilac.vercel.app](https://pitwall-lilac.vercel.app)**

---

## ✨ Features

### 🏁 Live Timing Tower
- All 20 drivers with real team colours, gap, interval, last lap time
- Colour-coded lap times: purple (fastest overall), green (personal best), yellow (decent)
- Tire compound badges (S/M/H) with lap age counter
- Position change flash animations (green = gained, red = lost)
- Click any driver to open a detailed stats drawer

### 📊 Analysis Tabs
| Tab | What it shows |
|-----|--------------|
| **Intervals** | Gap-to-leader bar chart (live updating) |
| **Fastest** | Session fastest laps ranked with deltas |
| **Pit Stops** | Full stop log with compound changes and durations |
| **Lap Times** | Lap time evolution chart for top 5 |
| **Strategy** | Live pit strategy recommender (PIT NOW / STAY OUT / OVERCUT?) |
| **Predict** | ML win probability model (gap · tire · pace trend · DRS) |
| **Compare** | Driver head-to-head with stat table and lap time chart |
| **Telemetry** | Speed / Throttle / Brake bars for top 6 + tire degradation model |
| **Data Viz** | Sector analysis, gap evolution, tire strategy overview |
| **Data Hub** | Kaggle dataset links, FastF1 data pillars, constructor wins chart |

### 🤖 AI Race Engineer (Groq / Llama 3)
- Floating chat bubble accessible from any view
- Receives live race context on every message (lap, gaps, tire ages, pit history)
- Responds like a real pit wall engineer — concise, technical, using F1 jargon
- Full conversation memory (last 10 turns)
- Quick-fire suggestion chips for common questions

### 🗂️ Race Picker (9 Pre-Loaded Sessions)
Switch between iconic races without any backend:

| Session | Year | Notes |
|---------|------|-------|
| 🇦🇺 Australian GP | 2026 | Default session |
| 🇧🇭 Bahrain GP | 2026 | HAM undercut race |
| 🇲🇨 Monaco GP | 2026 | LEC dominant |
| 🇧🇪 Belgian GP | 2025 | McLaren 1-2 |
| 🇲🇨 Monaco GP | 2025 | Classic Leclerc |
| 🇬🇧 British GP | 2025 | HAM vs RUS |
| 🇮🇹 Italian GP | 2021 | McLaren Monza shock |
| 🇧🇷 Brazilian GP | 2022 | VER comeback |
| 🇺🇸 Las Vegas GP | 2023 | Night race chaos |

Each session has a **distinct circuit profile** (lap time baseline, gap distribution, tyre life) so the simulation feels authentic. If a real `data/<key>.json` file is present in `/public/data/`, it loads that instead.

---

## 🗂️ Project Structure

```
pitwall/
├── public/
│   ├── index.html          ← Entire frontend (single file)
│   └── data/
│       ├── race_data.json  ← Default session (FastF1 output)
│       ├── aus_2026.json   ← (optional) pre-baked sessions
│       ├── bah_2026.json
│       └── ...
├── api/
│   ├── engineer.js         ← AI Race Engineer proxy (Groq)
│   └── openf1.js           ← OpenF1 live data proxy
├── scripts/
│   └── fetch_race_data.py  ← FastF1 data fetcher (run locally)
├── vercel.json
└── README.md
```

---

## ⚙️ Setup & Deployment

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/pitwall.git
cd pitwall
npm install -g vercel
```

### 2. Add Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get a free key at **[console.groq.com](https://console.groq.com)** — no credit card required.

### 3. Deploy

```bash
vercel --prod
```

### 4. (Optional) Generate Real Race Data

Run locally to pre-bake a session as JSON:

```bash
pip install fastf1 pandas numpy
python scripts/fetch_race_data.py --year 2026 --round 1 --session R
```

This outputs `public/data/aus_2026.json`. Commit and redeploy. The dashboard automatically detects and loads real data over the simulation fallback.

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/engineer` | POST | AI Race Engineer (proxies to Groq) |
| `/api/openf1` | GET | OpenF1 live session polling |

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — zero frameworks |
| AI | Groq API (Llama 3.3-70B) via serverless proxy |
| Live data | OpenF1 REST API (polling every 5s) |
| Race data | FastF1 Python library → JSON |
| Hosting | Vercel (serverless functions + static) |
| Fonts | Titillium Web + Share Tech Mono (Google Fonts) |

---

## 📁 Race Data JSON Schema

If you want to pre-bake your own session, the JSON must follow this schema:

```json
{
  "meta": {
    "eventName": "Australian Grand Prix",
    "circuitName": "Albert Park Circuit",
    "flag": "🇦🇺",
    "year": 2026,
    "round": 1,
    "currentLap": 58,
    "totalLaps": 58
  },
  "weather": {
    "trackTemp": 47,
    "airTemp": 28,
    "humidity": 58,
    "windSpeed": 3.3
  },
  "drivers": [
    {
      "code": "VER",
      "name": "Max Verstappen",
      "team": "RedBull",
      "color": "#3671C6",
      "pos": 1,
      "gap": 0,
      "lastLap": 81.456,
      "bestLap": 81.221,
      "tire": "M",
      "tireAge": 24,
      "pits": 1,
      "drs": false
    }
  ],
  "pitLog": [
    {
      "lap": 24,
      "code": "VER",
      "color": "#3671C6",
      "from": "S",
      "to": "M",
      "duration": 2.4
    }
  ],
  "lapHistory": {
    "VER": [81.8, 81.6, 81.5, 81.45]
  },
  "gapHistory": {
    "HAM": [1.2, 1.4, 1.3, 1.1]
  }
}
```

---

## 🏗️ Architecture Decision — Option A vs Option B

### ✅ Option A — Pre-Loaded Sessions (Current Implementation)

This dashboard uses **Option A**: all race data is either pre-baked into JSON files at build time, or generated client-side from realistic circuit simulation profiles. There is no runtime dependency on Python, FastF1, or any persistent backend.

**Why Option A was the right call:**

| Concern | Option A (this project) | Option B (on-demand FastF1) |
|---------|------------------------|----------------------------|
| Reliability | Always works — no external dependency | Breaks if Python server is cold/down |
| Load time | Instant | 1–3 minutes per session (FastF1 fetch) |
| Hosting cost | Free (Vercel static + 2 serverless fns) | Requires always-on Python server (~$7/mo) |
| Recruiter experience | Opens, works, impresses | May timeout or show spinner |
| Complexity | Low — fetch JSON or generate sim | High — Docker, job queue, Redis, polling |

**What Option A still demonstrates:**

- The `fetch_race_data.py` script (in `/scripts/`) runs FastF1 locally and serialises a full race session to JSON — proving FastF1 integration works end-to-end
- The JSON schema mirrors what FastF1 actually returns (lap times, telemetry, sector splits, weather, pit stops)
- Each of the 9 pre-loaded sessions uses a **distinct circuit profile** (Monaco has tight gaps + slow laps; Monza has high speeds + bigger intervals; Spa has long lap times) — showing understanding of real circuit characteristics
- The dashboard auto-detects real vs sim data and labels it accordingly in the header badge

**How to upgrade a session from sim → real data:**

```bash
# Run locally (takes 1–3 min, needs FastF1 cache)
python scripts/fetch_race_data.py --year 2025 --round 13 --session R
# → writes public/data/spa_2025.json

# Commit and push — Vercel picks it up on next deploy
git add public/data/spa_2025.json
git commit -m "feat: add real Spa 2025 race data"
git push
```

The picker tries `/data/<key>.json` first on every load. If it exists, real data wins. If not, sim kicks in. **Zero code changes needed.**

---

## 🔮 Planned Features

### Option B — On-Demand FastF1 Fetching
> **Status: In Development** | **Complexity: High**

The current race picker uses pre-loaded simulation data. A future version will allow users to pick **any race from 2018–present** and fetch live FastF1 data on demand.

**Why it's not live yet — the honest technical reason:**

FastF1 requires a Python runtime with `pandas`, `numpy`, and heavy session caching. Vercel's serverless functions are Node.js-only with a 10-second timeout. FastF1 itself takes **1–3 minutes** to fetch and process a full race session.

The planned architecture for Option B:

```
User picks race
      ↓
/api/fetch-race (Node) → queues job
      ↓
Python worker (Railway / Google Cloud Run)
      ↓
FastF1 fetches session (~2 min)
      ↓
Writes to /data/<key>.json (or Redis cache)
      ↓
Frontend polls /api/job-status
      ↓
Dashboard loads real data
```

**Infrastructure requirements:**
- A **persistent Python server** (Railway, Render, or Google Cloud Run)
- A job queue (Redis or simple polling)
- Docker container with FastF1 + dependencies pre-installed
- Estimated cold-start time: 30–90 seconds

This will be implemented once the Python backend is containerised. Track progress in the Issues tab.

---

## 📚 Learning Resources

This project was built as part of the **F1 Data Series**:

| Part | Topic | Resource |
|------|-------|----------|
| Part 0 | Python Environment Setup | [Get Ready Checklist](https://notion.so) |
| Part 1 | Python, Pandas & Plotly | [The Foundation](https://notion.so) |
| Part 2 | FastF1 API | [FastF1 Docs](https://docs.fastf1.dev) |
| Part 3 | ML Winner Prediction | [Scikit-Learn Docs](https://scikit-learn.org) |
| Part 4 | AI Race Engineer | This project |

---

## 🙏 Credits & Acknowledgements

- **[FastF1](https://github.com/theOehrly/Fast-F1)** by Philipp Schaefer — the indispensable F1 data library
- **[OpenF1](https://openf1.org)** — free live F1 timing API
- **[Groq](https://groq.com)** — free, ultra-fast Llama 3 inference
- **[Ergast API](https://ergast.com/mrd/)** — historical F1 data
- **[Kaggle F1 Dataset](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020)** — 76 years of race results

---

*Built with ❤️ and way too much coffee. Go racing.*
