import express from "express";
import { analyzeSession } from "../controllers/metricsController.js";

const router = express.Router();

router.get("/:sessionId", analyzeSession);

export default router;