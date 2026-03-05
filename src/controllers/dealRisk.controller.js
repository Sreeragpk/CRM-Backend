// controllers/dealRisk.controller.js
import prisma from "../utils/prisma.js";
import {
  computeDealRisk,
  getDealRisk,
  getTopRiskDeals,
} from "../services/analytics/dealRisk.service.js";
import { generateDealRiskAI } from "../services/analytics/dealRiskAI.service.js";

/**
 * GET /api/analytics/deal-risk/:dealId
 * Hybrid response: Rule-based metrics + AI explanation
 */
export const getDealRiskByDealId = async (req, res) => {
  try {
    const { dealId } = req.params;

    // Always recompute to ensure freshness
    const risk = await computeDealRisk(dealId);

    if (!risk) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        dealName: true,
        stage: true,
        amount: true,
      },
    });

    // Optional AI layer
    const aiInsight = await generateDealRiskAI({
      deal,
      risk,
    });

    return res.status(200).json({
      success: true,
      data: {
        score: risk.score,
        riskLevel: risk.riskLevel,

        // 🔹 System metrics (deterministic)
        metrics: risk.factors,

        // 🔹 System-generated playbook
        systemPlaybook: risk.playbook,

        // 🔹 AI explainability layer (optional)
        ai: aiInsight,
      },
    });
  } catch (error) {
    console.error("getDealRiskByDealId error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deal risk",
    });
  }
};

/**
 * GET /api/analytics/deal-risk
 * Optional query: ?level=LOW|MEDIUM|HIGH|CRITICAL
 */
export const getTopRiskDealsController = async (req, res) => {
  try {
    const { level } = req.query;

    const risks = await getTopRiskDeals(level);

    return res.status(200).json({
      success: true,
      data: risks,
    });
  } catch (error) {
    console.error("getTopRiskDealsController error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch risky deals",
    });
  }
};

/**
 * POST /api/analytics/deal-risk/recalculate
 * Admin / Manager endpoint
 */
export const recalculateDealRiskController = async (req, res) => {
  try {
    const activeDeals = await prisma.deal.findMany({
      where: {
        stage: {
          notIn: [
            "CLOSED_WON",
            "CLOSED_LOST",
            "CLOSED_LOST_TO_COMPETITION",
          ],
        },
      },
      select: { id: true },
    });

    for (const deal of activeDeals) {
      await computeDealRisk(deal.id);
    }

    return res.status(200).json({
      success: true,
      message: "Deal risk recalculation completed",
      count: activeDeals.length,
    });
  } catch (error) {
    console.error("recalculateDealRiskController error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to recalculate deal risks",
    });
  }
};