import { useState } from "react";

const STEPS = [
  {
    id: "welcome",
    emoji: "👋",
    mascot: "🧠",
    title: "Welcome to NeuroCore!",
    subtitle: "Your reading adventure starts here.",
    content: "NeuroCore is your super smart reading buddy! It watches how you read and automatically changes things to make reading easier and more fun, just for you.",
    action: "Let's Go! 🚀",
    color: "#ff7043",
  },
  {
    id: "chunks",
    emoji: "🧩",
    mascot: "📖",
    title: "Chunked Reading",
    subtitle: "Bite-sized pieces are easier!",
    content: "Instead of giant walls of text, NeuroCore breaks things into small, friendly chunks. Use arrow keys or click to move through them one at a time. Easy peasy!",
    action: "Got it! ➡️",
    color: "#42a5f5",
  },
  {
    id: "modes",
    emoji: "🎮",
    mascot: "⭐",
    title: "Your Superpower Controls",
    subtitle: "Built for ADHD, Dyslexia, and YOU.",
    content: "Focus Mode shows one chunk at a time. Reading Ruler highlights where you are. Dyslexia font makes letters clearer. Toggle them on and off anytime!",
    action: "Awesome! 🌟",
    color: "#ab47bc",
  },
  {
    id: "adaptation",
    emoji: "🤖",
    mascot: "⚡",
    title: "I Watch & Help You!",
    subtitle: "The system learns as you read.",
    content: "NeuroCore notices if you're getting tired or distracted. When it does, it automatically adjusts to help you focus again. It's like having a reading coach!",
    action: "Cool! 💡",
    color: "#66bb6a",
  },
  {
    id: "profile",
    emoji: "🏆",
    mascot: "🌈",
    title: "Your Cognitive Profile",
    subtitle: "Gets smarter every time you read!",
    content: "After every reading session, NeuroCore remembers what works best for you. Next time you visit, everything is already set up perfectly just for your brain!",
    action: "Start Reading! 🎉",
    color: "#ffca28",
  },
];

/* Animated mascot SVG for each step */
const StepMascot = ({ emoji, color, step }) => (
  <div style={{
    width: 110, height: 110,
    background: `${color}18`,
    border: `4px solid ${color}`,
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "3.5rem",
    margin: "0 auto 16px",
    animation: "bounce-in 0.5s ease, float 3s ease-in-out infinite 0.5s",
    boxShadow: `0 8px 24px ${color}40`,
    position: "relative",
  }}>
    {emoji}
    <span style={{
      position: "absolute",
      top: -8, right: -8,
      fontSize: "1.4rem",
      animation: "twinkle 1.5s ease-in-out infinite",
    }}>✨</span>
  </div>
);

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      setExiting(true);
      setTimeout(onComplete, 300);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    setExiting(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div className={`onboarding-overlay ${exiting ? "exiting" : ""}`}>
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-dots" style={{ justifyContent: "center" }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? "active" : i < step ? "done" : ""}`}
              style={i === step ? { background: current.color } : {}}
            />
          ))}
        </div>

        {/* Mascot */}
        <StepMascot emoji={current.emoji} color={current.color} step={step} />

        <div className="onboarding-content">
          <span className="onboarding-step" style={{ color: current.color }}>
            STEP {step + 1} of {STEPS.length}
          </span>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-subtitle" style={{ color: current.color }}>
            {current.subtitle}
          </p>
          <p className="onboarding-body">{current.content}</p>
        </div>

        <div className="onboarding-actions">
          {!isLast && (
            <button className="onboarding-skip-btn" onClick={skip}>
              Skip for now
            </button>
          )}
          <button
            className="onboarding-next-btn"
            onClick={next}
            style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)` }}
          >
            {current.action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
