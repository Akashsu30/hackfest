import { useState, useCallback } from "react";

const API = "http://localhost:5000";

/* Tiny animated star that pops when simplify is done */
const SuccessStar = ({ show }) =>
  show ? (
    <span style={{
      fontSize: "1.2rem",
      animation: "bounce-in 0.4s ease",
      display: "inline-block",
    }}>⭐</span>
  ) : null;

const ChunkView = ({
  chunks, focusIndex, setFocusIndex, trackChunk,
  fontSize, lineSpacing, dyslexiaMode, focusMode, rulerMode,
  onWordClick, bulletMode, sentences, chunkSize,
}) => {
  const [simplifiedMap, setSimplifiedMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [viewMode, setViewMode] = useState("chunk");

  const simplify = useCallback(async (index, text) => {
    setLoadingMap((m) => ({ ...m, [index]: true }));
    try {
      const res = await fetch(`${API}/api/content/simplify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setSimplifiedMap((m) => ({ ...m, [index]: data.simplified }));
    } catch {
      setSimplifiedMap((m) => ({ ...m, [index]: "Could not simplify right now." }));
    } finally {
      setLoadingMap((m) => ({ ...m, [index]: false }));
    }
  }, []);

  const getChunkClass = (index) => {
    const isFocused = index === focusIndex;
    if (focusMode) return isFocused ? "chunk chunk-focus-active" : "chunk chunk-hidden";
    if (rulerMode) return isFocused ? "chunk chunk-ruler-active" : "chunk chunk-ruler-dim";
    return "chunk";
  };

  const handleWordClick = useCallback((e) => {
    const selection = window.getSelection();
    const word = selection?.toString().trim() || e.target.textContent.trim().split(/\s+/)[0];
    if (word) onWordClick(word, e.clientX, e.clientY);
  }, [onWordClick]);

  const bulletChunks = [];
  if (sentences) {
    for (let i = 0; i < sentences.length; i += chunkSize) {
      bulletChunks.push(sentences.slice(i, i + chunkSize));
    }
  }

  return (
    <div>
      {/* View mode toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === "chunk" ? "active" : ""}`}
          onClick={() => setViewMode("chunk")}
        >📄 Paragraph</button>
        <button
          className={`toggle-btn ${viewMode === "bullet" ? "active" : ""}`}
          onClick={() => setViewMode("bullet")}
        >• Bullet Points</button>
      </div>

      <div
        className="chunks-container"
        style={{
          fontFamily: dyslexiaMode ? "OpenDyslexic, sans-serif" : "var(--font-body)",
          letterSpacing: dyslexiaMode ? "0.06em" : "normal",
        }}
      >
        {viewMode === "bullet"
          ? bulletChunks.map((group, index) => (
              <div
                key={index}
                className={getChunkClass(index)}
                onClick={() => { setFocusIndex(index); trackChunk(index); }}
                style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
              >
                {(focusMode || rulerMode) && <span className="chunk-num">{index + 1}</span>}
                <ul className="bullet-list">
                  {group.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6, fontWeight: 600 }}>{s}</li>
                  ))}
                </ul>
              </div>
            ))
          : chunks.map((chunk, index) => (
              <div key={index} className={getChunkClass(index)}>
                <p
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing, fontWeight: 600 }}
                  onClick={() => { setFocusIndex(index); trackChunk(index); }}
                  onMouseUp={handleWordClick}
                >
                  {(focusMode || rulerMode) && <span className="chunk-num">{index + 1}</span>}
                  {simplifiedMap[index] ?? chunk}
                  {simplifiedMap[index] && <SuccessStar show />}
                </p>

                {index === focusIndex && (
                  <div className="chunk-actions">
                    {simplifiedMap[index] ? (
                      <button
                        className="chunk-action-btn"
                        onClick={() => setSimplifiedMap((m) => { const n = {...m}; delete n[index]; return n; })}
                      >
                        📖 Show original
                      </button>
                    ) : (
                      <button
                        className="chunk-action-btn"
                        onClick={() => simplify(index, chunk)}
                        disabled={loadingMap[index]}
                      >
                        {loadingMap[index] ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="spinner" style={{ borderColor: "rgba(171,71,188,0.3)", borderTopColor: "#ab47bc" }}/>
                            Making it simpler…
                          </span>
                        ) : "🤖 Simplify for me"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
        }
      </div>
    </div>
  );
};

export default ChunkView;
