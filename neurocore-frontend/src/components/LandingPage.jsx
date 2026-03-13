import { useState, useEffect } from "react";
import ContentInput from "./ContentInput";
import JoinClassroom from "./JoinClassroom";

const FEATURES = [
  { icon: "🎯", title: "Focus Mode", desc: "One chunk at a time. Zero distractions.", color: "#ff7043" },
  { icon: "📏", title: "Reading Ruler", desc: "Highlight your position in the text.", color: "#42a5f5" },
  { icon: "🔤", title: "Dyslexia Font", desc: "OpenDyslexic reduces letter confusion.", color: "#ab47bc" },
  { icon: "🔊", title: "Text-to-Speech", desc: "Listen at your own pace.", color: "#66bb6a" },
  { icon: "🤖", title: "AI Simplify", desc: "Rewrites hard chunks instantly.", color: "#ff7043" },
  { icon: "⚡", title: "Real-time Adapt", desc: "Interface changes as you read.", color: "#ffca28" },
  { icon: "🧠", title: "Cognitive Intel", desc: "Drift prediction, load scoring, pacing.", color: "#42a5f5" },
  { icon: "⭐", title: "Your Profile", desc: "Learns your reading style over time.", color: "#f06292" },
];

/* Floating cartoon mascot — pure SVG, no external assets */
const BrainMascot = ({ mood = "happy" }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "float 3s ease-in-out infinite", display: "block" }}>
    {/* Body */}
    <ellipse cx="60" cy="72" rx="32" ry="28" fill="#ff7043" />
    {/* Brain top */}
    <path d="M28 55 C28 30 92 30 92 55 C92 68 78 78 60 78 C42 78 28 68 28 55Z" fill="#ff8a65" />
    {/* Brain wrinkles */}
    <path d="M38 45 C42 38 50 36 56 42" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M64 42 C70 36 78 38 82 45" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M34 58 C38 52 46 50 52 56" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M68 56 C74 50 82 52 86 58" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* Dividing line */}
    <path d="M60 40 C60 40 58 55 60 78" stroke="#ff7043" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Eyes */}
    <ellipse cx="46" cy="60" rx="7" ry="7" fill="white" />
    <ellipse cx="74" cy="60" rx="7" ry="7" fill="white" />
    <ellipse cx="47" cy="60" rx="4" ry="4"
      fill="#3d2c1e"
      style={{ animation: "character-blink 3s ease-in-out infinite" }} />
    <ellipse cx="75" cy="60" rx="4" ry="4"
      fill="#3d2c1e"
      style={{ animation: "character-blink 3s ease-in-out infinite" }} />
    {/* Eye shine */}
    <circle cx="49" cy="58" r="1.5" fill="white" />
    <circle cx="77" cy="58" r="1.5" fill="white" />
    {/* Mouth */}
    {mood === "happy" ? (
      <path d="M48 72 Q60 82 72 72" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    ) : (
      <line x1="50" y1="76" x2="70" y2="76" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    )}
    {/* Tiny hands */}
    <circle cx="24" cy="68" r="8" fill="#ff8a65" />
    <circle cx="96" cy="68" r="8" fill="#ff8a65" />
    {/* Stars */}
    <text x="10" y="30" fontSize="16" style={{ animation: "twinkle 2s infinite" }}>✨</text>
    <text x="90" y="25" fontSize="12" style={{ animation: "twinkle 2.5s infinite 0.5s" }}>⭐</text>
  </svg>
);

/* Animated book character */
const BookChar = () => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "hop 2s ease-in-out infinite 1s", display: "block" }}>
    {/* Book body */}
    <rect x="12" y="20" width="66" height="52" rx="8" fill="#42a5f5"/>
    <rect x="12" y="20" width="33" height="52" rx="8" fill="#1e88e5"/>
    {/* Spine */}
    <rect x="42" y="20" width="6" height="52" fill="#1565c0"/>
    {/* Lines on pages */}
    <line x1="20" y1="34" x2="38" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="42" x2="38" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="50" x2="34" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="52" y1="34" x2="70" y2="34" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="52" y1="42" x2="70" y2="42" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="52" y1="50" x2="64" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
    {/* Eyes */}
    <circle cx="28" cy="64" r="5" fill="white"/>
    <circle cx="62" cy="64" r="5" fill="white"/>
    <circle cx="29" cy="64" r="2.5" fill="#1e88e5"/>
    <circle cx="63" cy="64" r="2.5" fill="#1e88e5"/>
    {/* Smile */}
    <path d="M32 74 Q45 82 58 74" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Feet */}
    <ellipse cx="28" cy="74" rx="10" ry="6" fill="#1e88e5"/>
    <ellipse cx="62" cy="74" rx="10" ry="6" fill="#1e88e5"/>
  </svg>
);

/* Star burst effect on hover */
const StarBurst = ({ show }) =>
  show ? (
    <span style={{
      position: "absolute", top: 0, right: 0,
      fontSize: "1.5rem", pointerEvents: "none",
      animation: "star-burst 0.6s ease forwards"
    }}>⭐</span>
  ) : null;

const LandingPage = ({
  onContentTransformed, userId, chunkSize, profile,
  recommendedSettings, classroomCode, onJoinedClassroom, onTeacherClick,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [animLoad, setAnimLoad] = useState(false);

  useEffect(() => { setAnimLoad(true); }, []);

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="lp-hero" style={{ position: "relative" }}>
        <div className="lp-hero-text">
          <div className="lp-eyebrow">🌟 NEUROCORE — ADAPTIVE READING ENGINE</div>
          <h1 className="lp-title">
            Reading that adapts<br />
            to <em>your</em> brain.
          </h1>
          <p className="lp-desc">
            Built for amazing students with ADHD, Dyslexia, and unique learning styles.
            NeuroCore tracks how you read and reshapes everything in real time — 
            making reading fun and easy just for you! 🎉
          </p>
          <div className="lp-cta-row">
            <button
              className="lp-cta-primary"
              onClick={() => { setShowInput(true); }}
            >
              🚀 Start Reading Free
            </button>
            <button className="lp-cta-secondary" onClick={onTeacherClick}>
              🏫 Teacher Portal
            </button>
          </div>
        </div>

        {/* Hero characters */}
        <div className="lp-hero-visual">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              <BrainMascot mood="happy" />
              <BookChar />
            </div>
            {/* Demo reading card */}
            <div className="lp-visual-card" style={{ width: "100%", marginTop: 4 }}>
              <div className="lp-visual-chunk lp-visual-active">
                🌟 Your brain is amazing and unique!
              </div>
              <div className="lp-visual-chunk lp-visual-dim">
                NeuroCore helps you read at your own pace.
              </div>
              <div className="lp-visual-chunk lp-visual-dimmer">
                You've got this! 💪
              </div>
              <div className="lp-visual-bar">
                <span className="lp-visual-bar-label">FOCUS</span>
                <div className="lp-visual-bar-track">
                  <div className="lp-visual-bar-fill" style={{ width: "72%" }} />
                </div>
                <span style={{ color: "#66bb6a", fontSize: "0.75rem", fontWeight: 800 }}>72%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Input section */}
      {showInput && (
        <section className="lp-input-section">
          {profile?.totalSessions > 0 && recommendedSettings && (
            <div className="returning-user">
              <span className="returning-label">👋 WELCOME BACK!</span>
              <p>Your settings from {profile.totalSessions} session{profile.totalSessions > 1 ? "s" : ""} are ready!</p>
            </div>
          )}
          <ContentInput
            onContentTransformed={onContentTransformed}
            userId={userId}
            chunkSize={chunkSize}
          />
          {!classroomCode && userId && (
            <JoinClassroom userId={userId} onJoined={onJoinedClassroom} />
          )}
          {classroomCode && (
            <div className="classroom-badge">
              <span className="input-label">🏫 CLASSROOM</span>
              <span>{classroomCode}</span>
            </div>
          )}
        </section>
      )}

      {/* Features */}
      <section className="lp-features">
        <div className="lp-section-label">SUPERPOWERS INSIDE</div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="lp-feature-card"
              style={{ position: "relative", borderColor: hoverIdx === i ? f.color : undefined }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <StarBurst show={hoverIdx === i} />
              <span className="lp-feature-icon" style={{ borderColor: f.color, background: `${f.color}15` }}>
                {f.icon}
              </span>
              <div>
                <div className="lp-feature-title" style={{ color: hoverIdx === i ? f.color : undefined }}>
                  {f.title}
                </div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="lp-stats">
        <div className="lp-stat-item">
          <span className="lp-stat-number">10</span>
          <span className="lp-stat-label">🎯 Learning Phases</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-number">6</span>
          <span className="lp-stat-label">📊 Brain Signals Tracked</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-number">∞</span>
          <span className="lp-stat-label">✨ Adapts Per Session</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="logo" style={{ justifyContent: "center", marginBottom: 8 }}>
          <span className="logo-mark">N</span>
          <span className="logo-text">EUROCORE</span>
        </div>
        <p className="lp-footer-text">
          🧠 Built for neurodiverse superstars. Powered by cognitive science + AI. 🌈
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
