import express from "express";
import {
  analyzeTextDifficulty,
  analyzeChunkLoad,
  getDriftPrediction,
  getPacingSuggestion,
} from "../controllers/intelligenceController.js";

const router = express.Router();

router.post("/difficulty", analyzeTextDifficulty);
router.post("/chunk-load", analyzeChunkLoad);
router.get("/drift/:sessionId", getDriftPrediction);
router.post("/pacing/:sessionId", getPacingSuggestion);

export default router;