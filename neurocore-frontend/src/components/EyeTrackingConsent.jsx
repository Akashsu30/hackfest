import { useState, useCallback } from "react";

export const ConsentGate = ({ onGrant, onSkip }) => (
  <div className="etc-backdrop">
    <div className="etc-card">
      <div className="etc-icon-ring"><span className="etc-icon">👁</span></div>
      <h2 className="etc-title">Eye Tracking</h2>
      <p className="etc-body">
        NEUROCORE can use your webcam to detect where you're looking — so the
        Focus Timer triggers only when your <em>gaze</em> is actually stuck,
        not just your mouse.
      </p>
      <ul className="etc-privacy-list">
        <li><span className="etc-check">✓</span>Camera feed <strong>never leaves your device</strong></li>
        <li><span className="etc-check">✓</span>No video is stored or recorded</li>
        <li><span className="etc-check">✓</span>You can disable this any time in settings</li>
      </ul>
      <div className="etc-actions">
        <button className="etc-btn etc-btn-primary" onClick={onGrant}>
          Enable Eye Tracking
        </button>
        <button className="etc-btn etc-btn-ghost" onClick={onSkip}>
          Skip — use mouse detection instead
        </button>
      </div>
    </div>
  </div>
);

const POINTS = [
  { x:  5, y:  5 }, { x: 50, y:  5 }, { x: 95, y:  5 },
  { x:  5, y: 50 }, { x: 50, y: 50 }, { x: 95, y: 50 },
  { x:  5, y: 95 }, { x: 50, y: 95 }, { x: 95, y: 95 },
];
const CLICKS_NEEDED = 3;

export const CalibrationScreen = ({ onDone }) => {
  const [current,   setCurrent]   = useState(0);
  const [clicks,    setClicks]    = useState(0);
  const [completed, setCompleted] = useState([]);
  const [finishing, setFinishing] = useState(false);

  const handlePointClick = useCallback(() => {
    const next = clicks + 1;
    if (next >= CLICKS_NEEDED) {
      const done = [...completed, current];
      setCompleted(done); setClicks(0);
      if (current < POINTS.length - 1) setCurrent((c) => c + 1);
      else { setFinishing(true); setTimeout(onDone, 800); }
    } else {
      setClicks(next);
    }
  }, [clicks, current, completed, onDone]);

  const pt = POINTS[current];
  return (
    <div className="cal-backdrop">
      <div className="cal-instructions">
        <p>Look at each dot and <strong>click it {CLICKS_NEEDED} times</strong>. Keep your head still.</p>
        <span className="cal-progress">{completed.length} / {POINTS.length} points done</span>
      </div>
      {completed.map((i) => (
        <div key={i} className="cal-dot cal-dot-done"
          style={{ left: `${POINTS[i].x}%`, top: `${POINTS[i].y}%` }} />
      ))}
      {!finishing && (
        <div className="cal-dot cal-dot-active"
          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
          onClick={handlePointClick}>
          <span className="cal-dot-ring" />
          <span className="cal-dot-inner" />
          <span className="cal-dot-count">{CLICKS_NEEDED - clicks}</span>
        </div>
      )}
      {finishing && <div className="cal-finish">✓ Calibration complete</div>}
    </div>
  );
};

export const GazeDot = ({ gazePoint }) => {
  if (!gazePoint) return null;
  return (
    <div className="gaze-dot"
      style={{ transform: `translate(${gazePoint.x - 10}px, ${gazePoint.y - 10}px)` }}
      aria-hidden="true" />
  );
};

export const EyeStatusBadge = ({ consentState, gazeReady, gazeStuckSecs, idleDetected }) => {
  if (consentState === "pending") return null;
  const isTracking = consentState === "granted" && gazeReady;
  return (
    <div className={`eye-badge ${isTracking ? "eye-badge-active" : "eye-badge-fallback"}`}>
      <span className="eye-badge-dot" />
      <span className="eye-badge-label">
        {isTracking
          ? gazeStuckSecs > 0 ? `Gaze: ${gazeStuckSecs}s on chunk` : "Eye tracking active"
          : idleDetected ? "Mouse idle detected" : "Mouse tracking"}
      </span>
    </div>
  );
};

const EyeTrackingConsent = ({
  consentState, calibrating, gazePoint, gazeReady,
  gazeStuckSecs, idleDetected,
  onGrant, onSkip, onCalibrationDone,
}) => (
  <>
    {consentState === "pending"                && <ConsentGate onGrant={onGrant} onSkip={onSkip} />}
    {consentState === "granted" && calibrating && <CalibrationScreen onDone={onCalibrationDone} />}
    {consentState === "granted" && gazeReady   && <GazeDot gazePoint={gazePoint} />}
    <EyeStatusBadge consentState={consentState} gazeReady={gazeReady}
      gazeStuckSecs={gazeStuckSecs} idleDetected={idleDetected} />
  </>
);

export default EyeTrackingConsent;