import { useState, useEffect } from "react";

const API = "";

const TeacherDashboard = ({ teacher, authFetch, onLogout }) => {
  const [classroom, setClassroom] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview | analytics | student

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [classRes, analyticsRes] = await Promise.all([
          authFetch(`${API}/api/teachers/classroom`),
          authFetch(`${API}/api/teachers/classroom/analytics`),
        ]);
        if (classRes.ok) setClassroom(await classRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [authFetch]);

  const loadStudentReport = async (studentId) => {
    setSelectedStudent(studentId);
    setView("student");
    try {
      const res = await authFetch(`${API}/api/teachers/students/${studentId}/report`);
      if (res.ok) setStudentReport(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    const res = await authFetch(`${API}/api/teachers/classroom/export`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teacher.classroomName}-report.csv`;
    a.click();
  };

  if (loading) return (
    <div className="dashboard-loading">
      <span className="loading-dot" />
    </div>
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="logo">
            <span className="logo-mark">N</span>
            <span className="logo-text">EUROCORE</span>
          </div>
          <div className="dashboard-title">
            <span className="input-label">TEACHER PORTAL</span>
            <h1>{teacher.classroomName}</h1>
          </div>
          <div className="dashboard-header-right">
            <span className="classroom-code">
              Code: <b>{teacher.classroomCode}</b>
            </span>
            <button className="export-btn" onClick={handleExport}>↓ Export CSV</button>
            <button className="reset-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
        <div className="header-line" />
      </header>

      {/* Nav */}
      <div className="dashboard-nav">
        <button
          className={`dash-nav-btn ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >Students</button>
        <button
          className={`dash-nav-btn ${view === "analytics" ? "active" : ""}`}
          onClick={() => setView("analytics")}
        >Classroom Analytics</button>
        {view === "student" && studentReport && (
          <button className="dash-nav-btn active">
            {studentReport.student?.name ?? "Student"} Report
          </button>
        )}
      </div>

      <main className="dashboard-main">
        {/* Overview */}
        {view === "overview" && classroom && (
          <div className="dashboard-section">
            <div className="section-meta">
              <span className="input-label">STUDENTS</span>
              <span className="section-count">{classroom.totalStudents} enrolled</span>
            </div>

            {classroom.students.length === 0 ? (
              <div className="empty-state">
                <p>No students yet. Share your classroom code <b>{teacher.classroomCode}</b> with students to enroll them.</p>
              </div>
            ) : (
              <div className="student-grid">
                {classroom.students.map((s) => (
                  <div
                    key={s._id}
                    className="student-card"
                    onClick={() => loadStudentReport(s._id)}
                  >
                    <div className="student-card-header">
                      <span className="student-name">{s.name}</span>
                      <span className="student-sessions">{s.totalSessions} sessions</span>
                    </div>
                    <div className="student-stats">
                      <StatMini label="Rhythm" value={s.baselineProfile?.dominantRhythm ?? "—"} />
                      <StatMini label="Fatigue" value={s.baselineProfile?.fatigueSensitivityScore?.toFixed(1) ?? "—"} />
                      <StatMini label="Focus" value={s.baselineProfile?.distractionSensitivityScore?.toFixed(1) ?? "—"} />
                    </div>
                    {s.lastActive && (
                      <div className="student-last-active">
                        Last active: {new Date(s.lastActive).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {view === "analytics" && analytics?.analytics && (
          <div className="dashboard-section">
            <div className="section-meta">
              <span className="input-label">CLASSROOM ANALYTICS</span>
              <span className="section-count">{analytics.totalStudents} students</span>
            </div>

            <div className="analytics-grid">
              <AnalyticCard label="Avg Reading Speed" value={`${analytics.analytics.avgReadingSpeed}s`} sub="per chunk" />
              <AnalyticCard label="Avg Fatigue Score" value={analytics.analytics.avgFatigueSensitivity} sub="lower is better" />
              <AnalyticCard label="Avg Distraction" value={analytics.analytics.avgDistractionScore} sub="lower is better" />
              <AnalyticCard label="Avg Rereads" value={analytics.analytics.avgRereadDensity} sub="per chunk" />
              <AnalyticCard label="Preferred Chunk" value={`${analytics.analytics.avgPreferredChunkSize} sent.`} sub="class average" />
              <AnalyticCard label="Audio Preference" value={`${analytics.analytics.audioPreferencePct}%`} sub={`${analytics.analytics.audioPreferenceCount} students`} />
            </div>

            <div className="rhythm-section">
              <span className="input-label">RHYTHM DISTRIBUTION</span>
              <div className="rhythm-bars">
                {Object.entries(analytics.analytics.rhythmDistribution).map(([rhythm, count]) => (
                  <div key={rhythm} className="rhythm-bar-row">
                    <span className="rhythm-bar-label">{rhythm}</span>
                    <div className="rhythm-bar-track">
                      <div
                        className="rhythm-bar-fill"
                        style={{ width: `${(count / analytics.totalStudents) * 100}%` }}
                      />
                    </div>
                    <span className="rhythm-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Report */}
        {view === "student" && studentReport && (
          <div className="dashboard-section">
            <button className="back-btn" onClick={() => setView("overview")}>← Back</button>
            <div className="section-meta">
              <span className="input-label">STUDENT REPORT</span>
              <h2 className="student-report-name">{studentReport.student?.name}</h2>
            </div>

            <div className="report-profile">
              <span className="input-label">COGNITIVE PROFILE</span>
              <div className="analytics-grid">
                <AnalyticCard label="Dominant Rhythm" value={studentReport.student?.baselineProfile?.dominantRhythm ?? "—"} />
                <AnalyticCard label="Avg Reading Speed" value={`${studentReport.student?.baselineProfile?.avgReadingSpeed?.toFixed(1) ?? "—"}s`} />
                <AnalyticCard label="Fatigue Score" value={studentReport.student?.baselineProfile?.fatigueSensitivityScore?.toFixed(2) ?? "—"} />
                <AnalyticCard label="Distraction Score" value={studentReport.student?.baselineProfile?.distractionSensitivityScore?.toFixed(2) ?? "—"} />
                <AnalyticCard label="Preferred Chunks" value={`${studentReport.student?.baselineProfile?.preferredChunkSize ?? 2} sent.`} />
                <AnalyticCard label="Audio Preference" value={studentReport.student?.baselineProfile?.audioPreference ? "Yes" : "No"} />
              </div>
            </div>

            <div className="sessions-table-wrap">
              <span className="input-label">SESSION HISTORY</span>
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Chunks Read</th>
                    <th>Avg Time/Chunk</th>
                    <th>Avg Pauses</th>
                    <th>Avg Rereads</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.sessions.map((s) => (
                    <tr key={s.sessionId}>
                      <td>{new Date(s.startTime).toLocaleDateString()}</td>
                      <td>{s.duration != null ? `${s.duration}m` : "—"}</td>
                      <td>{s.totalChunks}</td>
                      <td>{s.avgChunkTime ?? "—"}s</td>
                      <td>{s.avgPauses ?? "—"}</td>
                      <td>{s.avgRereads ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatMini = ({ label, value }) => (
  <div className="stat-mini">
    <span className="stat-mini-label">{label}</span>
    <span className="stat-mini-value">{value}</span>
  </div>
);

const AnalyticCard = ({ label, value, sub }) => (
  <div className="analytic-card">
    <span className="analytic-label">{label}</span>
    <span className="analytic-value">{value}</span>
    {sub && <span className="analytic-sub">{sub}</span>}
  </div>
);

export default TeacherDashboard;