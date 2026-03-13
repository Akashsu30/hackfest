const COLORS = {
  easy:       { color: "#66bb6a", bg: "rgba(102,187,106,0.1)", border: "#66bb6a", emoji: "😊" },
  moderate:   { color: "#ffca28", bg: "rgba(255,202,40,0.1)",  border: "#ffca28", emoji: "🤔" },
  hard:       { color: "#ff7043", bg: "rgba(255,112,67,0.1)",  border: "#ff7043", emoji: "💪" },
  "very hard":{ color: "#ef5350", bg: "rgba(239,83,80,0.1)",   border: "#ef5350", emoji: "🧗" },
};

const DifficultyBanner = ({ difficulty, loading }) => {
  if (loading) {
    return (
      <div className="difficulty-banner" style={{ gap: 10 }}>
        <span className="spinner" style={{ borderTopColor: "var(--accent2)" }} />
        <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>
          🔍 Checking how tricky this text is…
        </span>
      </div>
    );
  }

  if (!difficulty) return null;

  const cfg = COLORS[difficulty.difficultyLabel] ?? COLORS.moderate;

  return (
    <div
      className="difficulty-banner"
      style={{ background: cfg.bg, borderColor: cfg.border, flexWrap: "wrap", gap: 10 }}
    >
      <span style={{ fontSize: "1.5rem" }}>{cfg.emoji}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: "1rem",
          color: cfg.color,
          background: `${cfg.color}20`,
          padding: "4px 14px", borderRadius: "20px",
        }}>
          {difficulty.difficultyLabel?.toUpperCase()}
        </span>
        <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.88rem" }}>
          📚 Grade {difficulty.gradeLevel}
        </span>
        <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.88rem" }}>
          ⏱ ~{difficulty.estimatedReadMinutes} min
        </span>
      </div>

      {difficulty.hardWords?.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)" }}>
            👀 Watch for:
          </span>
          {difficulty.hardWords.map((w, i) => (
            <span key={i} style={{
              fontWeight: 800, fontSize: "0.8rem",
              background: `${cfg.color}20`,
              color: cfg.color,
              padding: "2px 10px", borderRadius: "20px",
              border: `2px solid ${cfg.color}50`,
            }}>
              {w}
            </span>
          ))}
        </div>
      )}

      {difficulty.suggestion && (
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", width: "100%", marginTop: 4 }}>
          💡 {difficulty.suggestion}
        </p>
      )}
    </div>
  );
};

export default DifficultyBanner;
