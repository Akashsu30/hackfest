import User from "../models/User.js";

/**
 * After a session ends, merge its metrics into the user's
 * baseline profile using an exponential moving average (EMA).
 * EMA gives more weight to recent sessions than old ones.
 */
const EMA_ALPHA = 0.3; // 0 = ignore new data, 1 = replace with new data

const ema = (oldVal, newVal) => {
  if (!oldVal || oldVal === 0) return newVal;
  return parseFloat((EMA_ALPHA * newVal + (1 - EMA_ALPHA) * oldVal).toFixed(4));
};

export const updateUserProfile = async (userId, metrics, sessionSettings) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const p = user.baselineProfile;

    const updated = {
      avgReadingSpeed:             ema(p.avgReadingSpeed, metrics.avgChunkTime),
      avgFocusDuration:            ema(p.avgFocusDuration, metrics.avgChunkTime * metrics.totalChunks),
      fatigueSensitivityScore:     ema(p.fatigueSensitivityScore, metrics.fatigueIndex),
      distractionSensitivityScore: ema(p.distractionSensitivityScore, metrics.distractionIndex),
      preferredChunkSize:          sessionSettings?.chunkSize ?? p.preferredChunkSize,
      audioPreference:             metrics.fatigueIndex > 1.5 ? true : p.audioPreference,
      avgRereadDensity:            ema(p.avgRereadDensity, metrics.rereadDensity),
      dominantRhythm:              metrics.rhythmPattern ?? p.dominantRhythm,
    };

    user.baselineProfile = updated;
    user.totalSessions = (user.totalSessions ?? 0) + 1;
    await user.save();

    return user;
  } catch (err) {
    console.error("Profile update failed:", err);
    return null;
  }
};

/**
 * Derives recommended reader settings from a user's profile.
 */
export const deriveSettingsFromProfile = (profile) => {
  return {
    chunkSize:   profile.preferredChunkSize ?? 2,
    lineSpacing: profile.avgReadingSpeed > 6 ? 2.0 : 1.7,
    focusMode:   profile.distractionSensitivityScore > 0.3,
    audioMode:   profile.audioPreference ?? false,
    fontSize:    profile.avgReadingSpeed > 7 ? 20 : 18,
  };
};