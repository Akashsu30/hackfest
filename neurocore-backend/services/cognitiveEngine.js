import ChunkInteraction from "../models/ChunkInteraction.js";

export const computeMetrics = async (sessionId) => {
  const interactions = await ChunkInteraction.find({ sessionId });

  if (interactions.length === 0) return null;

  const totalChunks = interactions.length;
  const totalTime = interactions.reduce((sum, i) => sum + i.timeSpent, 0);
  const totalRereads = interactions.reduce((sum, i) => sum + i.rereadCount, 0);
  const totalFocusLoss = interactions.reduce((sum, i) => sum + i.focusLostEvents, 0);
  const totalPauses = interactions.reduce((sum, i) => sum + i.microPauses, 0);

  const avgChunkTime = totalTime / totalChunks;
  const rereadDensity = totalRereads / totalChunks;
  const distractionIndex = totalFocusLoss / totalChunks;
  const fatigueIndex = totalPauses / totalChunks;

  const rhythmPattern =
    avgChunkTime < 3 ? "fast" :
    avgChunkTime > 7 ? "slow" :
    "steady";

  const chunkTimes = interactions.map((i) => i.timeSpent);
  const varianceInReadingSpeed =
    chunkTimes.reduce((sum, t) => sum + Math.pow(t - avgChunkTime, 2), 0) / totalChunks;

  return {
    avgChunkTime,
    rereadDensity,
    distractionIndex,
    fatigueIndex,
    rhythmPattern,
    varianceInReadingSpeed,
    totalChunks,
  };
};