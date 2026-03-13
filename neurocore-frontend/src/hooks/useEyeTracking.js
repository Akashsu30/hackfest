import { useEffect, useRef, useState, useCallback } from "react";

const IDLE_MS = 4000;
const GAZE_CALLBACKS = 20; // Adjusted for standard 60fps sampling
const NUDGE_SECS = 30;

export default function useEyeTracking({ focusIndex, chunkRefs, onGazeStuck }) {
  const [consentState, setConsentState] = useState("pending");
  const [gazeReady, setGazeReady] = useState(false);
  const [gazePoint, setGazePoint] = useState(null);
  const [gazeStuckSecs, setGazeStuckSecs] = useState(0);
  const [idleDetected, setIdle] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const dwellCount = useRef(0);
  const webgazerRef = useRef(null);
  const idleTimer = useRef(null);
  const nudgeFired = useRef(false);

  // 1. Reset logic when user moves to a new section
  useEffect(() => {
    dwellCount.current = 0;
    setGazeStuckSecs(0);
    nudgeFired.current = false;
  }, [focusIndex]);

  // 2. Mouse/Touch Idle Fallback
  useEffect(() => {
    if (consentState !== "skipped" && consentState !== "denied") return;
    
    const resetIdle = () => {
      setIdle(false);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
    };

    resetIdle();
    window.addEventListener("mousemove", resetIdle, { passive: true });
    window.addEventListener("touchstart", resetIdle, { passive: true });

    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, [consentState]);

  // 3. The Core Eye Tracking Logic
  const startWebGazer = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      // Dynamic import to prevent SSR or bundling crashes
      const module = await import("webgazer");
      const wg = module.default || window.webgazer;
      
      if (!wg) {
        throw new Error("WebGazer not found on window");
      }

      webgazerRef.current = wg;

      wg.setRegression("ridge")
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(false)
        .showVideoPreview(false)
        .showPredictionPoints(false);

      wg.setGazeListener((data) => {
        if (!data) return;

        const pt = { x: Math.round(data.x), y: Math.round(data.y) };
        setGazePoint(pt);

        // Check if looking at the active chunk
        const currentRef = chunkRefs?.current?.[focusIndex];
        const el = currentRef?.current || currentRef; // Handles both ref objects and raw elements
        
        if (!el || !(el instanceof Element)) return;

        const r = el.getBoundingClientRect();
        
        // Padding of 40px/20px to account for eye-tracking inaccuracy
        const onChunk =
          pt.x >= r.left - 40 && 
          pt.x <= r.right + 40 &&
          pt.y >= r.top - 20 && 
          pt.y <= r.bottom + 20;

        if (onChunk) {
          dwellCount.current++;
          const secs = Math.floor(dwellCount.current / GAZE_CALLBACKS);
          setGazeStuckSecs(secs);

          if (secs >= NUDGE_SECS && !nudgeFired.current) {
            nudgeFired.current = true;
            if (onGazeStuck) onGazeStuck(secs);
          }
        } else {
          // Slowly decay the dwell count if they look away slightly
          dwellCount.current = Math.max(0, dwellCount.current - 2);
          setGazeStuckSecs(Math.floor(dwellCount.current / GAZE_CALLBACKS));
          nudgeFired.current = false;
        }
      });

      await wg.begin();
      setConsentState("granted");
      setCalibrating(true);
    } catch (err) {
      console.error("WebGazer failed to initialize:", err);
      setConsentState("denied");
    }
  }, [focusIndex, chunkRefs, onGazeStuck]);

  // 4. Controller Functions
  const grantConsent = () => {
    startWebGazer();
  };

  const skipEyeTracking = () => {
    setConsentState("skipped");
    setGazeReady(true);
  };

  const calibrationDone = () => {
    setCalibrating(false);
    setGazeReady(true);
    if (webgazerRef.current) {
      webgazerRef.current.resume();
    }
  };

  // 5. Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (webgazerRef.current) {
        webgazerRef.current.pause();
        webgazerRef.current.end();
        webgazerRef.current.clearGazeListener();
      }
    };
  }, []);

  return {
    consentState,
    gazeReady,
    gazePoint,
    gazeStuckSecs,
    idleDetected,
    calibrating,
    grantConsent,
    skipEyeTracking,
    calibrationDone,
  };
}