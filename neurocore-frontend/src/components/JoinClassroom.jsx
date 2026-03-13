import { useState } from "react";

const API = "http://localhost:5000";

const JoinClassroom = ({ userId, onJoined }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleValidate = async () => {
    if (code.length < 4) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch(`${API}/api/teachers/validate-code/${code.toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/users/${userId}/join-classroom`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomCode: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("neurocore_classroom_code", code.toUpperCase());
      onJoined(code.toUpperCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-classroom">
      <div className="join-classroom-title">
        🏫 Join Your Classroom
      </div>
      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-muted)" }}>
        Got a code from your teacher? Enter it here to join!
      </p>

      {!preview ? (
        <div className="classroom-input-row">
          <input
            className="classroom-input"
            placeholder="ENTER CODE (e.g. AB12CD)"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            maxLength={6}
          />
          <button
            className="classroom-join-btn"
            onClick={handleValidate}
            disabled={loading || code.length < 4}
          >
            {loading ? "🔍 Checking…" : "Check →"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "rgba(102,187,106,0.1)",
            border: "2px solid #66bb6a",
            borderRadius: 14, padding: "14px 18px",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text)" }}>
              🏫 {preview.classroomName}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginTop: 4 }}>
              Teacher: {preview.teacherName}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="classroom-join-btn"
              onClick={handleConfirm}
              disabled={loading}
              style={{ flex: 1, background: "linear-gradient(135deg, #66bb6a, #43a047)" }}
            >
              {loading ? "Joining…" : "🎉 Join this class!"}
            </button>
            <button
              onClick={() => { setPreview(null); setCode(""); }}
              style={{
                background: "var(--surface2)", border: "2px solid var(--border)",
                borderRadius: 12, padding: "10px 16px",
                color: "var(--text-muted)", fontWeight: 700, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-msg">
          <span>😕</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default JoinClassroom;
