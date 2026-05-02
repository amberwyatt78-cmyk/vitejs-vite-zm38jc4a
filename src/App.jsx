import { useState, useEffect, useRef } from "react";

const QUARTERS = [1, 2, 3, 4];
const QUARTER_DURATION = 20 * 60; // 20 minutes in seconds

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

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const pct = (fieldTime, totalGameTime) =>
  totalGameTime > 0 ? Math.round((fieldTime / totalGameTime) * 100) : 0;

export default function FootyManager() {
  const [players, setPlayers] = useState(
    INITIAL_PLAYERS.map((name, i) => ({
      id: i,
      name,
      onField: false,
      fieldTime: [0, 0, 0, 0],
    }))
  );
  const [quarter, setQuarter] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState("field");
  const [newName, setNewName] = useState("");
  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);

  // Main game clock + player time accumulation every second
  useEffect(() => {
    if (running) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSec = Math.round((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        setElapsed((e) => Math.min(e + deltaSec, QUARTER_DURATION));

        setPlayers((prev) =>
          prev.map((p) =>
            p.onField
              ? {
                  ...p,
                  fieldTime: p.fieldTime.map((t, qi) =>
                    qi === quarter - 1 ? t + deltaSec : t
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
        // Block adding to field if already at 16
        if (!p.onField && onFieldCount >= 16) return p;
        return { ...p, onField: !p.onField };
      })
    );
  };

  const onField = players.filter((p) => p.onField);
  const onBench = players.filter((p) => !p.onField);

  const nextQuarter = () => {
    setRunning(false);
    setPlayers((prev) => prev.map((p) => ({ ...p, onField: false })));
    setElapsed(0);
    if (quarter < 4) setQuarter((q) => q + 1);
  };

  const resetAll = () => {
    setRunning(false);
    setElapsed(0);
    setQuarter(1);
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, onField: false, fieldTime: [0, 0, 0, 0] }))
    );
  };

  const addPlayer = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [
      ...prev,
      { id: Date.now(), name: trimmed, onField: false, fieldTime: [0, 0, 0, 0] },
    ]);
    setNewName("");
  };

  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Total game time elapsed across all quarters — used for % calculation
  const totalGameElapsed = (quarter - 1) * QUARTER_DURATION + elapsed;
  const quarterProgress = (elapsed / QUARTER_DURATION) * 100;

  return (
    <div style={styles.root}>
      <div style={styles.grain} />

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏉</span>
          <div>
            <div style={styles.logoTitle}>FIELD BOSS</div>
            <div style={styles.logoSub}>Junior Footy Time Manager</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {["field", "stats"].map((v) => (
            <button
              key={v}
              style={{ ...styles.navBtn, ...(view === v ? styles.navBtnActive : {}) }}
              onClick={() => setView(v)}
            >
              {v === "field" ? "⚡ FIELD" : "📊 STATS"}
            </button>
          ))}
        </nav>
      </header>

      <div style={styles.timerBar}>
        <div style={styles.quarters}>
          {QUARTERS.map((q) => (
            <div
              key={q}
              style={{
                ...styles.quarterPip,
                ...(q === quarter ? styles.quarterPipActive : {}),
                ...(q < quarter ? styles.quarterPipDone : {}),
              }}
            >
              Q{q}
            </div>
          ))}
        </div>
        <div style={styles.timerDisplay}>
          <span style={styles.timerMain}>{formatTime(elapsed)}</span>
          <span style={styles.timerSep}>/</span>
          <span style={styles.timerTotal}>{formatTime(QUARTER_DURATION)}</span>
        </div>
        <div style={styles.progressOuter}>
          <div style={{ ...styles.progressInner, width: `${quarterProgress}%` }} />
        </div>
        <div style={styles.timerControls}>
          <button
            style={{ ...styles.ctrlBtn, ...(running ? styles.ctrlBtnPause : styles.ctrlBtnPlay) }}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "⏸ PAUSE" : "▶ START"}
          </button>
          {quarter < 4 ? (
            <button style={{ ...styles.ctrlBtn, ...styles.ctrlBtnNext }} onClick={nextQuarter}>
              NEXT QTR →
            </button>
          ) : (
            <button style={{ ...styles.ctrlBtn, ...styles.ctrlBtnReset }} onClick={resetAll}>
              ↺ RESET
            </button>
          )}
          <div style={styles.fieldCount}>
            <span style={styles.fieldCountNum}>{onField.length}</span>
            <span style={styles.fieldCountLabel}>on field</span>
          </div>
        </div>
      </div>

      <main style={styles.main}>
        {view === "field" ? (
          <div style={styles.fieldView}>
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <span style={styles.dot} />
                  ON FIELD
                  <span style={styles.badge}>{onField.length}</span>
                </div>
                {onField.length !== 16 && (
                  <span style={{ ...styles.hint, color: onField.length > 16 ? "#ff5f57" : "#ffd60a" }}>
                    {onField.length > 16 ? "⚠ Too many!" : `${16 - onField.length} spots left`}
                  </span>
                )}
              </div>
              <div style={styles.playerGrid}>
                {onField.map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    onField={true}
                    quarter={quarter}
                    totalGameElapsed={totalGameElapsed}
                    onToggle={() => togglePlayer(p.id)}
                    onRemove={() => removePlayer(p.id)}
                  />
                ))}
                {onField.length === 0 && (
                  <div style={styles.emptyMsg}>Tap bench players to add them →</div>
                )}
              </div>
            </section>

            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <span style={{ ...styles.dot, background: "#636e72" }} />
                  BENCH
                  <span style={{ ...styles.badge, background: "#2d3436", color: "#b2bec3" }}>{onBench.length}</span>
                </div>
              </div>
              <div style={styles.playerGrid}>
                {onBench.map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    onField={false}
                    quarter={quarter}
                    totalGameElapsed={totalGameElapsed}
                    onToggle={() => togglePlayer(p.id)}
                    onRemove={() => removePlayer(p.id)}
                  />
                ))}
              </div>
              <div style={styles.addPlayer}>
                <input
                  style={styles.addInput}
                  placeholder="Add player name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
                <button style={styles.addBtn} onClick={addPlayer}>+ ADD</button>
              </div>
            </section>
          </div>
        ) : (
          <StatsView players={players} quarter={quarter} totalGameElapsed={totalGameElapsed} />
        )}
      </main>
    </div>
  );
}

function PlayerCard({ player, onField, quarter, totalGameElapsed, onToggle, onRemove }) {
  const qTime = player.fieldTime[quarter - 1];
  const totalFieldTime = player.fieldTime.reduce((a, b) => a + b, 0);
  const usage = pct(totalFieldTime, totalGameElapsed);

  return (
    <div style={{ ...styles.card, ...(onField ? styles.cardOn : styles.cardOff) }}>
      <div style={styles.cardTop}>
        <div style={styles.playerName}>{player.name}</div>
        <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
      </div>
      <div style={styles.cardTimes}>
        <div style={styles.timeBlock}>
          <span style={styles.timeVal}>{formatTime(qTime)}</span>
          <span style={styles.timeLabel}>Q{quarter}</span>
        </div>
        <div style={styles.timeDivider} />
        <div style={styles.timeBlock}>
          <span style={styles.timeVal}>{formatTime(totalFieldTime)}</span>
          <span style={styles.timeLabel}>TOTAL</span>
        </div>
        <div style={styles.timeDivider} />
        <div style={styles.timeBlock}>
          <span style={{
            ...styles.timeVal,
            color: usage >= 70 ? "#00b894" : usage >= 40 ? "#ffd60a" : "#ff5f57"
          }}>
            {usage}%
          </span>
          <span style={styles.timeLabel}>GAME%</span>
        </div>
      </div>
      <div style={styles.usageBar}>
        <div style={{
          ...styles.usageFill,
          width: `${usage}%`,
          background: usage >= 70 ? "#00b894" : usage >= 40 ? "#ffd60a" : "#ff5f57"
        }} />
      </div>
      <button
        style={{ ...styles.toggleBtn, ...(onField ? styles.toggleOff : styles.toggleOn) }}
        onClick={onToggle}
      >
        {onField ? "→ BENCH" : "→ FIELD"}
      </button>
    </div>
  );
}

function StatsView({ players, quarter, totalGameElapsed }) {
  const sorted = [...players].sort(
    (a, b) => b.fieldTime.reduce((x, y) => x + y, 0) - a.fieldTime.reduce((x, y) => x + y, 0)
  );

  return (
    <div style={styles.statsView}>
      <div style={styles.statsHeader}>
        <div style={styles.statsMeta}>
          Q{quarter} · {formatTime(totalGameElapsed)} game time elapsed
        </div>
      </div>
      <div style={styles.statsTable}>
        <div style={styles.statsRow}>
          <div style={{ ...styles.statsCell, ...styles.statsCellHead, flex: 2 }}>PLAYER</div>
          {[1, 2, 3, 4].map((q) => (
            <div key={q} style={{ ...styles.statsCell, ...styles.statsCellHead }}>Q{q}</div>
          ))}
          <div style={{ ...styles.statsCell, ...styles.statsCellHead }}>TOTAL</div>
          <div style={{ ...styles.statsCell, ...styles.statsCellHead }}>GAME%</div>
        </div>
        {sorted.map((p, i) => {
          const total = p.fieldTime.reduce((a, b) => a + b, 0);
          const usage = pct(total, totalGameElapsed);
          return (
            <div key={p.id} style={{ ...styles.statsRow, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
              <div style={{ ...styles.statsCell, flex: 2, fontWeight: 600, color: "#dfe6e9" }}>
                <span style={styles.rankNum}>{i + 1}</span>
                {p.name}
              </div>
              {p.fieldTime.map((t, qi) => (
                <div key={qi} style={{ ...styles.statsCell, color: t > 0 ? "#b2bec3" : "#4a5568" }}>
                  {t > 0 ? formatTime(t) : "–"}
                </div>
              ))}
              <div style={{ ...styles.statsCell, fontWeight: 700, color: "#dfe6e9" }}>{formatTime(total)}</div>
              <div style={styles.statsCell}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  background: usage >= 70 ? "rgba(0,184,148,0.2)" : usage >= 40 ? "rgba(255,214,10,0.2)" : "rgba(255,95,87,0.2)",
                  color: usage >= 70 ? "#00b894" : usage >= 40 ? "#ffd60a" : "#ff5f57",
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

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#dfe6e9",
    fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(13,17,23,0.9)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 20, fontWeight: 700, letterSpacing: 4, color: "#ffd60a", lineHeight: 1 },
  logoSub: { fontSize: 10, color: "#636e72", letterSpacing: 2, marginTop: 2 },
  nav: { display: "flex", gap: 8 },
  navBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#636e72",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
    letterSpacing: 2,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  navBtnActive: {
    background: "rgba(255,214,10,0.1)",
    borderColor: "#ffd60a",
    color: "#ffd60a",
  },
  timerBar: {
    padding: "16px 24px",
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
    zIndex: 5,
  },
  quarters: { display: "flex", gap: 8, marginBottom: 12 },
  quarterPip: {
    padding: "4px 12px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#4a5568",
    background: "transparent",
  },
  quarterPipActive: {
    background: "rgba(255,214,10,0.15)",
    borderColor: "#ffd60a",
    color: "#ffd60a",
  },
  quarterPipDone: {
    background: "rgba(0,184,148,0.1)",
    borderColor: "#00b894",
    color: "#00b894",
  },
  timerDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 8,
  },
  timerMain: { fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: 2 },
  timerSep: { fontSize: 20, color: "#4a5568" },
  timerTotal: { fontSize: 18, color: "#636e72" },
  progressOuter: {
    height: 4,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #ffd60a, #ff9f43)",
    borderRadius: 2,
    transition: "width 1s linear",
  },
  timerControls: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  ctrlBtn: {
    padding: "9px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: 2,
    transition: "all 0.15s",
  },
  ctrlBtnPlay: { background: "#ffd60a", color: "#0d1117" },
  ctrlBtnPause: { background: "#ff9f43", color: "#0d1117" },
  ctrlBtnNext: { background: "#0984e3", color: "#fff" },
  ctrlBtnReset: { background: "#2d3436", color: "#b2bec3", border: "1px solid rgba(255,255,255,0.1)" },
  fieldCount: {
    marginLeft: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  fieldCountNum: { fontSize: 28, fontWeight: 700, color: "#ffd60a", lineHeight: 1 },
  fieldCountLabel: { fontSize: 10, color: "#636e72", letterSpacing: 2, marginTop: 2 },
  main: { padding: "24px", position: "relative", zIndex: 1 },
  fieldView: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  section: {},
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#b2bec3",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#ffd60a",
    boxShadow: "0 0 8px #ffd60a",
  },
  badge: {
    background: "rgba(255,214,10,0.15)",
    color: "#ffd60a",
    borderRadius: 4,
    padding: "1px 7px",
    fontSize: 11,
  },
  hint: { fontSize: 11, fontWeight: 600, letterSpacing: 1 },
  playerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  card: {
    borderRadius: 8,
    padding: 12,
    border: "1px solid",
    transition: "all 0.2s",
    cursor: "default",
  },
  cardOn: {
    background: "rgba(255,214,10,0.05)",
    borderColor: "rgba(255,214,10,0.25)",
  },
  cardOff: {
    background: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  playerName: { fontSize: 13, fontWeight: 700, color: "#dfe6e9", lineHeight: 1.2 },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#4a5568",
    cursor: "pointer",
    fontSize: 10,
    padding: "0 2px",
    lineHeight: 1,
    fontFamily: "inherit",
  },
  cardTimes: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  timeBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  timeVal: { fontSize: 13, fontWeight: 700, color: "#dfe6e9", letterSpacing: 1, lineHeight: 1 },
  timeLabel: { fontSize: 9, color: "#636e72", letterSpacing: 1, marginTop: 2 },
  timeDivider: { width: 1, height: 24, background: "rgba(255,255,255,0.08)" },
  usageBar: {
    height: 3,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  usageFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 1s linear",
  },
  toggleBtn: {
    width: "100%",
    padding: "7px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 10,
    fontFamily: "inherit",
    fontWeight: 700,
    letterSpacing: 2,
    transition: "all 0.15s",
  },
  toggleOn: { background: "rgba(255,214,10,0.15)", color: "#ffd60a" },
  toggleOff: { background: "rgba(255,255,255,0.06)", color: "#b2bec3" },
  addPlayer: { display: "flex", gap: 8, marginTop: 4 },
  addInput: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#dfe6e9",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  },
  addBtn: {
    background: "rgba(255,214,10,0.1)",
    border: "1px solid rgba(255,214,10,0.3)",
    color: "#ffd60a",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
  },
  emptyMsg: { color: "#4a5568", fontSize: 12, padding: "20px 0", letterSpacing: 1 },
  statsView: { maxWidth: 900, margin: "0 auto" },
  statsHeader: { marginBottom: 16 },
  statsMeta: { fontSize: 11, color: "#636e72", letterSpacing: 2 },
  statsTable: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    overflow: "hidden",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  statsCell: {
    flex: 1,
    padding: "12px 10px",
    fontSize: 12,
    color: "#636e72",
    textAlign: "center",
  },
  statsCellHead: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#4a5568",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  rankNum: {
    display: "inline-block",
    width: 20,
    fontSize: 10,
    color: "#4a5568",
    marginRight: 6,
  },
};

