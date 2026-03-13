import express from "express";
import {
  registerTeacher,
  loginTeacher,
  getClassroom,
  getStudentReport,
  getClassroomAnalytics,
  exportClassroomCSV,
  validateClassroomCode,
} from "../controllers/teacherController.js";
import { requireTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerTeacher);
router.post("/login", loginTeacher);
router.get("/validate-code/:code", validateClassroomCode);

router.get("/classroom", requireTeacher, getClassroom);
router.get("/classroom/analytics", requireTeacher, getClassroomAnalytics);
router.get("/classroom/export", requireTeacher, exportClassroomCSV);
router.get("/students/:studentId/report", requireTeacher, getStudentReport);

export default router;