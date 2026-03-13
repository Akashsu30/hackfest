import { useRef, useEffect, useState, useCallback } from "react";

const THRESHOLDS = [
  { level: 1, label: "gentle",  ms: 30_000 },
  { level: 2, label: "suggest", ms: 60_000 },
  { level: 3, label: "break",   ms: 90_000 },
];

export default function useFocusTimer({
  focusIndex, active, onSimplify, onNudge,
  externalDwellSeconds, // provided by useEyeTracking when gaze is active
}) {
  const dwellStart   = useRef(Date.now());
  const thresholdIdx = useRef(0);
  const mouseIdleRef = useRef(null);

  const [nudge,        setNudge]    = useState(null);
  const [dwellSeconds, setDwellSec] = useState(0);
  const [idleDetected, setIdle]     = useState(false);

  // Reset on chunk change
  useEffect(() => {
    if (!active) return;
    dwellStart.current = Date.now();
    thresholdIdx.current = 0;
    setNudge(null); setDwellSec(0); setIdle(false);
  }, [focusIndex, active]);

  // External dwell mode (eye tracking)
  useEffect(() => {
    if (externalDwellSeconds === undefined || !active) return;
    setDwellSec(externalDwellSeconds);
    const next = THRESHOLDS[thresholdIdx.current];
    if (next && externalDwellSeconds * 1000 >= next.ms) {
      thresholdIdx.current += 1;
      setNudge({ level: next.level, label: next.label });
      onNudge?.(next.level, next.label);
    }
  }, [externalDwellSeconds, active, onNudge]);

  // Internal tick (mouse-idle fallback)
  useEffect(() => {
    if (!active || externalDwellSeconds !== undefined) return;
    const tick = setInterval(() => {
      const elapsed = Date.now() - dwellStart.current;
      setDwellSec(Math.floor(elapsed / 1000));
      const next = THRESHOLDS[thresholdIdx.current];
      if (next && elapsed >= next.ms) {
        thresholdIdx.current += 1;
        setNudge({ level: next.level, label: next.label });
        onNudge?.(next.level, next.label);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [focusIndex, active, externalDwellSeconds, onNudge]);

  // Mouse-idle detection (fallback only)
  useEffect(() => {
    if (!active || externalDwellSeconds !== undefined) return;
    const IDLE_MS = 4_000;
    const onMove = () => {
      setIdle(false);
      clearTimeout(mouseIdleRef.current);
      mouseIdleRef.current = setTimeout(() => setIdle(true), IDLE_MS);
    };
    mouseIdleRef.current = setTimeout(() => setIdle(true), IDLE_MS);
    window.addEventListener("mousemove",  onMove, { passive: true });
    window.addEventListener("touchstart", onMove, { passive: true });
    return () => {
      clearTimeout(mouseIdleRef.current);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, [focusIndex, active, externalDwellSeconds]);

  const dismissNudge   = useCallback(() => setNudge(null), []);
  const acceptSimplify = useCallback(() => {
    onSimplify?.();
    setNudge(null);
    dwellStart.current = Date.now();
    thresholdIdx.current = 0;
  }, [onSimplify]);

  return { nudge, dismissNudge, acceptSimplify, dwellSeconds, idleDetected };
}