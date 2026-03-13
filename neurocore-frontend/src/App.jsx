import { useState, useEffect, useCallback, useMemo } from "react";
import LandingPage from "./components/LandingPage";
import ReaderControls from "./components/ReaderControls";
import ChunkView from "./components/ChunkView";
import TTSControls from "./components/TTSControls";
import WordPopup from "./components/WordPopup";
import NeuroDashboard from "./components/NeuroDashboard";
import RealtimeAlert from "./components/RealtimeAlert";
import TeacherAuth from "./components/TeacherAuth";
import TeacherDashboard from "./components/TeacherDashboard";
import DifficultyBanner from "./components/DifficultyBanner";
import CognitiveLoadBar from "./components/CognitiveLoadBar";
import IntelligencePanel from "./components/IntelligencePanel";
import OnboardingFlow from "./components/OnboardingFlow";
import useInteractionTracker from "./hooks/useInteractionTracker";
import useTTS from "./hooks/useTTS";
import useWordDefinition from "./hooks/useWordDefinition";
import useUserProfile from "./hooks/useUserProfile";
import useRealtimeAdaptation from "./hooks/useRealtimeAdaptation";
import useTeacherAuth from "./hooks/useTeacherAuth";
import useCognitiveIntelligence from "./hooks/useCognitiveIntelligence";

const API = "http://localhost:5000";

/* Floating decorative stars shown while reading */
const FloatingStars = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {["⭐","✨","🌟","💫","⭐","✨"].map((s, i) => (
      <span key={i} style={{
        position: "absolute",
        left: `${10 + i * 16}%`,
        top: `${5 + (i % 3) * 30}%`,
        fontSize: `${0.8 + (i % 3) * 0.4}rem`,
        opacity: 0.12,
        animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
        animationDelay: `${i * 0.4}s`,
      }}>{s}</span>
    ))}
  </div>
);

function App() {
  const [content, setContent] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineSpacing, setLineSpacing] = useState(1.7);
  const [focusMode, setFocusMode] = useState(false);
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);
  const [chunkSize, setChunkSize] = useState(2);
  const [focusIndex, setFocusIndex] = useState(0);
  const [adaptation, setAdaptation] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [appMode, setAppMode] = useState("student");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [classroomCode, setClassroomCode] = useState(
    () => localStorage.getItem("neurocore_classroom_code") ?? null
  );

  const { userId, profile, recommendedSettings, loading, refreshProfile } = useUserProfile();
  const { teacher, loading: teacherLoading, login, register, logout, authFetch } = useTeacherAuth();

  const {
    alert: realtimeAlert, breakDue,
    processSignal, dismissAlert, dismissBreak,
  } = useRealtimeAdaptation({ setFocusMode, setLineSpacing, setChunkSize });

  const {
    difficulty, chunkLoads, driftPrediction, pacingSuggestion,
    loadingDifficulty, analyzeText, fetchDriftPrediction,
    fetchPacingSuggestion, reset: resetIntelligence,
  } = useCognitiveIntelligence();

  const sessionId = content?.sessionId;
  const { trackChunk, flushAll } = useInteractionTracker(sessionId, processSignal);
  const { speak, stop, speaking, rate, setRate } = useTTS();
  const { definition, lookup, clear } = useWordDefinition();

  useEffect(() => {
    const seen = localStorage.getItem("neurocore_onboarding_done");
    if (!seen) setShowOnboarding(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("neurocore_onboarding_done", "1");
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (teacher) setAppMode("teacher-dashboard");
  }, [teacher]);

  useEffect(() => {
    if (recommendedSettings) {
      setChunkSize(recommendedSettings.chunkSize);
      setLineSpacing(recommendedSettings.lineSpacing);
      setFocusMode(recommendedSettings.focusMode);
      setFontSize(recommendedSettings.fontSize);
    }
  }, [recommendedSettings]);

  const chunks = useMemo(() => {
    if (!content?.sentences) return content?.chunkMode ?? [];
    const out = [];
    for (let i = 0; i < content.sentences.length; i += chunkSize) {
      out.push(content.sentences.slice(i, i + chunkSize).join(" "));
    }
    return out;
  }, [content, chunkSize]);

  const currentChunkText = chunks[focusIndex] ?? "";

  useEffect(() => {
    if (!content) return;
    setFocusIndex(0);
    setAdaptation(null);
    setSessionEnded(false);
    if (chunks.length > 0) trackChunk(0);
    analyzeText(content.simplified ?? "", chunks);
  }, [content]);

  useEffect(() => {
    if (!sessionId) return;
    const poll = setInterval(async () => {
      await Promise.all([
        fetch(`${API}/api/adaptation/${sessionId}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => d && setAdaptation(d.adaptation))
          .catch(() => {}),
        fetchDriftPrediction(sessionId),
        fetchPacingSuggestion(sessionId, profile?.baselineProfile),
      ]);
    }, 30000);
    return () => clearInterval(poll);
  }, [sessionId, profile, fetchDriftPrediction, fetchPacingSuggestion]);

  useEffect(() => {
    if (!sessionId) return;
    const endSession = async () => {
      if (sessionEnded) return;
      await flushAll();
      try {
        await fetch(`${API}/api/sessions/end/${sessionId}`, { method: "PATCH" });
        await refreshProfile();
      } catch (_) {}
      setSessionEnded(true);
    };
    window.addEventListener("beforeunload", endSession);
    return () => {
      window.removeEventListener("beforeunload", endSession);
      endSession();
    };
  }, [sessionId, flushAll, sessionEnded, refreshProfile]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!content) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = Math.min(prev + 1, chunks.length - 1);
          trackChunk(next);
          return next;
        });
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          trackChunk(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [content, chunks, trackChunk]);

  const handleReset = useCallback(async () => {
    stop();
    await flushAll();
    if (sessionId && !sessionEnded) {
      try {
        await fetch(`${API}/api/sessions/end/${sessionId}`, { method: "PATCH" });
        await refreshProfile();
      } catch (_) {}
    }
    setContent(null);
    setAdaptation(null);
    setSessionEnded(false);
    setFocusIndex(0);
    resetIntelligence();
  }, [flushAll, sessionId, sessionEnded, stop, refreshProfile, resetIntelligence]);

  const handleApplyPacing = useCallback(() => {
    if (!pacingSuggestion) return;
    if (pacingSuggestion.chunkSizeAdjustment !== 0)
      setChunkSize((c) => Math.min(Math.max(c + pacingSuggestion.chunkSizeAdjustment, 1), 5));
    if (pacingSuggestion.spacingAdjustment !== 0)
      setLineSpacing((s) => Math.min(Math.max(+(s + pacingSuggestion.spacingAdjustment).toFixed(1), 1.0), 3.0));
  }, [pacingSuggestion]);

  const handleLogout = useCallback(() => {
    logout();
    setAppMode("student");
  }, [logout]);

  /* Loading state */
  if (loading || teacherLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 20,
        background: "var(--bg)",
      }}>
        <div style={{ fontSize: "4rem", animation: "float 2s ease-in-out infinite" }}>🧠</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--accent)" }}>
          Loading NeuroCore…
        </div>
        <div style={{
          width: 80, height: 8,
          background: "var(--border)", borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: "60%",
            background: "linear-gradient(90deg, var(--accent), var(--accent2))",
            borderRadius: 4,
            animation: "spin 1s linear infinite",
          }} />
        </div>
      </div>
    );
  }

  /* Teacher auth */
  if (appMode === "teacher-auth") {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-mark">🧠</span>
              <span className="logo-text">NEUROCORE</span>
            </div>
            <button className="reset-btn" onClick={() => setAppMode("student")}>
              ← Back to Student View
            </button>
          </div>
        </header>
        <main className="app-main">
          <TeacherAuth onLogin={login} onRegister={register} />
        </main>
      </div>
    );
  }

  /* Teacher dashboard */
  if (appMode === "teacher-dashboard" && teacher) {
    return <TeacherDashboard teacher={teacher} authFetch={authFetch} onLogout={handleLogout} />;
  }

  /* Student app */
  return (
    <div className="app">
      <FloatingStars />

      {showOnboarding && <OnboardingFlow onComplete={completeOnboarding} />}

      {/* Header — shown in reader mode */}
      {content && (
        <header className="app-header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-mark">🧠</span>
              <span className="logo-text">NEUROCORE</span>
            </div>
            <span className="logo-sub">
              {focusIndex + 1} / {chunks.length} chunks
            </span>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setAppMode("teacher-auth")}
                style={{
                  background: "var(--surface2)", border: "2px solid var(--border)",
                  borderRadius: "30px", color: "var(--text-muted)",
                  fontFamily: "var(--font-body)", fontWeight: 700,
                  fontSize: "0.82rem", padding: "6px 14px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🏫 Teacher
              </button>
              <button
                onClick={() => setShowDashboard(true)}
                style={{
                  background: "rgba(255,112,67,0.1)", border: "2px solid var(--accent)",
                  borderRadius: "30px", color: "var(--accent)",
                  fontFamily: "var(--font-display)", fontSize: "0.9rem",
                  padding: "6px 16px", cursor: "pointer",
                  transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                🧠 My Profile
                {profile?.totalSessions > 0 && (
                  <span style={{
                    background: "var(--accent)", color: "white",
                    borderRadius: "50%", width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800,
                  }}>
                    {profile.totalSessions}
                  </span>
                )}
              </button>
              <button className="reset-btn" onClick={handleReset}>
                📖 New Text
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Realtime alert bar */}
      {content && (
        <div style={{ padding: realtimeAlert || breakDue ? "0 36px 12px" : 0, position: "relative", zIndex: 5 }}>
          <RealtimeAlert
            alert={realtimeAlert}
            breakDue={breakDue}
            onDismiss={dismissAlert}
            onDismissBreak={dismissBreak}
          />
        </div>
      )}

      {/* Main content */}
      <main className={content ? "app-main" : ""} style={{ position: "relative", zIndex: 1 }}>
        {!content ? (
          <LandingPage
            onContentTransformed={setContent}
            userId={userId}
            chunkSize={chunkSize}
            profile={profile}
            recommendedSettings={recommendedSettings}
            classroomCode={classroomCode}
            onJoinedClassroom={(code) => setClassroomCode(code)}
            onTeacherClick={() => setAppMode("teacher-auth")}
          />
        ) : (
          <div className="reader-layout">
            <DifficultyBanner difficulty={difficulty} loading={loadingDifficulty} />

            <ReaderControls
              fontSize={fontSize} setFontSize={setFontSize}
              lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
              focusMode={focusMode} setFocusMode={setFocusMode}
              dyslexiaMode={dyslexiaMode} setDyslexiaMode={setDyslexiaMode}
              rulerMode={rulerMode} setRulerMode={setRulerMode}
              chunkSize={chunkSize} setChunkSize={setChunkSize}
              adaptation={adaptation}
            />

            <div className="reader-canvas">
              <TTSControls
                speak={speak} stop={stop} speaking={speaking}
                rate={rate} setRate={setRate}
                currentChunkText={currentChunkText}
              />
              <div style={{ marginTop: 12 }}>
                <CognitiveLoadBar chunkLoads={chunkLoads} focusIndex={focusIndex} />
              </div>
              {(focusMode || rulerMode) && (
                <div className="nav-hint">
                  Use ↑ ↓ arrow keys or click a chunk to move · Reading chunk {focusIndex + 1} of {chunks.length}
                </div>
              )}
              <ChunkView
                chunks={chunks}
                focusIndex={focusIndex}
                setFocusIndex={setFocusIndex}
                trackChunk={trackChunk}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                dyslexiaMode={dyslexiaMode}
                focusMode={focusMode}
                rulerMode={rulerMode}
                onWordClick={lookup}
                sentences={content.sentences}
                chunkSize={chunkSize}
              />
            </div>

            <IntelligencePanel
              driftPrediction={driftPrediction}
              pacingSuggestion={pacingSuggestion}
              onApplyPacing={handleApplyPacing}
            />

            {adaptation && (
              <div className="metrics-footer">
                <span className="metrics-label">📊 SESSION INSIGHTS</span>
                <div className="metrics-row">
                  <MetricBadge emoji="🎵" label="Rhythm" value={adaptation._metrics?.rhythmPattern ?? "—"} />
                  <MetricBadge emoji="🔄" label="Re-reads" value={(adaptation._metrics?.rereadDensity ?? 0).toFixed(2)} />
                  <MetricBadge emoji="🎯" label="Focus" value={(adaptation._metrics?.distractionIndex ?? 0).toFixed(2)} />
                  <MetricBadge emoji="😴" label="Fatigue" value={(adaptation._metrics?.fatigueIndex ?? 0).toFixed(2)} />
                </div>
              </div>
            )}

            {/* Completion message when on last chunk */}
            {focusIndex === chunks.length - 1 && chunks.length > 1 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(102,187,106,0.1), rgba(66,165,245,0.08))",
                border: "3px solid #66bb6a",
                borderRadius: 20, padding: "20px 24px",
                textAlign: "center",
                animation: "bounce-in 0.4s ease",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#66bb6a", marginBottom: 4 }}>
                  You reached the end!
                </div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  Amazing work! You finished all {chunks.length} chunks. Your reading superstar badge is on the way! ⭐
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <WordPopup definition={definition} onClose={clear} />
      {showDashboard && <NeuroDashboard profile={profile} onClose={() => setShowDashboard(false)} />}
    </div>
  );
}

const MetricBadge = ({ emoji, label, value }) => (
  <div className="metric-badge">
    <span className="metric-label">{emoji} {label}</span>
    <span className="metric-value">{value}</span>
  </div>
);

export default App;
