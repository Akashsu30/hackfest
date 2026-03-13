import { useEffect, useRef } from "react";

const WordPopup = ({ definition, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (!definition) return null;

  const style = {
    position: "fixed",
    left: Math.min(definition.x, window.innerWidth - 300),
    top: definition.y + 20,
    zIndex: 1000,
  };

  return (
    <div ref={ref} className="word-popup" style={style}>
      {/* Little pointing arrow */}
      <div style={{
        position: "absolute", top: -12, left: 20,
        width: 0, height: 0,
        borderLeft: "12px solid transparent",
        borderRight: "12px solid transparent",
        borderBottom: "12px solid #42a5f5",
      }} />
      <div className="popup-word">
        📚 {definition.word}
      </div>
      {definition.loading && (
        <div className="popup-loading">
          <span className="spinner" style={{ borderTopColor: "#42a5f5", display: "inline-block", marginRight: 8 }} />
          Looking it up…
        </div>
      )}
      {definition.error && (
        <div className="popup-error">😕 {definition.error}</div>
      )}
      {definition.meanings?.map((m, i) => (
        <div key={i} className="popup-meaning">
          <span className="popup-pos">{m.partOfSpeech}</span>
          <p className="popup-def">{m.definition}</p>
        </div>
      ))}
      <button className="popup-close" onClick={onClose}>✕</button>
    </div>
  );
};

export default WordPopup;
