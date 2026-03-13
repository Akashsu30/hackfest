import { useState, useCallback } from "react";

const useWordDefinition = () => {
  const [definition, setDefinition] = useState(null); // { word, meanings, loading, error, x, y }

  const lookup = useCallback(async (word, x, y) => {
    const clean = word.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
    if (!clean || clean.length < 2) return;

    setDefinition({ word: clean, meanings: [], loading: true, error: null, x, y });

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      const meanings = data[0]?.meanings?.slice(0, 2).map((m) => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions[0]?.definition,
      })) ?? [];
      setDefinition({ word: clean, meanings, loading: false, error: null, x, y });
    } catch {
      setDefinition({ word: clean, meanings: [], loading: false, error: "No definition found.", x, y });
    }
  }, []);

  const clear = useCallback(() => setDefinition(null), []);

  return { definition, lookup, clear };
};

export default useWordDefinition;