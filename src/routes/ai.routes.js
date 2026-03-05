// src/routes/ai.routes.js

import express from "express";
import { askAI, askAnalyticsAI } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/ask", askAI);
router.post("/analytics", askAnalyticsAI); // 🔥 NEW ROUTE

export default router;