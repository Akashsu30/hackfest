import { useEffect } from "react";
import useFocusTimer from "../hooks/useFocusTimer";

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const FocusTimerHUD = ({ dwellSeconds, idleDetected, nudgeLevel, useGaze }) => {
  const pct   = Math.min((dwellSeconds / 90) * 100, 100);
  const color = nudgeLevel >= 3 ? "var(--ft-danger)"
    : nudgeLevel >= 2 ? "var(--ft-warn)"
    : nudgeLevel >= 1 ? "var(--ft-caution)"
    : "var(--ft-ok)";
  return (
    <div className="ft-hud">
      <span className="ft-hud-label">{useGaze ? "👁 Gaze" : "Focus"}</span>
      <div className="ft-hud-track">
        <div className="ft-hud-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="ft-hud-meta">
        <span className="ft-hud-time" style={{ color }}>{fmt(dwellSeconds)}</span>
        {idleDetected && !useGaze && <span className="ft-idle-dot">👁 idle</span>}
      </div>
    </div>
  );
};

export const GentleRing = ({ active, chunkRef }) => {
  useEffect(() => {
    const el = chunkRef?.current;
    if (!el) return;
    if (active) el.classList.add("ft-gentle-ring");
    else        el.classList.remove("ft-gentle-ring");
    return () => el.classList.remove("ft-gentle-ring");
  }, [active, chunkRef]);
  return null;
};

export const NudgeModal = ({ visible, onSimplify, onDismiss, dwellSeconds, useGaze }) => {
  if (!visible) return null;
  return (
    <div className="ft-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ft-modal">
        <div className="ft-modal-icon">{useGaze ? "👁" : "🧠"}</div>
        <h2 className="ft-modal-title">
          {useGaze ? "Your gaze is lingering here" : "Still here?"}
        </h2>
        <p className="ft-modal-body">
          {useGaze
            ? <><strong>Eye tracking</strong> detected your gaze has been here for <strong>{fmt(dwellSeconds)}</strong>. Need a simpler version?</>
            : <>You've been on this section for <strong>{fmt(dwellSeconds)}</strong>. Would a simpler version help?</>
          }
        </p>
        <div className="ft-modal-actions">
          <button className="ft-btn ft-btn-primary" onClick={onSimplify}>✦ Simplify this chunk</button>
          <button className="ft-btn ft-btn-secondary" onClick={onDismiss}>I'm good, keep reading</button>
        </div>
        <p className="ft-modal-hint">Tip: Press <kbd>↓</kbd> or <kbd>J</kbd> to advance.</p>
      </div>
    </div>
  );
};

export const BreakOverlay = ({ visible, onDismiss, dwellSeconds }) => {
  if (!visible) return null;
  return (
    <div className="ft-break-backdrop" role="alertdialog" aria-modal="true">
      <div className="ft-break-card">
        <div className="ft-break-orb" />
        <h1 className="ft-break-title">Time for a micro-break</h1>
        <p className="ft-break-sub">
          You've spent <strong>{fmt(dwellSeconds)}</strong> on this chunk.
        </p>
        <ol className="ft-break-steps">
          <li>Look away from the screen for <strong>20 seconds</strong></li>
          <li>Take three slow, deep breaths</li>
          <li>Roll your shoulders back</li>
        </ol>
        <button className="ft-btn ft-btn-primary ft-btn-large" onClick={onDismiss}>
          ↩ I'm ready to continue
        </button>
      </div>
    </div>
  );
};

export const IdleBadge = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="ft-idle-badge" role="status">
      <span className="ft-idle-pulse" />
      <span>Gaze detected — take your time</span>
    </div>
  );
};

const FocusTimerController = ({
  focusIndex, active, onSimplifyCurrentChunk, chunkRef,
  gazeStuckSecs = 0, useGaze = false,
}) => {
  const { nudge, dismissNudge, acceptSimplify, dwellSeconds, idleDetected } =
    useFocusTimer({
      focusIndex, active,
      onSimplify: onSimplifyCurrentChunk,
      externalDwellSeconds: useGaze ? gazeStuckSecs : undefined,
    });
  const level = nudge?.level ?? 0;
  const secs  = useGaze ? gazeStuckSecs : dwellSeconds;

  return (
    <>
      <FocusTimerHUD dwellSeconds={secs} idleDetected={idleDetected} nudgeLevel={level} useGaze={useGaze} />
      <GentleRing active={level >= 1} chunkRef={chunkRef} />
      <IdleBadge visible={idleDetected && level === 0 && !useGaze} />
      <NudgeModal visible={level === 2} onSimplify={acceptSimplify} onDismiss={dismissNudge} dwellSeconds={secs} useGaze={useGaze} />
      <BreakOverlay visible={level === 3} onDismiss={dismissNudge} dwellSeconds={secs} />
    </>
  );
};

export default FocusTimerController;