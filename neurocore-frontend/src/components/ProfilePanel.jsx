const ProfilePanel = ({ profile, onClose }) => {
  if (!profile) return null;

  const p = profile.baselineProfile;

  const rhythmConfig = {
    fast:   { color: "#66bb6a", emoji: "🚀", label: "FAST READER" },
    slow:   { color: "#ff7043", emoji: "🐢", label: "STEADY READER" },
    steady: { color: "#ffca28", emoji: "⚡", label: "BALANCED READER" },
  };
  const rhythm = rhythmConfig[p.dominantRhythm] ?? rhythmConfig.steady;

  const stats = [
    { label: "📚 Sessions Done",    value: profile.totalSessions ?? 0, unit: "" },
    { label: "⏱ Avg Chunk Time",   value: p.avgReadingSpeed?.toFixed(1) ?? "—", unit: "s" },
    { label: "😴 Fatigue Level",    value: p.fatigueSensitivityScore?.toFixed(2) ?? "—", unit: "" },
    { label: "🎯 Focus Score",      value: p.distractionSensitivityScore?.toFixed(2) ?? "—", unit: "" },
    { label: "🔄 Avg Re-reads",     value: p.avgRereadDensity?.toFixed(2) ?? "—", unit: "" },
    { label: "🧩 Best Chunk Size",  value: p.preferredChunkSize ?? 2, unit: " sentences" },
  ];

  return (
    <div className="profile-overlay">
      <div style={{
        background: "var(--surface)",
        border: "4px solid var(--border)",
        borderRadius: 32, padding: "36px",
        maxWidth: 480, width: "92%",
        boxShadow: "var(--shadow-pop)",
        animation: "slide-up 0.35s ease",
        maxHeight: "82vh", overflowY: "auto",
      }}>
        <div className="profile-header">
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em", color: "var(--accent)" }}>
              🧠 YOUR READING PROFILE
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "var(--text)" }}>
              Your Brain DNA ✨
            </h2>
          </div>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        {/* Rhythm badge */}
        <div style={{
          background: `${rhythm.color}15`,
          border: `3px solid ${rhythm.color}`,
          borderRadius: 20, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 20,
        }}>
          <span style={{ fontSize: "2.5rem" }}>{rhythm.emoji}</span>
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.15em", color: rhythm.color }}>
              YOUR STYLE
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--text)" }}>
              {rhythm.label}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12, marginBottom: 20,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: "var(--surface2)",
              border: "2px solid var(--border)",
              borderRadius: 14, padding: "14px",
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--text)" }}>
                {s.value}{s.unit}
              </div>
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div style={{
          background: "var(--surface2)", border: "2px solid var(--border)",
          borderRadius: 14, padding: "14px 18px",
        }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 8 }}>
            🎨 LEARNED PREFERENCES
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{
              fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)",
              background: "var(--surface)", borderRadius: 20,
              padding: "4px 14px", border: "2px solid var(--border)",
            }}>
              🔊 Audio: {p.audioPreference ? "Yes ✓" : "No"}
            </span>
            <span style={{
              fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)",
              background: "var(--surface)", borderRadius: 20,
              padding: "4px 14px", border: "2px solid var(--border)",
            }}>
              ⚡ Rhythm: {p.dominantRhythm ?? "steady"}
            </span>
          </div>
        </div>

        {profile.totalSessions === 0 && (
          <p style={{
            textAlign: "center", fontSize: "0.9rem", fontWeight: 600,
            color: "var(--text-muted)", marginTop: 16,
            padding: "12px", background: "var(--surface2)",
            borderRadius: 12, border: "2px dashed var(--border)",
          }}>
            🌱 Complete your first reading session to start building your profile!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
