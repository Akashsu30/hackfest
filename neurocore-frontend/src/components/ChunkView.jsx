import { useState } from "react";
import ChunkRenderer from "./ChunkRenderer";

const ChunkView = ({
  chunks,
  focusIndex,
  setFocusIndex,
  trackChunk,
  fontSize,
  lineSpacing,
  dyslexiaMode,
  focusMode,
  rulerMode,
  onWordClick,
  sentences,
  chunkSize,
  llmChunks,
}) => {
  const [viewMode, setViewMode] = useState("chunk");

  const getChunkClass = (index) => {
    const isFocused = index === focusIndex;
    if (focusMode) return isFocused ? "chunk chunk-focus-active" : "chunk chunk-hidden";
    if (rulerMode) return isFocused ? "chunk chunk-ruler-active" : "chunk chunk-ruler-dim";
    return "chunk";
  };

  // Build bullet groups from sentences array (unchanged)
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
        >
          📄 Paragraph
        </button>
        <button
          className={`toggle-btn ${viewMode === "bullet" ? "active" : ""}`}
          onClick={() => setViewMode("bullet")}
        >
          • Bullet Points
        </button>
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
                onClick={() => {
                  setFocusIndex(index);
                  trackChunk(index);
                }}
                style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
              >
                {(focusMode || rulerMode) && (
                  <span className="chunk-num">{index + 1}</span>
                )}
                <ul className="bullet-list">
                  {group.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6, fontWeight: 600 }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          : chunks.map((chunk, index) => (
              <ChunkRenderer
                key={index}
                index={index}
                text={chunk}
                llmChunk={llmChunks?.[index] ?? null}
                isFocused={index === focusIndex}
                chunkClass={getChunkClass(index)}
                focusMode={focusMode}
                rulerMode={rulerMode}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                onFocus={() => {
                  setFocusIndex(index);
                  trackChunk(index);
                }}
                onWordClick={onWordClick}
              />
            ))}
      </div>
    </div>
  );
};

export default ChunkView;
