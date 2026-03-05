// import { Router } from "express";
// import {
//   getDashboardAnalytics,
//   getDealsByStage,
//   getMonthlyTrend,
//   getTopPerformers,
//   getDealsBySource,
//   getRecentActivities,
//   // getDealsByIndustry,
// } from "../controllers/analytics.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";

// const router = Router();

// router.use(protect);

// router.get("/dashboard", getDashboardAnalytics);
// router.get("/deals-by-stage", getDealsByStage);
// router.get("/monthly-trend", getMonthlyTrend);
// router.get("/top-performers", getTopPerformers);
// router.get("/deals-by-source", getDealsBySource);
// router.get("/recent-activities", getRecentActivities);
// // router.get("/deals-by-industry", getDealsByIndustry);

// export default router;
// routes/analytics.routes.js
import { Router } from "express";
import {
  getDashboardAnalytics,
  getDealsByStage,
  getMonthlyTrend,
  getTopPerformers,
  getDealsBySource,
  getRecentActivities,
  // getDealsByIndustry,
  getLeadSourceCohort,
  getFunnelAnalytics,
  getRiskDistribution,
  getStageAgingAnalytics,
  getRiskDeals,
  getStageDeals,

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
// router.get("/deals-by-industry", getDealsByIndustry);
router.get("/cohort-lead-source", getLeadSourceCohort);
router.get("/funnel", getFunnelAnalytics);
router.get("/risk-distribution", getRiskDistribution);
router.get("/stage-aging", getStageAgingAnalytics);
router.get("/risk-deals", getRiskDeals);
router.get("/stage-deals", getStageDeals);

export default router;           


