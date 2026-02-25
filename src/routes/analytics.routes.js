import { Router } from "express";
import {
  getDashboardAnalytics,
  getDealsByStage,
  getMonthlyTrend,
  getTopPerformers,
  getDealsBySource,
  getRecentActivities,
  getDealsByIndustry,
} from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/dashboard", getDashboardAnalytics);
router.get("/deals-by-stage", getDealsByStage);
router.get("/monthly-trend", getMonthlyTrend);
router.get("/top-performers", getTopPerformers);
router.get("/deals-by-source", getDealsBySource);
router.get("/recent-activities", getRecentActivities);
router.get("/deals-by-industry", getDealsByIndustry);

export default router;