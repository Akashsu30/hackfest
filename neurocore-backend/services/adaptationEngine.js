export const generateAdaptation = (metrics) => {
  const adaptation = {
    recommendedChunkSize: 2,
    increaseLineSpacing: false,
    enableFocusMode: false,
    suggestAudioAssist: false,
  };

  if (metrics.rereadDensity > 0.5) adaptation.recommendedChunkSize = 1;
  if (metrics.distractionIndex > 0.3) adaptation.enableFocusMode = true;
  if (metrics.fatigueIndex > 1.5) adaptation.suggestAudioAssist = true;
  if (metrics.avgChunkTime > 6) adaptation.increaseLineSpacing = true;

  return adaptation;
};