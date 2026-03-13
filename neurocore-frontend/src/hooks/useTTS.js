import { useRef, useState, useCallback } from "react";

const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1.0);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, rate, setRate };
};

export default useTTS;