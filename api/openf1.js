/**
 * PitWall — OpenF1 Data Proxy
 * Vercel Serverless Function
 *
 * Fetches real F1 data from api.openf1.org (free, no auth needed)
 * and returns a unified race state object to the frontend.
 *
 * Endpoint: GET /api/openf1
 * Returns: { drivers, weather, raceControl, meta, isLive }
 */

const OPENF1 = 'https://api.openf1.org/v1';

// Driver number → code/name/team mapping (2025 grid)
const DRIVER_INFO = {
  1:  { code:'VER', name:'Max Verstappen',    team:'Red Bull',  color:'#3671C6' },
  4:  { code:'NOR', name:'Lando Norris',       team:'McLaren',   color:'#FF8000' },
  16: { code:'LEC', name:'Charles Leclerc',    team:'Ferrari',   color:'#E8002D' },
  63: { code:'RUS', name:'George Russell',     team:'Mercedes',  color:'#00D2BE' },
  44: { code:'HAM', name:'Lewis Hamilton',     team:'Ferrari',   color:'#E8002D' },
  81: { code:'PIA', name:'Oscar Piastri',      team:'McLaren',   color:'#FF8000' },
  14: { code:'ALO', name:'Fernando Alonso',    team:'Aston',     color:'#358C75' },
  55: { code:'SAI', name:'Carlos Sainz',       team:'Williams',  color:'#64C4FF' },
  23: { code:'ALB', name:'Alex Albon',         team:'Williams',  color:'#64C4FF' },
  22: { code:'TSU', name:'Yuki Tsunoda',       team:'Red Bull',  color:'#3671C6' },
  10: { code:'GAS', name:'Pierre Gasly',       team:'Alpine',    color:'#FF87BC' },
  31: { code:'OCO', name:'Esteban Ocon',       team:'Haas',      color:'#B6BABD' },
  27: { code:'HUL', name:'Nico Hulkenberg',    team:'Kick',      color:'#52E252' },
  18: { code:'STR', name:'Lance Stroll',       team:'Aston',     color:'#358C75' },
  87: { code:'DRU', name:'Jack Doohan',        team:'Alpine',    color:'#FF87BC' },
  30: { code:'LAW', name:'Liam Lawson',        team:'Red Bull',  color:'#3671C6' },
  5:  { code:'BEA', name:'Oliver Bearman',     team:'Haas',      color:'#B6BABD' },
  38: { code:'COL', name:'Franco Colapinto',   team:'Alpine',    color:'#FF87BC' },
  12: { code:'ANT', name:'Kimi Antonelli',     team:'Mercedes',  color:'#00D2BE' },
  6:  { code:'HAD', name:'Isack Hadjar',       team:'Red Bull',  color:'#3671C6' },
};

const TIRE_MAP = {
  'SOFT':'S', 'MEDIUM':'M', 'HARD':'H',
  'INTERMEDIATE':'I', 'WET':'W',
  'S':'S','M':'M','H':'H','I':'I','W':'W'
};

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${url}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ── 1. Find the latest/current session ────────────────────────────────
    const sessions = await fetchJSON(
      `${OPENF1}/sessions?year=2025&session_type=Race`
    );
    if (!sessions.length) throw new Error('No 2025 race sessions found');

    // Sort by date descending, pick latest
    sessions.sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
    const session = sessions[0];
    const sessionKey = session.session_key;

    // Determine if this session is live (started within last 4 hours)
    const sessionStart = new Date(session.date_start);
    const sessionEnd = new Date(session.date_end || session.date_start);
    const now = new Date();
    const isLive = now >= sessionStart && now <= new Date(sessionEnd.getTime() + 4 * 3600 * 1000);

    // ── 2. Fetch all data in parallel ─────────────────────────────────────
    const [positions, laps, stints, pit, weather, raceControl, driversRaw] = await Promise.allSettled([
      fetchJSON(`${OPENF1}/position?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/laps?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/stints?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/pit?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/weather?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/race_control?session_key=${sessionKey}`),
      fetchJSON(`${OPENF1}/drivers?session_key=${sessionKey}`),
    ]);

    const pos   = positions.status === 'fulfilled'   ? positions.value   : [];
    const lapData  = laps.status === 'fulfilled'     ? laps.value        : [];
    const stintData = stints.status === 'fulfilled'  ? stints.value      : [];
    const pitData   = pit.status === 'fulfilled'     ? pit.value         : [];
    const wxData    = weather.status === 'fulfilled' ? weather.value     : [];
    const rcData    = raceControl.status === 'fulfilled' ? raceControl.value : [];
    const driversData = driversRaw.status === 'fulfilled' ? driversRaw.value : [];

    // ── 3. Build driver info from OpenF1 drivers endpoint ─────────────────
    const driverMeta = {};
    driversData.forEach(d => {
      driverMeta[d.driver_number] = {
        code: d.name_acronym || DRIVER_INFO[d.driver_number]?.code || `D${d.driver_number}`,
        name: d.full_name || DRIVER_INFO[d.driver_number]?.name || `Driver ${d.driver_number}`,
        team: d.team_name || DRIVER_INFO[d.driver_number]?.team || 'Unknown',
        color: d.team_colour ? '#' + d.team_colour : (DRIVER_INFO[d.driver_number]?.color || '#888'),
      };
    });
    // Merge fallback for any missing
    Object.entries(DRIVER_INFO).forEach(([num, info]) => {
      if (!driverMeta[num]) driverMeta[num] = info;
    });

    // ── 4. Latest position per driver ─────────────────────────────────────
    const latestPos = {};
    pos.forEach(p => {
      const existing = latestPos[p.driver_number];
      if (!existing || new Date(p.date) > new Date(existing.date)) {
        latestPos[p.driver_number] = p;
      }
    });

    // ── 5. Latest lap per driver ───────────────────────────────────────────
    const latestLap = {};
    const allLapsByDriver = {};
    lapData.forEach(l => {
      const n = l.driver_number;
      if (!allLapsByDriver[n]) allLapsByDriver[n] = [];
      allLapsByDriver[n].push(l);
      const ex = latestLap[n];
      if (!ex || l.lap_number > ex.lap_number) latestLap[n] = l;
    });

    // ── 6. Current stint (tire) per driver ────────────────────────────────
    const currentStint = {};
    stintData.forEach(s => {
      const n = s.driver_number;
      const ex = currentStint[n];
      if (!ex || s.stint_number > ex.stint_number) currentStint[n] = s;
    });

    // ── 7. Pit log ────────────────────────────────────────────────────────
    const pitLog = pitData
      .filter(p => p.pit_duration && p.pit_duration < 60)
      .map(p => {
        const meta = driverMeta[p.driver_number] || {};
        const stint = stintData.find(s =>
          s.driver_number === p.driver_number && s.lap_start === p.lap_number + 1
        );
        const prevStint = stintData.find(s =>
          s.driver_number === p.driver_number && s.lap_end === p.lap_number
        );
        return {
          lap: p.lap_number,
          code: meta.code || `#${p.driver_number}`,
          color: meta.color || '#888',
          from: TIRE_MAP[prevStint?.compound] || 'M',
          to: TIRE_MAP[stint?.compound] || 'M',
          duration: p.pit_duration,
        };
      })
      .sort((a, b) => b.lap - a.lap);

    // ── 8. Determine current lap ───────────────────────────────────────────
    let maxLap = 0;
    Object.values(latestLap).forEach(l => { if (l.lap_number > maxLap) maxLap = l.lap_number; });

    // ── 9. Build drivers array ────────────────────────────────────────────
    const driverNums = [...new Set([
      ...Object.keys(latestPos),
      ...Object.keys(latestLap),
    ].map(Number))];

    // Calculate gaps from leader
    const positionedDrivers = driverNums
      .map(n => {
        const p = latestPos[n] || {};
        const l = latestLap[n] || {};
        const s = currentStint[n] || {};
        const meta = driverMeta[n] || DRIVER_INFO[n] || { code:`D${n}`, name:`Driver ${n}`, team:'Unknown', color:'#888' };
        const pitsCount = pitData.filter(p2 => p2.driver_number === n).length;
        const lapTime = l.lap_duration || null;
        const lapHistory = (allLapsByDriver[n] || [])
          .filter(lp => lp.lap_duration && lp.lap_duration > 60 && lp.lap_duration < 130)
          .map(lp => lp.lap_duration)
          .slice(-20);
        const bestLap = lapHistory.length ? Math.min(...lapHistory) : (lapTime || 90);
        const tireAge = s.lap_start ? maxLap - s.lap_start + 1 : 1;

        return {
          driverNumber: n,
          code: meta.code,
          name: meta.name,
          team: meta.team,
          color: meta.color,
          pos: p.position || 20,
          gap: 0, // calculated below
          interval: 0,
          lastLap: lapTime || (bestLap + Math.random() * 0.5),
          bestLap,
          lapHistory,
          tire: TIRE_MAP[s.compound] || 'M',
          tireAge: Math.max(1, tireAge),
          pits: pitsCount,
          drs: false,
          inPit: false,
          justExited: false,
          posChange: 0,
        };
      })
      .sort((a, b) => a.pos - b.pos);

    // Calculate gaps from positions (approximate using lap time deltas)
    let cumGap = 0;
    positionedDrivers.forEach((d, i) => {
      if (i === 0) { d.gap = 0; return; }
      const lapDiff = d.lastLap - (positionedDrivers[0]?.lastLap || d.lastLap);
      cumGap += Math.max(0.1, lapDiff * (i * 0.3 + 0.5));
      d.gap = parseFloat(cumGap.toFixed(3));
    });

    // ── 10. Weather ────────────────────────────────────────────────────────
    const latestWx = wxData.length ? wxData[wxData.length - 1] : null;
    const weather = latestWx ? {
      trackTemp: Math.round(latestWx.track_temperature ?? 35),
      airTemp:   Math.round(latestWx.air_temperature   ?? 22),
      humidity:  Math.round(latestWx.humidity          ?? 50),
      windSpeed: Math.round((latestWx.wind_speed ?? 3) * 3.6),
      rainfall:  latestWx.rainfall ?? false,
    } : null;

    // ── 11. Race control / flag state ─────────────────────────────────────
    const latestRC = rcData.length ? rcData[rcData.length - 1] : null;
    let flagState = 'green';
    if (latestRC) {
      const msg = (latestRC.message || '').toLowerCase();
      if (msg.includes('safety car') || latestRC.category === 'SafetyCar') flagState = 'sc';
      else if (msg.includes('virtual safety car') || msg.includes('vsc')) flagState = 'yellow';
      else if (latestRC.flag === 'YELLOW') flagState = 'yellow';
      else if (latestRC.flag === 'RED') flagState = 'red';
    }

    // Recent race control messages for ticker
    const rcMessages = rcData
      .slice(-5)
      .reverse()
      .map(m => m.message || '')
      .filter(Boolean)
      .join(' · ');

    // ── 12. Meta ───────────────────────────────────────────────────────────
    const totalLaps = session.total_laps || 58;
    const meta = {
      sessionKey,
      eventName: session.meeting_name || session.circuit_short_name || 'Grand Prix',
      circuitName: session.circuit_short_name || '',
      year: session.year || 2025,
      round: session.meeting_key || 1,
      currentLap: maxLap || Math.floor(totalLaps * 0.7),
      totalLaps,
      flag: '🏁',
    };

    return res.status(200).json({
      ok: true,
      isLive,
      sessionKey,
      meta,
      drivers: positionedDrivers,
      pitLog,
      weather,
      flagState,
      rcMessages,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('OpenF1 proxy error:', err.message);
    return res.status(500).json({
      ok: false,
      error: err.message,
      isLive: false,
    });
  }
}
