import { useRef, useEffect, useCallback } from "react";

const API = "";

const useInteractionTracker = (sessionId, onRealtimeSignal) => {
  const chunkStartTime = useRef(Date.now());
  const currentChunkIndex = useRef(null);
  const visitCounts = useRef({});
  const microPauseTimer = useRef(null);
  const microPauseCount = useRef(0);
  const focusLostCount = useRef(0);
  const scrollEvents = useRef([]);
  const lastScrollTime = useRef(null);
  const hesitationCount = useRef(0);
  const hesitationTimer = useRef(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) focusLostCount.current += 1;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const now = Date.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = lastScrollTime.current ? (now - lastScrollTime.current) / 1000 : 0.1;
      if (dt > 0) scrollEvents.current.push(dy / dt);
      lastY = window.scrollY;
      lastScrollTime.current = now;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = () => {
      clearTimeout(hesitationTimer.current);
      hesitationTimer.current = setTimeout(() => {
        hesitationCount.current += 1;
      }, 600);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      clearTimeout(hesitationTimer.current);
    };
  }, []);

  const resetCounters = useCallback(() => {
    chunkStartTime.current = Date.now();
    microPauseCount.current = 0;
    focusLostCount.current = 0;
    scrollEvents.current = [];
    hesitationCount.current = 0;
    clearTimeout(microPauseTimer.current);

    const schedulePauseCheck = () => {
      microPauseTimer.current = setTimeout(() => {
        microPauseCount.current += 1;
        schedulePauseCheck();
      }, 2000);
    };
    schedulePauseCheck();
  }, []);

  const flushChunk = useCallback(async (chunkIndex) => {
    if (!sessionId || chunkIndex === null) return;

    const timeSpent = (Date.now() - chunkStartTime.current) / 1000;
    const avgScrollVelocity =
      scrollEvents.current.length > 0
        ? scrollEvents.current.reduce((a, b) => a + b, 0) / scrollEvents.current.length
        : 0;
    const rereadCount = Math.max(0, (visitCounts.current[chunkIndex] ?? 0) - 1);

    try {
      const res = await fetch(`${API}/api/interactions/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          chunkIndex,
          timeSpent:        Math.round(timeSpent * 100) / 100,
          scrollVelocity:   Math.round(avgScrollVelocity),
          rereadCount,
          hesitationEvents: hesitationCount.current,
          microPauses:      microPauseCount.current,
          focusLostEvents:  focusLostCount.current,
        }),
      });

      // Pass realtime signal back up to App
      if (res.ok && onRealtimeSignal) {
        const data = await res.json();
        if (data.realtimeSignal) onRealtimeSignal(data.realtimeSignal);
      }
    } catch (err) {
      console.error("Interaction log failed:", err);
    }
  }, [sessionId, onRealtimeSignal]);

  const trackChunk = useCallback((newChunkIndex) => {
    if (currentChunkIndex.current !== null && currentChunkIndex.current !== newChunkIndex) {
      flushChunk(currentChunkIndex.current);
    }
    visitCounts.current[newChunkIndex] = (visitCounts.current[newChunkIndex] ?? 0) + 1;
    currentChunkIndex.current = newChunkIndex;
    resetCounters();
  }, [flushChunk, resetCounters]);

  const flushAll = useCallback(async () => {
    clearTimeout(microPauseTimer.current);
    if (currentChunkIndex.current !== null) {
      await flushChunk(currentChunkIndex.current);
    }
  }, [flushChunk]);

  return { trackChunk, flushAll };
};

export default useInteractionTracker;