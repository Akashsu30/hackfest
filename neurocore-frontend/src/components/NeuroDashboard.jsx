import { useState } from "react";

const EMOJIS = { overview: "📊", insights: "💡", history: "📅" };
const RHYTHM_CONFIG = {
  fast:   { emoji: "🚀", color: "#66bb6a" },
  slow:   { emoji: "🐢", color: "#ff7043" },
  steady: { emoji: "⚡", color: "#ffca28" },
};

const NeuroDashboard = ({ profile, onClose }) => {
  const [tab, setTab] = useState("overview");

  if (!profile) return null;
  const p = profile.baselineProfile;

  const scores = [
    { label: "Reading Speed",    value: p.avgReadingSpeed,              max: 15, unit: "s/chunk", invert: false, emoji: "⚡" },
    { label: "Fatigue Level",    value: p.fatigueSensitivityScore,      max: 5,  unit: "",        invert: true,  emoji: "😴" },
    { label: "Distraction",      value: p.distractionSensitivityScore,  max: 5,  unit: "",        invert: true,  emoji: "🎯" },
    { label: "Re-reads",         value: p.avgRereadDensity,             max: 3,  unit: "×/chunk", invert: true,  emoji: "🔄" },
  ];

  const getBarWidth = (value, max) => `${Math.min((value / max) * 100, 100)}%`;
  const getBarColor = (value, max, invert) => {
    const pct = value / max;
    if (!invert) return pct < 0.4 ? "#66bb6a" : pct < 0.7 ? "#ffca28" : "#ff7043";
    return pct < 0.3 ? "#66bb6a" : pct < 0.6 ? "#ffca28" : "#ff7043";
  };

  const insights = [];
  if (p.fatigueSensitivityScore > 1.5) insights.push({ emoji: "😴", text: "You fatigue faster than average — take breaks every 15-20 minutes! You're doing great." });
  if (p.distractionSensitivityScore > 0.3) insights.push({ emoji: "🎯", text: "You're easily distracted — Focus Mode is your best friend! Try it out." });
  if (p.avgRereadDensity > 0.5) insights.push({ emoji: "🧩", text: "You re-read a lot — try smaller chunk sizes for better understanding." });
  if (p.avgReadingSpeed > 7) insights.push({ emoji: "↕", text: "You read slowly — increase line spacing for more breathing room." });
  if (p.audioPreference) insights.push({ emoji: "🔊", text: "You learn better with audio — enable Text-to-Speech for long sessions!" });
  if (p.dominantRhythm === "fast") insights.push({ emoji: "🚀", text: "You're a fast reader — larger chunks may improve your flow." });
  if (insights.length === 0) insights.push({ emoji: "🌟", text: "Your reading patterns are beautifully balanced. Keep it up, superstar!" });

  const rhythm = RHYTHM_CONFIG[p.dominantRhythm] ?? RHYTHM_CONFIG.steady;

  return (
    <div className="profile-overlay">
      <div className="neuro-dashboard">
        <div className="profile-header">
          <div>
            <span className="profile-label">🧠 YOUR READING DNA</span>
            <h2 className="profile-title">Neuro-Learning Dashboard</h2>
          </div>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="neuro-tabs">
          {["overview", "insights", "history"].map((t) => (
            <button
              key={t}
              className={`neuro-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="neuro-tab-content">
            <div className="neuro-rhythm-row">
              <div className="neuro-rhythm-card">
                <span className="profile-label">READING STYLE</span>
                <span className="rhythm-badge" style={{ color: rhythm.color }}>
                  {rhythm.emoji} {p.dominantRhythm?.toUpperCase() ?? "STEADY"}
                </span>
              </div>
              <div className="neuro-rhythm-card">
                <span className="profile-label">📚 SESSIONS</span>
                <span className="rhythm-badge" style={{ color: "#42a5f5" }}>
                  {profile.totalSessions} done!
                </span>
              </div>
              <div className="neuro-rhythm-card">
                <span className="profile-label">🔊 AUDIO PREF</span>
                <span className="rhythm-badge" style={{ color: p.audioPreference ? "#66bb6a" : "#9e7a5a" }}>
                  {p.audioPreference ? "YES ✓" : "NOT YET"}
                </span>
              </div>
            </div>

            <div className="neuro-scores">
              <span className="profile-label">📊 BRAIN METRICS</span>
              {scores.map((s, i) => {
                const color = getBarColor(s.value ?? 0, s.max, s.invert);
                return (
                  <div key={i} className="neuro-score-row">
                    <span className="neuro-score-label">
                      {s.emoji} {s.label}
                    </span>
                    <div className="neuro-score-track">
                      <div
                        className="neuro-score-fill"
                        style={{ width: getBarWidth(s.value ?? 0, s.max), background: color }}
                      />
                    </div>
                    <span className="neuro-score-val" style={{ color }}>
                      {s.value?.toFixed(2) ?? "—"} {s.unit}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="neuro-prefs">
              <span className="profile-label">🎨 PREFERENCES LEARNED</span>
              <div className="neuro-pref-grid">
                <PrefCard emoji="🧩" label="Chunk Size" value={`${p.preferredChunkSize ?? 2} sentences`} />
                <PrefCard emoji="⏱" label="Focus Duration" value={`${p.avgFocusDuration?.toFixed(0) ?? "—"}s`} />
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {tab === "insights" && (
          <div className="neuro-tab-content">
            <span className="profile-label">🤖 AI INSIGHTS FROM YOUR READING</span>
            <div className="neuro-insights">
              {insights.map((insight, i) => (
                <div key={i} className="neuro-insight">
                  <span className="neuro-insight-icon">{insight.emoji}</span>
                  <p>{insight.text}</p>
                </div>
              ))}
            </div>
            {profile.totalSessions < 3 && (
              <p className="neuro-insight-note">
                🌱 Complete more sessions for deeper insights! Currently based on {profile.totalSessions} session{profile.totalSessions !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="neuro-tab-content">
            <span className="profile-label">📅 SESSION HISTORY</span>
            <p className="neuro-history-note">
              You have completed <b style={{ color: "#ff7043", fontFamily: "var(--font-display)", fontSize: "1.1em" }}>
                {profile.totalSessions}
              </b> reading session{profile.totalSessions !== 1 ? "s" : ""}! 🎉
              <br /><br />
              Your profile updates automatically after each session — getting smarter about what works best for your brain every time!
            </p>
            <div className="neuro-profile-evolution">
              <span className="profile-label">🌱 YOUR PROGRESS</span>
              <div className="evolution-note">
                {profile.totalSessions === 0 && "🌱 Start your first session to begin your reading journey!"}
                {profile.totalSessions === 1 && "🌿 Great start! Your baseline profile is established!"}
                {profile.totalSessions >= 2 && profile.totalSessions < 5 && "🌳 Growing nicely! A few more sessions will make your profile more accurate."}
                {profile.totalSessions >= 5 && profile.totalSessions < 10 && "🌟 Solid data! Your profile is becoming really reliable."}
                {profile.totalSessions >= 10 && "🏆 AMAZING! NeuroCore knows your reading patterns really well. You're a superstar!"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PrefCard = ({ emoji, label, value }) => (
  <div className="neuro-pref-card">
    <span className="stat-label">{emoji} {label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

export default NeuroDashboard;
