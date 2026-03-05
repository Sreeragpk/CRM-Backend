// CRM-Backend-main/CRM-Backend-main/src/routes/dealRisk.routes.js

import express from "express";
import {
  getDealRiskByDealId,
  getTopRiskDealsController,
  recalculateDealRiskController,
} from "../controllers/dealRisk.controller.js";

const router = express.Router();

/**
 * GET /api/analytics/deal-risk/:dealId
 * Get risk snapshot for a single deal
 */
router.get("/deal-risk/:dealId", getDealRiskByDealId);

/**
 * GET /api/analytics/deal-risk
 * Optional query: ?level=LOW|MEDIUM|HIGH|CRITICAL
 */
router.get("/deal-risk", getTopRiskDealsController);

/**
 * POST /api/analytics/deal-risk/recalculate
 * Admin / Manager only (middleware can be added)
 */
router.post("/deal-risk/recalculate", recalculateDealRiskController);

export default router;