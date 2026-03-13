import { useState } from "react";

const TeacherAuth = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password, classroomName);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-auth">
      <div className="auth-card">
        <div className="auth-header">
          <span className="input-label">TEACHER PORTAL</span>
          <h2 className="auth-title">
            {mode === "login" ? "Welcome back" : "Create your classroom"}
          </h2>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >Login</button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >Register</button>
        </div>

        <div className="auth-fields">
          {mode === "register" && (
            <>
              <input
                className="auth-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="auth-input"
                placeholder="Classroom name (e.g. Grade 10 English)"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
              />
            </>
          )}
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && <div className="error-msg">⚠ {error}</div>}

        <button
          className="transform-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait…" : mode === "login" ? "Login →" : "Create Classroom →"}
        </button>
      </div>
    </div>
  );
};

export default TeacherAuth;