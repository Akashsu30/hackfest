const TTSControls = ({ speak, stop, speaking, rate, setRate, currentChunkText }) => {
  const speedLabel = rate <= 0.7 ? "🐢 Slow" : rate <= 1.2 ? "⚡ Normal" : "🚀 Fast";

  return (
    <div className="tts-bar">
      <span className="controls-label">🔊 READ ALOUD</span>
      <div className="tts-row">
        <button
          className={`tts-btn ${speaking ? "active" : ""}`}
          onClick={() => speaking ? stop() : speak(currentChunkText)}
          title={speaking ? "Stop reading" : "Read this chunk aloud"}
        >
          {speaking ? "⏹ Stop" : "▶ Read to me!"}
        </button>

        <div className="tts-rate">
          <span className="tts-rate-label">{speedLabel}</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => {
              setRate(parseFloat(e.target.value));
              if (speaking) {
                stop();
                setTimeout(() => speak(currentChunkText), 100);
              }
            }}
            className="tts-slider"
          />
          <span className="tts-rate-val">{rate.toFixed(1)}×</span>
        </div>
      </div>
    </div>
  );
};

export default TTSControls;
