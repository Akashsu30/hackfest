import { useState, useCallback } from "react";

const API = "http://localhost:5000";

const useCognitiveIntelligence = () => {
  const [difficulty, setDifficulty] = useState(null);
  const [chunkLoads, setChunkLoads] = useState([]);
  const [driftPrediction, setDriftPrediction] = useState(null);
  const [pacingSuggestion, setPacingSuggestion] = useState(null);
  const [loadingDifficulty, setLoadingDifficulty] = useState(false);
  const [loadingChunkLoad, setLoadingChunkLoad] = useState(false);

  // Called once when content is transformed
  const analyzeText = useCallback(async (text, chunks) => {
    // Run difficulty + chunk load in parallel
    setLoadingDifficulty(true);
    setLoadingChunkLoad(true);

    try {
      const [diffRes, loadRes] = await Promise.all([
        fetch(`${API}/api/intelligence/difficulty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }),
        fetch(`${API}/api/intelligence/chunk-load`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks }),
        }),
      ]);

      if (diffRes.ok) setDifficulty(await diffRes.json());
      if (loadRes.ok) {
        const data = await loadRes.json();
        setChunkLoads(data.chunkLoads ?? []);
      }
    } catch (err) {
      console.error("Intelligence analysis failed:", err);
    } finally {
      setLoadingDifficulty(false);
      setLoadingChunkLoad(false);
    }
  }, []);

  // Called periodically during reading
  const fetchDriftPrediction = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/intelligence/drift/${sessionId}`);
      if (res.ok) setDriftPrediction(await res.json());
    } catch (_) {}
  }, []);

  // Called periodically during reading
  const fetchPacingSuggestion = useCallback(async (sessionId, profile) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/intelligence/pacing/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) setPacingSuggestion(await res.json());
    } catch (_) {}
  }, []);

  const reset = useCallback(() => {
    setDifficulty(null);
    setChunkLoads([]);
    setDriftPrediction(null);
    setPacingSuggestion(null);
  }, []);

  return {
    difficulty,
    chunkLoads,
    driftPrediction,
    pacingSuggestion,
    loadingDifficulty,
    loadingChunkLoad,
    analyzeText,
    fetchDriftPrediction,
    fetchPacingSuggestion,
    reset,
  };
};

export default useCognitiveIntelligence;