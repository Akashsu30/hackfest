const TYPE_CONFIG = {
  info:    { emoji: "💡", color: "#ffca28", bg: "rgba(255,202,40,0.1)",  border: "rgba(255,202,40,0.4)",  label: "Heads up!" },
  warning: { emoji: "😮", color: "#ff7043", bg: "rgba(255,112,67,0.1)",  border: "rgba(255,112,67,0.4)",  label: "Hey there!" },
  break:   { emoji: "☕", color: "#66bb6a", bg: "rgba(102,187,106,0.1)", border: "rgba(102,187,106,0.4)", label: "Take a break!" },
};

const RealtimeAlert = ({ alert, breakDue, onDismiss, onDismissBreak }) => {
  const active = breakDue
    ? { type: "break", message: "You've been reading for a while — take a 5 minute break. You're doing great! 🌟" }
    : alert;

  if (!active) return null;

  const type = active.type ?? "info";
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const isBreak = !!breakDue;

  return (
    <div
      className="realtime-alert"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <span className="alert-icon" style={{ fontSize: "2rem" }}>{cfg.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: cfg.color, marginBottom: 2 }}>
          {cfg.label}
        </div>
        <span className="alert-msg">{active.message}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isBreak && (
          <button
            style={{
              background: cfg.color, color: "white",
              border: "none", borderRadius: "30px",
              fontFamily: "var(--font-display)", fontSize: "0.85rem",
              padding: "6px 16px", cursor: "pointer",
            }}
            onClick={onDismissBreak}
          >
            OK, I'll rest! ☕
          </button>
        )}
        <button
          className="alert-dismiss"
          onClick={isBreak ? onDismissBreak : onDismiss}
          title="Dismiss"
        >✕</button>
      </div>
    </div>
  );
};

export default RealtimeAlert;
