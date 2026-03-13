import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import FocusTimerController from "./components/FocusTimer";
import EyeTrackingConsent from "./components/EyeTrackingConsent";
import useInteractionTracker from "./hooks/useInteractionTracker";
import useTTS from "./hooks/useTTS";
import useWordDefinition from "./hooks/useWordDefinition";
import useUserProfile from "./hooks/useUserProfile";
import useRealtimeAdaptation from "./hooks/useRealtimeAdaptation";
import useTeacherAuth from "./hooks/useTeacherAuth";
import useCognitiveIntelligence from "./hooks/useCognitiveIntelligence";
import useEyeTracking from "./hooks/useEyeTracking";

const API = "http://localhost:5000";

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

  const chunkRefs      = useRef([]);
  const activeChunkRef = useRef(null);

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

  const {
    consentState, gazeReady, gazePoint, gazeStuckSecs,
    idleDetected, calibrating,
    grantConsent, skipEyeTracking, calibrationDone,
  } = useEyeTracking({
    focusIndex,
    chunkRefs,
    onGazeStuck: (secs) => {
      window.dispatchEvent(
        new CustomEvent("neurocore:gaze-stuck", { detail: { secs } })
      );
    },
  });

  const handleFocusTimerSimplify = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("neurocore:simplify-chunk", { detail: { index: focusIndex } })
    );
  }, [focusIndex]);

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

  useEffect(() => {
    chunkRefs.current = chunks.map(
      (_, i) => chunkRefs.current[i] ?? { current: null }
    );
  }, [chunks]);

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

  if (loading || teacherLoading) {
    return <div className="app-loading"><span className="loading-dot" /></div>;
  }

  if (appMode === "teacher-auth") {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-mark">N</span>
              <span className="logo-text">EUROCORE</span>
            </div>
            <button className="reset-btn" onClick={() => setAppMode("student")}>← Student View</button>
          </div>
          <div className="header-line" />
        </header>
        <main className="app-main">
          <TeacherAuth onLogin={login} onRegister={register} />
        </main>
      </div>
    );
  }

  if (appMode === "teacher-dashboard" && teacher) {
    return (
      <TeacherDashboard teacher={teacher} authFetch={authFetch} onLogout={handleLogout} />
    );
  }

  return (
    <div className="app">
      {showOnboarding && <OnboardingFlow onComplete={completeOnboarding} />}

      {content && (
        <EyeTrackingConsent
          consentState={consentState}
          calibrating={calibrating}
          gazePoint={gazePoint}
          gazeReady={gazeReady}
          gazeStuckSecs={gazeStuckSecs}
          idleDetected={idleDetected}
          onGrant={grantConsent}
          onSkip={skipEyeTracking}
          onCalibrationDone={calibrationDone}
        />
      )}

      {content && (
        <header className="app-header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-mark">N</span>
              <span className="logo-text">EUROCORE</span>
            </div>
            <p className="logo-sub">Adaptive Reading Engine</p>
            <div className="header-actions">
              <button className="profile-btn" onClick={() => setShowDashboard(true)}>
                ◉ Profile
                {profile?.totalSessions > 0 && (
                  <span className="session-count">{profile.totalSessions}</span>
                )}
              </button>
              <button className="reset-btn" onClick={handleReset}>← New text</button>
            </div>
          </div>
          <div className="header-line" />
        </header>
      )}

      {content && (
        <RealtimeAlert
          alert={realtimeAlert}
          breakDue={breakDue}
          onDismiss={dismissAlert}
          onDismissBreak={dismissBreak}
        />
      )}

      <main className={content ? "app-main" : ""}>
        {!content ? (
          <LandingPage
            onContentTransformed={setContent}
            userId={userId}
            chunkSize={chunkSize}
            profile={profile}
            recommendedSettings={recommendedSettings}
            classroomCode={classroomCode}
            onJoinedClassroom={(code) => setClassroomCode(code)}
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
              <CognitiveLoadBar chunkLoads={chunkLoads} focusIndex={focusIndex} />

              {(focusMode || rulerMode) && (
                <div className="nav-hint">
                  ↑ ↓ or J / K to navigate · {focusIndex + 1} / {chunks.length}
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
                activeChunkRef={activeChunkRef}
                chunkRefs={chunkRefs}
              />
            </div>

            <IntelligencePanel
              driftPrediction={driftPrediction}
              pacingSuggestion={pacingSuggestion}
              onApplyPacing={handleApplyPacing}
            />

            {adaptation && (
              <div className="metrics-footer">
                <span className="metrics-label">SESSION INSIGHTS</span>
                <div className="metrics-row">
                  <MetricBadge label="Rhythm" value={adaptation._metrics?.rhythmPattern ?? "—"} />
                  <MetricBadge label="Rereads" value={(adaptation._metrics?.rereadDensity ?? 0).toFixed(2)} />
                  <MetricBadge label="Focus" value={(adaptation._metrics?.distractionIndex ?? 0).toFixed(2)} />
                  <MetricBadge label="Fatigue" value={(adaptation._metrics?.fatigueIndex ?? 0).toFixed(2)} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {content && (
        <FocusTimerController
          focusIndex={focusIndex}
          active={!!content}
          onSimplifyCurrentChunk={handleFocusTimerSimplify}
          chunkRef={activeChunkRef}
          gazeStuckSecs={gazeStuckSecs}
          useGaze={consentState === "granted" && gazeReady}
        />
      )}

      <WordPopup definition={definition} onClose={clear} />
      {showDashboard && <NeuroDashboard profile={profile} onClose={() => setShowDashboard(false)} />}
    </div>
  );
}

const MetricBadge = ({ label, value }) => (
  <div className="metric-badge">
    <span className="metric-label">{label}</span>
    <span className="metric-value">{value}</span>
  </div>
);

export default App;
