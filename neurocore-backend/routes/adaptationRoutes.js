import express from "express";
import { getAdaptation } from "../controllers/adaptationController.js";

const router = express.Router();

router.get("/:sessionId", getAdaptation);

export default router;