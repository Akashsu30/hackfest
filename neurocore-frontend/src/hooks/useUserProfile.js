import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

/**
 * Manages anonymous user identity via localStorage.
 * Creates a user on first visit, loads their profile on return.
 */
const useUserProfile = () => {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendedSettings, setRecommendedSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      let id = localStorage.getItem("neurocore_user_id");

      if (!id) {
        // First visit — create anonymous user
        try {
          const res = await fetch(`${API}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Anonymous" }),
          });
          const user = await res.json();
          id = user._id;
          localStorage.setItem("neurocore_user_id", id);
        } catch (err) {
          console.error("Could not create user:", err);
          setLoading(false);
          return;
        }
      }

      setUserId(id);

      // Load profile
      try {
        const res = await fetch(`${API}/api/users/${id}/profile`);
        if (res.ok) {
          const user = await res.json();
          setProfile(user);

          // Only apply recommended settings if user has at least 1 session
          if (user.totalSessions > 0) {
            const p = user.baselineProfile;
            setRecommendedSettings({
              chunkSize:   p.preferredChunkSize ?? 2,
              lineSpacing: p.avgReadingSpeed > 6 ? 2.0 : 1.7,
              focusMode:   p.distractionSensitivityScore > 0.3,
              fontSize:    p.avgReadingSpeed > 7 ? 20 : 18,
            });
          }
        }
      } catch (err) {
        console.error("Could not load profile:", err);
      }

      setLoading(false);
    };

    init();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/api/users/${userId}/profile`);
      if (res.ok) setProfile(await res.json());
    } catch (_) {}
  }, [userId]);

  return { userId, profile, recommendedSettings, loading, refreshProfile };
};

export default useUserProfile;