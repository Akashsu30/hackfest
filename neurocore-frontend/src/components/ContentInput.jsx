import { useState } from "react";

const API = "http://localhost:5000";

const PLACEHOLDER = `Paste your text here... 

For example: "The sun is a giant ball of hot gas at the center of our solar system. It gives us light and warmth every day..."`;

const ContentInput = ({ onContentTransformed, userId, chunkSize }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const sessionRes = await fetch(`${API}/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, userId, chunkSize }),
      });
      if (!sessionRes.ok) throw new Error("Failed to start session");
      const session = await sessionRes.json();

      const transformRes = await fetch(`${API}/api/content/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!transformRes.ok) throw new Error("Failed to transform content");
      const data = await transformRes.json();

      onContentTransformed({ ...data, sessionId: session._id });
    } catch (err) {
      setError(err.message || "Oops! Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="input-card">
      <div className="input-header">
        <span className="input-label">📝 PASTE YOUR TEXT</span>
        <h2>What would you like to read today?</h2>
        <p className="input-hint">Textbooks, stories, articles — anything you need to read! NeuroCore will make it easier for you. 🌟</p>
      </div>
      <textarea
        className="content-textarea"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
      />
      {error && (
        <div className="error-msg">
          <span>😕</span>
          <span>{error}</span>
        </div>
      )}
      <div className="input-footer">
        <span className="char-count">
          {charCount > 0 ? `${wordCount} words · ${charCount} chars` : "Type or paste your text above"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="transform-btn"
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Getting ready… 🧠
            </span>
          ) : "🚀 Let's Read!"}
        </button>
      </div>
    </div>
  );
};

export default ContentInput;
