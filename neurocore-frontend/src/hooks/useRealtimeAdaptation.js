import { useState, useCallback, useRef } from "react";

/**
 * Receives realtime signals from the interaction log response
 * and manages alerts + live adaptations.
 */
const useRealtimeAdaptation = ({
  setFocusMode,
  setLineSpacing,
  setChunkSize,
}) => {
  const [alert, setAlert] = useState(null); // current alert to show user
  const [breakDue, setBreakDue] = useState(false);
  const alertTimeout = useRef(null);
  const shownAlerts = useRef(new Set()); // prevent repeat alerts

  const showAlert = useCallback((message, type = "info", duration = 6000) => {
    clearTimeout(alertTimeout.current);
    setAlert({ message, type });
    alertTimeout.current = setTimeout(() => setAlert(null), duration);
  }, []);

  const processSignal = useCallback((signal) => {
    if (!signal) return;

    // Break reminder — show once per 20-chunk milestone
    const breakKey = `break-${signal.chunksRead}`;
    if (signal.breakRecommended && !shownAlerts.current.has(breakKey)) {
      shownAlerts.current.add(breakKey);
      setBreakDue(true);
      showAlert("You've been reading for a while. Consider taking a short break.", "break", 10000);
      return; // don't stack alerts
    }

    // Fatigue detected
    const fatigueKey = `fatigue-${Math.floor(signal.chunksRead / 5)}`;
    if (signal.fatigueDetected && !shownAlerts.current.has(fatigueKey)) {
      shownAlerts.current.add(fatigueKey);
      showAlert("Fatigue detected — consider switching to audio mode.", "warning");
    }

    // Attention drift
    const driftKey = `drift-${Math.floor(signal.chunksRead / 5)}`;
    if (signal.driftDetected && !shownAlerts.current.has(driftKey)) {
      shownAlerts.current.add(driftKey);
      showAlert("Reading pace slowing down — increasing line spacing.", "info");
      setLineSpacing((s) => Math.min(+(s + 0.3).toFixed(1), 3.0));
    }

    // Distraction spike — auto enable focus mode
    const distractionKey = `distraction-${Math.floor(signal.chunksRead / 5)}`;
    if (signal.distractionSpike && !shownAlerts.current.has(distractionKey)) {
      shownAlerts.current.add(distractionKey);
      showAlert("Distraction detected — enabling Focus Mode.", "warning");
      setFocusMode(true);
    }

    // Rereading loop — reduce chunk size
    const rereadKey = `reread-${Math.floor(signal.chunksRead / 5)}`;
    if (signal.rereadingLoop && !shownAlerts.current.has(rereadKey)) {
      shownAlerts.current.add(rereadKey);
      showAlert("Frequent rereading detected — reducing chunk size.", "info");
      setChunkSize((c) => Math.max(c - 1, 1));
    }
  }, [showAlert, setFocusMode, setLineSpacing, setChunkSize]);

  const dismissBreak = useCallback(() => {
    setBreakDue(false);
    setAlert(null);
  }, []);

  const dismissAlert = useCallback(() => {
    clearTimeout(alertTimeout.current);
    setAlert(null);
  }, []);

  return { alert, breakDue, processSignal, dismissAlert, dismissBreak };
};

export default useRealtimeAdaptation;