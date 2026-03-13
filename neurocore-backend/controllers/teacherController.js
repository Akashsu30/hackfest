import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import ChunkInteraction from "../models/ChunkInteraction.js";

const JWT_SECRET = process.env.JWT_SECRET || "neurocore_secret";

export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, classroomName } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password required" });

    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const classroomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const teacher = await Teacher.create({
      name, email, passwordHash,
      classroomName: classroomName ?? "My Classroom",
      classroomCode,
    });

    const token = jwt.sign({ teacherId: teacher._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        classroomName: teacher.classroomName,
        classroomCode: teacher.classroomCode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await teacher.verifyPassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ teacherId: teacher._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        classroomName: teacher.classroomName,
        classroomCode: teacher.classroomCode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getClassroom = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    const students = await User.find({ classroomCode: teacher.classroomCode });

    const studentSummaries = await Promise.all(
      students.map(async (s) => {
        const sessions = await Session.find({ userId: s._id }).sort({ startTime: -1 }).limit(5);
        return {
          _id: s._id,
          name: s.name,
          totalSessions: s.totalSessions,
          baselineProfile: s.baselineProfile,
          recentSessions: sessions.length,
          lastActive: sessions[0]?.startTime ?? null,
        };
      })
    );

    res.json({
      teacher: {
        name: teacher.name,
        classroomName: teacher.classroomName,
        classroomCode: teacher.classroomCode,
      },
      students: studentSummaries,
      totalStudents: studentSummaries.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const sessions = await Session.find({ userId: studentId }).sort({ startTime: -1 });

    const sessionDetails = await Promise.all(
      sessions.map(async (session) => {
        const interactions = await ChunkInteraction.find({ sessionId: session._id });
        const totalChunks = interactions.length;
        if (totalChunks === 0) return { sessionId: session._id, startTime: session.startTime, totalChunks: 0 };

        const avgTime = interactions.reduce((s, i) => s + i.timeSpent, 0) / totalChunks;
        const avgPauses = interactions.reduce((s, i) => s + i.microPauses, 0) / totalChunks;
        const avgRereads = interactions.reduce((s, i) => s + i.rereadCount, 0) / totalChunks;
        const duration = session.endTime
          ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
          : null;

        return {
          sessionId: session._id,
          startTime: session.startTime,
          duration,
          totalChunks,
          avgChunkTime: parseFloat(avgTime.toFixed(2)),
          avgPauses: parseFloat(avgPauses.toFixed(2)),
          avgRereads: parseFloat(avgRereads.toFixed(2)),
        };
      })
    );

    res.json({ student, sessions: sessionDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getClassroomAnalytics = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) return res.status(404).json({ error: "Not found" });

    const students = await User.find({ classroomCode: teacher.classroomCode });
    if (students.length === 0) return res.json({ message: "No students yet", analytics: null });

    const profiles = students.map((s) => s.baselineProfile);
    const avg = (key) =>
      parseFloat((profiles.reduce((s, p) => s + (p[key] ?? 0), 0) / profiles.length).toFixed(2));

    const rhythmCounts = profiles.reduce((acc, p) => {
      const r = p.dominantRhythm ?? "steady";
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});

    const audioUsers = profiles.filter((p) => p.audioPreference).length;

    res.json({
      totalStudents: students.length,
      analytics: {
        avgReadingSpeed: avg("avgReadingSpeed"),
        avgFatigueSensitivity: avg("fatigueSensitivityScore"),
        avgDistractionScore: avg("distractionSensitivityScore"),
        avgRereadDensity: avg("avgRereadDensity"),
        avgPreferredChunkSize: avg("preferredChunkSize"),
        rhythmDistribution: rhythmCounts,
        audioPreferenceCount: audioUsers,
        audioPreferencePct: parseFloat(((audioUsers / students.length) * 100).toFixed(1)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportClassroomCSV = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) return res.status(404).json({ error: "Not found" });

    const students = await User.find({ classroomCode: teacher.classroomCode });

    const rows = students.map((s) => {
      const p = s.baselineProfile;
      return [
        s.name,
        s.totalSessions,
        p.avgReadingSpeed?.toFixed(2),
        p.fatigueSensitivityScore?.toFixed(2),
        p.distractionSensitivityScore?.toFixed(2),
        p.avgRereadDensity?.toFixed(2),
        p.preferredChunkSize,
        p.dominantRhythm,
        p.audioPreference ? "Yes" : "No",
      ].join(",");
    });

    const csv = [
      "Name,Total Sessions,Avg Reading Speed,Fatigue Score,Distraction Score,Avg Rereads,Preferred Chunk Size,Rhythm,Audio Preference",
      ...rows,
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${teacher.classroomName}-report.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Fix: validate classroom code exists before joining ────
export const validateClassroomCode = async (req, res) => {
  try {
    const { code } = req.params;
    const teacher = await Teacher.findOne({ classroomCode: code.toUpperCase() });
    if (!teacher) return res.status(404).json({ error: "Invalid classroom code" });
    res.json({
      valid: true,
      classroomName: teacher.classroomName,
      teacherName: teacher.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};