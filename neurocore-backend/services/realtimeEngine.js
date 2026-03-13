/**
 * Real-time signal processor.
 * Analyzes a sliding window of recent chunk interactions
 * and returns immediate alerts + adaptations.
 */

const WINDOW_SIZE = 5; // look at last 5 chunks

export const analyzeRealtime = (interactions) => {
  if (!interactions || interactions.length === 0) return null;

  const recent = interactions.slice(-WINDOW_SIZE);
  const totalChunks = interactions.length;

  // ── Fatigue detection ─────────────────────────────────
  // Fatigue = micro-pauses spiking in recent chunks
  const recentPauses = recent.reduce((s, i) => s + i.microPauses, 0) / recent.length;
  const overallPauses = interactions.reduce((s, i) => s + i.microPauses, 0) / totalChunks;
  const fatigueDetected = recentPauses > 2 && recentPauses > overallPauses * 1.5;

  // ── Attention drift detection ─────────────────────────
  // Drift = reading speed suddenly slowing down in recent chunks
  const recentAvgTime = recent.reduce((s, i) => s + i.timeSpent, 0) / recent.length;
  const overallAvgTime = interactions.reduce((s, i) => s + i.timeSpent, 0) / totalChunks;
  const driftDetected = recentAvgTime > overallAvgTime * 1.6 && totalChunks >= 5;

  // ── Distraction spike detection ───────────────────────
  const recentFocusLoss = recent.reduce((s, i) => s + i.focusLostEvents, 0);
  const distractionSpike = recentFocusLoss >= 2;

  // ── Rereading loop detection ──────────────────────────
  const recentRereads = recent.reduce((s, i) => s + i.rereadCount, 0);
  const rereadingLoop = recentRereads >= 3;

  // ── Break recommendation ──────────────────────────────
  // Suggest break if reading for more than 20 chunks straight
  const breakRecommended = totalChunks >= 20 && totalChunks % 20 === 0;

  // ── Derive real-time adaptations ──────────────────────
  const adaptations = {};
  if (fatigueDetected)    adaptations.suggestAudioAssist = true;
  if (driftDetected)      adaptations.increaseLineSpacing = true;
  if (distractionSpike)   adaptations.enableFocusMode = true;
  if (rereadingLoop)      adaptations.reduceChunkSize = true;

  return {
    fatigueDetected,
    driftDetected,
    distractionSpike,
    rereadingLoop,
    breakRecommended,
    recentAvgTime: parseFloat(recentAvgTime.toFixed(2)),
    overallAvgTime: parseFloat(overallAvgTime.toFixed(2)),
    adaptations,
    chunksRead: totalChunks,
  };
};