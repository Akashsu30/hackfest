import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import adaptationRoutes from "./routes/adaptationRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import intelligenceRoutes from "./routes/intelligenceRoutes.js";
import sdkRoutes from "./routes/sdkRoutes.js";

import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/adaptation", adaptationRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/sdk", sdkRoutes);

connectDB();


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/", (req, res) => res.send("NeuroCore Backend Running"));