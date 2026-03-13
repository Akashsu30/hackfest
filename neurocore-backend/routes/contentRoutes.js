import express from "express";
import { transformText, simplifyChunk, askDoubt } from "../controllers/contentController.js";

const router = express.Router();

router.post("/transform", transformText);
router.post("/simplify", simplifyChunk);
router.post("/doubt",    askDoubt);

export default router;
