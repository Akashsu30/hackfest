const MIN_FONT = 12, MAX_FONT = 36;
const MIN_SPACING = 1.0, MAX_SPACING = 3.0;

const ReaderControls = ({
  fontSize, setFontSize,
  lineSpacing, setLineSpacing,
  focusMode, setFocusMode,
  dyslexiaMode, setDyslexiaMode,
  rulerMode, setRulerMode,
  chunkSize, setChunkSize,
  adaptation,
}) => {
  const applyAdaptation = () => {
    if (!adaptation) return;
    if (adaptation.enableFocusMode) setFocusMode(true);
    if (adaptation.increaseLineSpacing) setLineSpacing((s) => Math.min(s + 0.4, MAX_SPACING));
    if (adaptation.recommendedChunkSize) setChunkSize(adaptation.recommendedChunkSize);
  };

  return (
    <div className="controls-bar">
      {/* Text size */}
      <div className="controls-group">
        <span className="controls-label">📝 TEXT SIZE</span>
        <div className="control-row">
          <button className="ctrl-btn" title="Smaller" onClick={() => setFontSize((f) => Math.max(f - 2, MIN_FONT))}>A−</button>
          <span className="ctrl-val">{fontSize}px</span>
          <button className="ctrl-btn" title="Bigger" onClick={() => setFontSize((f) => Math.min(f + 2, MAX_FONT))}>A+</button>
        </div>
        <div className="control-row">
          <button className="ctrl-btn" title="Less spacing" onClick={() => setLineSpacing((s) => Math.max(+(s - 0.2).toFixed(1), MIN_SPACING))}>↕−</button>
          <span className="ctrl-val">{lineSpacing.toFixed(1)}×</span>
          <button className="ctrl-btn" title="More spacing" onClick={() => setLineSpacing((s) => Math.min(+(s + 0.2).toFixed(1), MAX_SPACING))}>↕+</button>
        </div>
      </div>

      {/* Reading modes */}
      <div className="controls-group">
        <span className="controls-label">🎮 MODES</span>
        <button
          className={`mode-btn ${focusMode && !rulerMode ? "active" : ""}`}
          onClick={() => { setFocusMode(!focusMode); if (!focusMode) setRulerMode(false); }}
          title="Show one chunk at a time"
        >
          <span className="mode-icon">🎯</span> Focus
        </button>
        <button
          className={`mode-btn ${rulerMode ? "active" : ""}`}
          onClick={() => { setRulerMode(!rulerMode); if (!rulerMode) setFocusMode(false); }}
          title="Highlight your reading position"
        >
          <span className="mode-icon">📏</span> Ruler
        </button>
        <button
          className={`mode-btn ${dyslexiaMode ? "active purple" : ""}`}
          onClick={() => setDyslexiaMode(!dyslexiaMode)}
          title="Switch to dyslexia-friendly font"
        >
          <span className="mode-icon">🔤</span> Dyslexia
        </button>
      </div>

      {/* Chunk size */}
      <div className="controls-group">
        <span className="controls-label">🧩 CHUNKS</span>
        <div className="control-row">
          <button className="ctrl-btn" onClick={() => setChunkSize((c) => Math.max(c - 1, 1))}>−</button>
          <span className="ctrl-val">{chunkSize} sent.</span>
          <button className="ctrl-btn" onClick={() => setChunkSize((c) => Math.min(c + 1, 5))}>+</button>
        </div>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {chunkSize === 1 ? "🐢 One at a time" : chunkSize <= 2 ? "⚡ Just right" : "🚀 Bigger chunks"}
        </span>
      </div>

      {/* AI suggestions */}
      {adaptation && (
        <div className="controls-group adaptation-group">
          <span className="controls-label">🤖 AI SUGGESTS</span>
          <div className="adaptation-hints">
            {adaptation.enableFocusMode && <span className="hint">🎯 Focus mode will help!</span>}
            {adaptation.increaseLineSpacing && <span className="hint">↕ More space helps reading</span>}
            {adaptation.suggestAudioAssist && <span className="hint">🔊 Try audio assist!</span>}
            {adaptation.recommendedChunkSize && <span className="hint">🧩 Best chunk: {adaptation.recommendedChunkSize}</span>}
          </div>
          <button className="apply-btn" onClick={applyAdaptation}>
            ✨ Apply suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default ReaderControls;
