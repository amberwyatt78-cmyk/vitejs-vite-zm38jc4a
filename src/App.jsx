import { useState, useEffect, useRef } from "react";

const QUARTERS = [1, 2, 3, 4];
const QUARTER_DURATION = 20 * 60; // 20 min in seconds
const TOTAL_GAME_SECONDS = 80 * 60; // 80 min in seconds

const INITIAL_PLAYERS = [
  'Max ADJUK',
  'Elijah AYRES',
  'Noah BALIFF',
  'Jack BERTRAM',
  'Tommy BOSCHETTO',
  'Silas BROUGHAM',
  'Jimmy CRABB',
  'Michael CRUM',
  'Chayse DUFFEY',
  'Robert GERARDI',
  'Daniel HARDING-COLISS',
  'Hayden JOHNSON',
  'David MAGUIRE',
  'Edward MILES',
  'Stanley MORRISON',
  'Jacob PESTANA',
  'Angus ROULSTON',
  'Noah SMITH',
  'Jax, TERRILL',
  'Kaelen WARNE',
  'Caleb WATTLEWORTH',
  'Jack WHITE',
];

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// % of elapsed game time (updates live as game progresses)
const gamePct = (fieldSecs, elapsedGameSecs) =>
  elapsedGameSecs > 0
    ? Math.min(100, Math.round((fieldSecs / elapsedGameSecs) * 100))
    : 0;

const makePlayer = (name, id) => ({
  id,
  name,
  onField: false,
  fieldTime: 0,        // cumulative total seconds on field across entire game
  quarterTimes: [0, 0, 0, 0], // field seconds broken down per quarter
});

export default function FootyManager() {
  const [players, setPlayers] = useState(
    INITIAL_PLAYERS.map((name, i) => makePlayer(name, i))
  );
  const [quarter, setQuarter] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // quarter clock
  const [totalGameElapsed, setTotalGameElapsed] = useState(0); // entire game clock
  const [view, setView] = useState("field");
  const [newName, setNewName] = useState("");
  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);

  // Every second: advance quarter clock + add 1s to every on-field player
  useEffect(() => {
    if (running) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.round((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        // Advance quarter clock, cap at quarter duration
        setElapsed((e) => Math.min(e + delta, QUARTER_DURATION));

        // Advance total game clock, cap at full game duration
        setTotalGameElapsed((t) => Math.min(t + delta, TOTAL_GAME_SECONDS));

        // Add delta only to players currently on field
        setPlayers((prev) =>
          prev.map((p) =>
            p.onField
              ? {
                  ...p,
                  fieldTime: p.fieldTime + delta,
                  quarterTimes: p.quarterTimes.map((t, qi) =>
                    qi === quarter - 1 ? t + delta : t
                  ),
                }
              : p
          )
        );
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, quarter]);

  const togglePlayer = (id) => {
    const onFieldCount = players.filter((p) => p.onField).length;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (!p.onField && onFieldCount >= 16) return p; // hard cap at 16
        return { ...p, onField: !p.onField };
      })
    );
  };

  const onFieldPlayers = players.filter((p) => p.onField);
  const benchPlayers = players.filter((p) => !p.onField);

  const nextQuarter = () => {
    setRunning(false);
    setElapsed(0); // reset quarter clock only
    // players and their fieldTime carry over — no reset
    if (quarter < 4) setQuarter((q) => q + 1);
  };

  const resetAll = () => {
    setRunning(false);
    setElapsed(0);
    setTotalGameElapsed(0);
    setQuarter(1);
    setPlayers((prev) => prev.map((p) => ({ ...p, onField: false, fieldTime: 0, quarterTimes: [0, 0, 0, 0] })));
  };

  const addPlayer = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [...prev, makePlayer(trimmed, Date.now())]);
    setNewName("");
  };

  const removePlayer = (id) =>
    setPlayers((prev) => prev.filter((p) => p.id !== id));

  const quarterProgress = (elapsed / QUARTER_DURATION) * 100;

  return (
    <div style={S.root}>
      <div style={S.grain} />

      {/* Header */}
      <header style={S.header}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🏉</span>
          <div>
            <div style={S.logoTitle}>FIELD BOSS</div>
            <div style={S.logoSub}>Junior Footy Time Manager</div>
          </div>
        </div>
        <nav style={S.nav}>
          {["field", "stats"].map((v) => (
            <button
              key={v}
              style={{ ...S.navBtn, ...(view === v ? S.navBtnActive : {}) }}
              onClick={() => setView(v)}
            >
              {v === "field" ? "⚡ FIELD" : "📊 STATS"}
            </button>
          ))}
        </nav>
      </header>

      {/* Timer bar */}
      <div style={S.timerBar}>
        <div style={S.quarters}>
          {QUARTERS.map((q) => (
            <div
              key={q}
              style={{
                ...S.qPip,
                ...(q === quarter ? S.qPipActive : {}),
                ...(q < quarter ? S.qPipDone : {}),
              }}
            >
              Q{q}
            </div>
          ))}
        </div>
        <div style={S.timerRow}>
          <span style={S.timerMain}>{formatTime(elapsed)}</span>
          <span style={S.timerSep}>/</span>
          <span style={S.timerSub}>{formatTime(QUARTER_DURATION)}</span>
        </div>
        <div style={S.progressOuter}>
          <div style={{ ...S.progressInner, width: `${quarterProgress}%` }} />
        </div>
        <div style={S.controls}>
          <button
            style={{ ...S.btn, ...(running ? S.btnPause : S.btnPlay) }}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "⏸ PAUSE" : "▶ START"}
          </button>
          {quarter < 4 ? (
            <button style={{ ...S.btn, ...S.btnNext }} onClick={nextQuarter}>
              NEXT QTR →
            </button>
          ) : (
            <button style={{ ...S.btn, ...S.btnReset }} onClick={resetAll}>
              ↺ RESET
            </button>
          )}
          <div style={S.fieldCount}>
            <span style={S.fieldCountNum}>{onFieldPlayers.length}</span>
            <span style={S.fieldCountLabel}>on field</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <main style={S.main}>
        {view === "field" ? (
          <div style={S.twoCol}>
            {/* On Field */}
            <section>
              <div style={S.secHeader}>
                <div style={S.secTitle}>
                  <span style={S.dot} />
                  ON FIELD
                  <span style={S.badge}>{onFieldPlayers.length}</span>
                </div>
                {onFieldPlayers.length < 16 && (
                  <span style={S.spotsLeft}>
                    {16 - onFieldPlayers.length} spots left
                  </span>
                )}
                {onFieldPlayers.length > 16 && (
                  <span style={{ ...S.spotsLeft, color: "#ff5f57" }}>⚠ Too many!</span>
                )}
              </div>
              <div style={S.grid}>
                {onFieldPlayers.map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    onField
                    totalGameElapsed={totalGameElapsed}
                    onToggle={() => togglePlayer(p.id)}
                    onRemove={() => removePlayer(p.id)}
                  />
                ))}
                {onFieldPlayers.length === 0 && (
                  <div style={S.empty}>Tap bench players to add →</div>
                )}
              </div>
            </section>

            {/* Bench */}
            <section>
              <div style={S.secHeader}>
                <div style={{ ...S.secTitle }}>
                  <span style={{ ...S.dot, background: "#636e72" }} />
                  BENCH
                  <span style={{ ...S.badge, background: "#2d3436", color: "#b2bec3" }}>
                    {benchPlayers.length}
                  </span>
                </div>
              </div>
              <div style={S.grid}>
                {benchPlayers.map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    onField={false}
                    totalGameElapsed={totalGameElapsed}
                    onToggle={() => togglePlayer(p.id)}
                    onRemove={() => removePlayer(p.id)}
                  />
                ))}
              </div>
              <div style={S.addRow}>
                <input
                  style={S.addInput}
                  placeholder="Add player name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
                <button style={S.addBtn} onClick={addPlayer}>+ ADD</button>
              </div>
            </section>
          </div>
        ) : (
          <StatsView players={players} totalGameElapsed={totalGameElapsed} />
        )}
      </main>
    </div>
  );
}

// ─── Player Card ────────────────────────────────────────────────────────────

function PlayerCard({ player, onField, totalGameElapsed, onToggle, onRemove }) {
  const usage = gamePct(player.fieldTime, totalGameElapsed);
  const usageColor = usage >= 70 ? "#00b894" : usage >= 40 ? "#ffd60a" : "#ff5f57";

  return (
    <div style={{ ...S.card, ...(onField ? S.cardOn : S.cardOff) }}>
      <div style={S.cardTop}>
        <div style={S.playerName}>{player.name}</div>
        <button
          style={S.removeBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >✕</button>
      </div>

      {/* Big cumulative total */}
      <div style={S.bigTime}>{formatTime(player.fieldTime)}</div>
      <div style={S.bigTimeLabel}>TOTAL FIELD TIME</div>

      {/* Quarter breakdown */}
      <div style={S.qBreakdown}>
        {player.quarterTimes.map((t, i) => (
          <div key={i} style={S.qBreakItem}>
            <span style={S.qBreakVal}>{formatTime(t)}</span>
            <span style={S.qBreakLabel}>Q{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Usage bar + % of elapsed game time */}
      <div style={S.usageRow}>
        <div style={S.usageBar}>
          <div style={{ ...S.usageFill, width: `${usage}%`, background: usageColor }} />
        </div>
        <span style={{ ...S.usagePct, color: usageColor }}>{usage}%</span>
      </div>

      <button
        style={{ ...S.toggleBtn, ...(onField ? S.toggleOff : S.toggleOn) }}
        onClick={onToggle}
      >
        {onField ? "→ BENCH" : "→ FIELD"}
      </button>
    </div>
  );
}

// ─── Stats View ──────────────────────────────────────────────────────────────

function StatsView({ players, totalGameElapsed }) {
  const sorted = [...players].sort((a, b) => b.fieldTime - a.fieldTime);

  return (
    <div style={S.statsView}>
      <div style={S.statsMeta}>
        Ranked by field time · % of {formatTime(totalGameElapsed)} elapsed game time
      </div>
      <div style={S.statsTable}>
        <div style={S.statsRow}>
          <div style={{ ...S.cell, ...S.cellHead, flex: 2 }}>PLAYER</div>
          <div style={{ ...S.cell, ...S.cellHead }}>Q1</div>
          <div style={{ ...S.cell, ...S.cellHead }}>Q2</div>
          <div style={{ ...S.cell, ...S.cellHead }}>Q3</div>
          <div style={{ ...S.cell, ...S.cellHead }}>Q4</div>
          <div style={{ ...S.cell, ...S.cellHead }}>TOTAL</div>
          <div style={{ ...S.cell, ...S.cellHead }}>GAME%</div>
        </div>
        {sorted.map((p, i) => {
          const usage = gamePct(p.fieldTime, totalGameElapsed);
          const usageColor = usage >= 70 ? "#00b894" : usage >= 40 ? "#ffd60a" : "#ff5f57";
          return (
            <div
              key={p.id}
              style={{ ...S.statsRow, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}
            >
              <div style={{ ...S.cell, flex: 2, fontWeight: 600, color: "#dfe6e9" }}>
                <span style={S.rank}>{i + 1}</span>{p.name}
              </div>
              {p.quarterTimes.map((t, qi) => (
                <div key={qi} style={{ ...S.cell, color: t > 0 ? "#b2bec3" : "#4a5568" }}>
                  {t > 0 ? formatTime(t) : "–"}
                </div>
              ))}
              <div style={{ ...S.cell, fontWeight: 700, color: "#dfe6e9" }}>
                {formatTime(p.fieldTime)}
              </div>
              <div style={S.cell}>
                <span style={{
                  padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                  background: usage >= 70 ? "rgba(0,184,148,0.2)" : usage >= 40 ? "rgba(255,214,10,0.2)" : "rgba(255,95,87,0.2)",
                  color: usageColor,
                }}>
                  {usage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#dfe6e9",
    fontFamily: "'DM Mono','Fira Mono','Courier New',monospace",
    position: "relative",
  },
  grain: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(13,17,23,0.95)", position: "sticky", top: 0, zIndex: 10,
  },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 20, fontWeight: 700, letterSpacing: 4, color: "#ffd60a", lineHeight: 1 },
  logoSub: { fontSize: 10, color: "#636e72", letterSpacing: 2, marginTop: 2 },
  nav: { display: "flex", gap: 8 },
  navBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#636e72",
    padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 11,
    fontFamily: "inherit", letterSpacing: 2, fontWeight: 600,
  },
  navBtnActive: { background: "rgba(255,214,10,0.1)", borderColor: "#ffd60a", color: "#ffd60a" },
  timerBar: {
    padding: "16px 24px", background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 5,
  },
  quarters: { display: "flex", gap: 8, marginBottom: 12 },
  qPip: {
    padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700,
    letterSpacing: 2, border: "1px solid rgba(255,255,255,0.1)", color: "#4a5568",
  },
  qPipActive: { background: "rgba(255,214,10,0.15)", borderColor: "#ffd60a", color: "#ffd60a" },
  qPipDone: { background: "rgba(0,184,148,0.1)", borderColor: "#00b894", color: "#00b894" },
  timerRow: { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 },
  timerMain: { fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: 2 },
  timerSep: { fontSize: 20, color: "#4a5568" },
  timerSub: { fontSize: 18, color: "#636e72" },
  progressOuter: { height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 12, overflow: "hidden" },
  progressInner: { height: "100%", background: "linear-gradient(90deg,#ffd60a,#ff9f43)", borderRadius: 2, transition: "width 1s linear" },
  controls: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  btn: { padding: "9px 20px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 700, letterSpacing: 2 },
  btnPlay: { background: "#ffd60a", color: "#0d1117" },
  btnPause: { background: "#ff9f43", color: "#0d1117" },
  btnNext: { background: "#0984e3", color: "#fff" },
  btnReset: { background: "#2d3436", color: "#b2bec3", border: "1px solid rgba(255,255,255,0.1)" },
  fieldCount: { marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" },
  fieldCountNum: { fontSize: 28, fontWeight: 700, color: "#ffd60a", lineHeight: 1 },
  fieldCountLabel: { fontSize: 10, color: "#636e72", letterSpacing: 2, marginTop: 2 },
  main: { padding: "24px", position: "relative", zIndex: 1 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  secHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  secTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#b2bec3" },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#ffd60a", boxShadow: "0 0 8px #ffd60a" },
  badge: { background: "rgba(255,214,10,0.15)", color: "#ffd60a", borderRadius: 4, padding: "1px 7px", fontSize: 11 },
  spotsLeft: { fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#ffd60a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 12 },
  empty: { color: "#4a5568", fontSize: 12, padding: "20px 0", letterSpacing: 1 },
  card: { borderRadius: 8, padding: 12, border: "1px solid", transition: "all 0.2s" },
  cardOn: { background: "rgba(255,214,10,0.05)", borderColor: "rgba(255,214,10,0.25)" },
  cardOff: { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  playerName: { fontSize: 13, fontWeight: 700, color: "#dfe6e9", lineHeight: 1.2 },
  removeBtn: { background: "transparent", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 10, padding: "0 2px", fontFamily: "inherit" },
  bigTime: { fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: 2, textAlign: "center", marginBottom: 2 },
  bigTimeLabel: { fontSize: 9, color: "#636e72", letterSpacing: 2, textAlign: "center", marginBottom: 6 },
  qBreakdown: { display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 2 },
  qBreakItem: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  qBreakVal: { fontSize: 10, fontWeight: 600, color: "#b2bec3", letterSpacing: 1 },
  qBreakLabel: { fontSize: 8, color: "#4a5568", letterSpacing: 1, marginTop: 1 },
  usageRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  usageBar: { flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  usageFill: { height: "100%", borderRadius: 2, transition: "width 1s linear" },
  usagePct: { fontSize: 11, fontWeight: 700, minWidth: 34, textAlign: "right" },
  toggleBtn: { width: "100%", padding: "7px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 700, letterSpacing: 2 },
  toggleOn: { background: "rgba(255,214,10,0.15)", color: "#ffd60a" },
  toggleOff: { background: "rgba(255,255,255,0.06)", color: "#b2bec3" },
  addRow: { display: "flex", gap: 8, marginTop: 4 },
  addInput: { flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 12px", color: "#dfe6e9", fontSize: 12, fontFamily: "inherit", outline: "none" },
  addBtn: { background: "rgba(255,214,10,0.1)", border: "1px solid rgba(255,214,10,0.3)", color: "#ffd60a", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  statsView: { maxWidth: 900, margin: "0 auto" },
  statsMeta: { fontSize: 11, color: "#636e72", letterSpacing: 2, marginBottom: 16 },
  statsTable: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" },
  statsRow: { display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  cell: { flex: 1, padding: "12px 10px", fontSize: 12, color: "#636e72", textAlign: "center" },
  cellHead: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#4a5568", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  rank: { display: "inline-block", width: 20, fontSize: 10, color: "#4a5568", marginRight: 6 },
};
