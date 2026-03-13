const IntelligencePanel = ({ driftPrediction, pacingSuggestion, onApplyPacing }) => {
  if (!driftPrediction && !pacingSuggestion) return null;

  const driftRisk = driftPrediction?.driftRisk ?? 0;
  const driftColor =
    driftRisk < 30 ? "#66bb6a" :
    driftRisk < 60 ? "#ffca28" : "#ff7043";
  const driftEmoji = driftRisk < 30 ? "🎯" : driftRisk < 60 ? "😶" : "😵";

  const paceEmoji = {
    slow: "🐢", steady: "⚡", fast: "🚀",
  }[pacingSuggestion?.recommendedPace] ?? "⚡";

  return (
    <div className="intelligence-panel">
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text)" }}>
        🧠 Your Brain Stats
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 4 }}>
        {/* Drift risk card */}
        {driftPrediction && (
          <div style={{
            background: "var(--surface2)", border: "2px solid var(--border)",
            borderRadius: 16, padding: "14px 18px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.15em" }}>
              🎯 FOCUS RISK
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "2rem" }}>{driftEmoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 10, background: "var(--bg)",
                  borderRadius: 5, overflow: "hidden",
                  border: "2px solid var(--border)",
                }}>
                  <div style={{
                    width: `${driftRisk}%`, height: "100%",
                    background: driftColor, borderRadius: 5,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: driftColor, display: "block", marginTop: 4 }}>
                  {driftRisk}% drift risk
                </span>
              </div>
            </div>
            {driftPrediction.predictedDriftIn && (
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                ⏰ Might drift in ~{driftPrediction.predictedDriftIn} more chunks
              </p>
            )}
            {driftPrediction.recommendation && (
              <p style={{
                fontSize: "0.8rem", fontWeight: 700,
                color: driftColor,
                background: `${driftColor}15`,
                borderRadius: 8, padding: "6px 10px",
              }}>
                💡 {driftPrediction.recommendation}
              </p>
            )}
          </div>
        )}

        {/* Pacing card */}
        {pacingSuggestion && (
          <div style={{
            background: "var(--surface2)", border: "2px solid var(--border)",
            borderRadius: 16, padding: "14px 18px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.15em" }}>
              ⚡ BEST PACE FOR YOU
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "2rem" }}>{paceEmoji}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--text)" }}>
                {pacingSuggestion.recommendedPace?.toUpperCase()} PACE
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pacingSuggestion.chunkSizeAdjustment !== 0 && (
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  background: "rgba(66,165,245,0.12)",
                  color: "#42a5f5", borderRadius: 20, padding: "3px 10px",
                  border: "2px solid rgba(66,165,245,0.3)",
                }}>
                  Chunks {pacingSuggestion.chunkSizeAdjustment > 0 ? "+" : ""}{pacingSuggestion.chunkSizeAdjustment}
                </span>
              )}
              {pacingSuggestion.breakAfterChunks && (
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  background: "rgba(102,187,106,0.12)",
                  color: "#66bb6a", borderRadius: 20, padding: "3px 10px",
                  border: "2px solid rgba(102,187,106,0.3)",
                }}>
                  Break after {pacingSuggestion.breakAfterChunks} chunks
                </span>
              )}
            </div>
            {pacingSuggestion.motivationalNote && (
              <p style={{
                fontSize: "0.85rem", fontWeight: 700, fontStyle: "italic",
                color: "var(--text-muted)",
              }}>
                "{pacingSuggestion.motivationalNote}"
              </p>
            )}
            <button
              onClick={onApplyPacing}
              style={{
                background: "linear-gradient(135deg, var(--accent3), #43a047)",
                border: "none", borderRadius: "30px",
                color: "white", cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: "0.9rem",
                padding: "8px 18px", marginTop: 4,
                boxShadow: "0 4px 12px rgba(102,187,106,0.35)",
              }}
            >
              ✨ Apply this pacing!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligencePanel;
