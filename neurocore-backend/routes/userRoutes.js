import express from "express";
import { createUser, getUsers, getProfile, updateProfile, joinClassroom } from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id/profile", getProfile);
router.patch("/:id/profile", updateProfile);
router.patch("/:id/join-classroom", joinClassroom);

export default router;