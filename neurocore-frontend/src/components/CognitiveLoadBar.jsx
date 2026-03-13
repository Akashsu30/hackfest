const getLoadConfig = (score) => {
  if (score < 30) return { color: "#66bb6a", emoji: "😊", label: "Easy going!" };
  if (score < 60) return { color: "#ffca28", emoji: "🤔", label: "Thinking hard" };
  if (score < 80) return { color: "#ff7043", emoji: "😤", label: "Working it!" };
  return { color: "#ef5350", emoji: "🥵", label: "Very tough!" };
};

const CognitiveLoadBar = ({ chunkLoads, focusIndex }) => {
  if (!chunkLoads?.length) return null;

  const current = chunkLoads.find((c) => c.chunkIndex === focusIndex);
  if (!current) return null;

  const { color, emoji, label } = getLoadConfig(current.loadScore);

  return (
    <div className="cognitive-load-bar">
      <span style={{ fontSize: "1.4rem" }}>{emoji}</span>
      <span className="cog-label">🧠 BRAIN EFFORT</span>
      <div className="cog-track">
        <div
          className="cog-fill"
          style={{ width: `${current.loadScore}%`, background: color }}
        />
      </div>
      <span className="cog-val" style={{ color }}>{label}</span>
      {current.reason && (
        <span style={{
          fontSize: "0.72rem", fontWeight: 700,
          color: "var(--text-muted)",
          background: "var(--surface2)",
          borderRadius: "20px",
          padding: "2px 10px",
          marginLeft: 4,
        }}>
          {current.reason}
        </span>
      )}
    </div>
  );
};

export default CognitiveLoadBar;
