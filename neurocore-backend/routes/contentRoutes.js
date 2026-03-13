import express from "express";
import { transformText, simplifyChunk } from "../controllers/contentController.js";

const router = express.Router();

router.post("/transform", transformText);
router.post("/simplify", simplifyChunk);

export default router;