import express from "express";
import {
  logInteraction,
  getSessionInteractions
} from "../controllers/interactionController.js";

const router = express.Router();

router.post("/log", logInteraction);
router.get("/session/:id", getSessionInteractions);

export default router;