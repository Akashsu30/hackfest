import express from "express";
import { startSession, endSession, getSession } from "../controllers/sessionController.js";

const router = express.Router();

router.post("/start", startSession);
router.patch("/end/:id", endSession);
router.get("/:id", getSession);

export default router;