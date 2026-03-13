import { useState, useCallback } from "react";
import TooltipWord from "./TooltipWord";

const API = "";

/* ─────────────────────────────────────────────────────────────────────────────
   renderChunkText
   Splits chunk text by complex words (case-insensitive) and wraps each match
   in a <TooltipWord> element. Non-matching segments stay as plain strings.
   Returns a mixed array that React renders correctly inside any container.
───────────────────────────────────────────────────────────────────────────── */
function renderChunkText(text, complexWords) {
  if (!complexWords?.length) return text;

  const wordMap = {};
  complexWords.forEach(({ word, meaning }) => {
    if (word && meaning) wordMap[word.toLowerCase()] = meaning;
  });

  const keys = Object.keys(wordMap);
  if (!keys.length) return text;

  const pattern = new RegExp(
    `(${keys.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );

  return text.split(pattern).map((part, i) => {
    const meaning = wordMap[part.toLowerCase()];
    if (meaning) return <TooltipWord key={i} word={part} meaning={meaning} />;
    return part;
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   ChunkRenderer
   Renders a single chunk in paragraph mode. Local state:
     showSimplified  — toggle simplified_text (instant, no API call)
     showDoubt       — show/hide the Ask Doubt panel
     doubtText       — controlled textarea value
     doubtLoading    — true while waiting for AI response
     doubtAnswer     — AI response text (displayed below question)
     doubtError      — error message if the AI call fails
───────────────────────────────────────────────────────────────────────────── */
const ChunkRenderer = ({
  index,
  text,
  llmChunk,
  isFocused,
  chunkClass,
  focusMode,
  rulerMode,
  fontSize,
  lineSpacing,
  onFocus,
  onWordClick,
}) => {
  const [showSimplified, setShowSimplified] = useState(false);
  const [showDoubt, setShowDoubt]           = useState(false);
  const [doubtText, setDoubtText]           = useState("");
  const [doubtLoading, setDoubtLoading]     = useState(false);
  const [doubtAnswer, setDoubtAnswer]       = useState(null);
  const [doubtError, setDoubtError]         = useState(null);

  const hasSimplified      = Boolean(llmChunk?.simplified_text);
  const complexWords       = llmChunk?.complex_words;
  const comprehensionCheck = llmChunk?.comprehension_check;
  const hasValidComplexWords =
    Array.isArray(complexWords) &&
    complexWords.length > 0 &&
    typeof complexWords[0] === "object" &&
    complexWords[0].word;

  const handleMouseUp = useCallback(
    (e) => {
      const selection = window.getSelection();
      const word =
        selection?.toString().trim() ||
        e.target.textContent.trim().split(/\s+/)[0];
      if (word) onWordClick(word, e.clientX, e.clientY);
    },
    [onWordClick]
  );

  // ── Ask Doubt submit ─────────────────────────────────────────────────────
  const submitDoubt = useCallback(async () => {
    const q = doubtText.trim();
    if (!q || doubtLoading) return;
    setDoubtLoading(true);
    setDoubtAnswer(null);
    setDoubtError(null);
    try {
      const res = await fetch(`${API}/api/content/doubt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunkText: text, question: q }),
      });
      // Always check res.ok before calling res.json().
      // A 404 or 500 can return an HTML body — calling .json() on HTML throws
      // "Unexpected token '<'" which obscures the real problem.
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json")
          ? (await res.json()).error
          : `Server error ${res.status} — restart the backend and try again.`;
        throw new Error(msg || "AI unavailable");
      }
      const data = await res.json();
      if (!data.answer) throw new Error("Empty response from AI");
      setDoubtAnswer(data.answer);
    } catch (err) {
      setDoubtError(err.message || "Something went wrong. Try again.");
    } finally {
      setDoubtLoading(false);
    }
  }, [doubtText, doubtLoading, text]);

  // Enter to submit, Shift+Enter for newline
  const handleDoubtKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitDoubt();
      }
    },
    [submitDoubt]
  );

  const resetDoubt = () => {
    setShowDoubt(false);
    setDoubtText("");
    setDoubtAnswer(null);
    setDoubtError(null);
  };

  // On the simplified path: render plain string (simpler vocab — annotating
  // with original complex_words would be misleading).
  // On the original path: parse and wrap complex words with TooltipWord.
  const displayContent = showSimplified
    ? llmChunk?.simplified_text
    : renderChunkText(text, complexWords);

  return (
    <div className={chunkClass}>

      {/* Main paragraph */}
      <p
        style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing, fontWeight: 600 }}
        onClick={onFocus}
        onMouseUp={handleMouseUp}
      >
        {(focusMode || rulerMode) && (
          <span className="chunk-num">{index + 1}</span>
        )}
        {displayContent}
        {showSimplified && (
          <span style={{ fontSize: "1.2rem", animation: "bounce-in 0.4s ease", display: "inline-block" }}>
            ⭐
          </span>
        )}
      </p>

      {/* Actions panel — only visible for the focused chunk */}
      {isFocused && (
        <div className="chunk-actions" style={{ flexDirection: "column", gap: 10 }}>

          {/* ── Button row ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hasSimplified && (
              <button
                className="chunk-action-btn"
                onClick={() => setShowSimplified((v) => !v)}
              >
                {showSimplified ? "📖 Show Original" : "🤖 Simplify for me"}
              </button>
            )}
            <button
              className="chunk-action-btn"
              onClick={() => { setShowDoubt((v) => !v); if (showDoubt) resetDoubt(); }}
            >
              {showDoubt ? "✕ Close" : "❓ Ask Doubt"}
            </button>
          </div>

          {/* ── Ask Doubt panel ─────────────────────────────────────────── */}
          {showDoubt && (
            <div className="ask-doubt-area">
              <textarea
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                onKeyDown={handleDoubtKeyDown}
                placeholder="Type your question here… (Enter to submit, Shift+Enter for new line)"
                disabled={doubtLoading}
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="ask-doubt-close" onClick={resetDoubt}>
                  Cancel
                </button>
                <button
                  className="ask-doubt-submit"
                  onClick={submitDoubt}
                  disabled={!doubtText.trim() || doubtLoading}
                >
                  {doubtLoading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "white" }} />
                      Thinking…
                    </span>
                  ) : "Submit ✦"}
                </button>
              </div>

              {/* AI response */}
              {doubtAnswer && (
                <div className="doubt-response">
                  <div className="doubt-response-label">Your question</div>
                  <div className="doubt-question-text">{doubtText}</div>
                  <div className="doubt-response-label" style={{ marginTop: 10 }}>AI Response</div>
                  <div className="doubt-answer-text">{doubtAnswer}</div>
                </div>
              )}

              {/* Error */}
              {doubtError && (
                <div style={{
                  background: "rgba(239,83,80,0.08)",
                  border: "1.5px solid rgba(239,83,80,0.3)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: "0.84rem",
                  color: "var(--danger)",
                }}>
                  😕 {doubtError}
                </div>
              )}
            </div>
          )}

          {/* ── Complex words glossary panel ────────────────────────────── */}
          {hasValidComplexWords && (
            <div style={{
              background: "rgba(102,187,106,0.08)",
              border: "1.5px solid rgba(102,187,106,0.3)",
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <div style={{
                fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)",
                letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase",
              }}>
                Complex Words
              </div>
              {complexWords.map((item, i) => (
                <div key={i} style={{ marginBottom: 4, fontSize: "0.88rem" }}>
                  <strong style={{ color: "var(--accent)" }}>{item.word}</strong>
                  {" — "}
                  <span style={{ color: "var(--text-muted)" }}>{item.meaning}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Comprehension check panel ───────────────────────────────── */}
          {comprehensionCheck && (
            <div style={{
              background: "rgba(66,165,245,0.07)",
              border: "1.5px solid rgba(66,165,245,0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: "0.88rem",
              color: "var(--text-muted)",
            }}>
              <span style={{ fontWeight: 700, color: "#42a5f5" }}>Quick Check: </span>
              {comprehensionCheck}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ChunkRenderer;
