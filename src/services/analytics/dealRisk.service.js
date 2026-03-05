// CRM-Backend-main/CRM-Backend-main/src/services/analytics/dealRisk.service.js

import prisma from "../../utils/prisma.js";

/**
 * Risk Scoring Rules (Explainable & Deterministic)
 *
 * Factors considered:
 * 1. Days in current stage
 * 2. Days since last activity (task update or deal update)
 * 3. Probability
 * 4. Closing date proximity
 */

function calculateRiskLevel(score) {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function generatePlaybook(factors) {
  const actions = [];

  if (factors.daysInStage > 14) {
    actions.push("Deal stuck in stage >14 days — schedule review meeting");
  }

  if (factors.lastActivityDays > 7) {
    actions.push("No recent activity — contact customer immediately");
  }

  if (factors.probability && factors.probability < 50) {
    actions.push("Low probability — re-qualify opportunity");
  }

  if (factors.closingInDays <= 7) {
    actions.push("Closing date near — confirm purchase readiness");
  }

  if (actions.length === 0) {
    actions.push("Deal progressing normally — maintain momentum");
  }

  return actions;
}

export async function computeDealRisk(dealId) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      tasks: true,
      stageHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  // Ignore closed deals
  if (
    deal.stage === "CLOSED_WON" ||
    deal.stage === "CLOSED_LOST" ||
    deal.stage === "CLOSED_LOST_TO_COMPETITION"
  ) {
    return null;
  }

  const now = new Date();

  // 1️⃣ Days in current stage
  let stageStartDate =
    deal.stageHistory.length > 0
      ? deal.stageHistory[0].createdAt
      : deal.createdAt;

  const daysInStage = Math.floor(
    (now - new Date(stageStartDate)) / (1000 * 60 * 60 * 24)
  );

  // 2️⃣ Last activity days (task update or deal update)
  const latestTask = deal.tasks.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  )[0];

  const lastActivityDate = latestTask
    ? latestTask.updatedAt
    : deal.updatedAt;

  const lastActivityDays = Math.floor(
    (now - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24)
  );

  // 3️⃣ Probability
  const probability = deal.probability || 0;

  // 4️⃣ Closing proximity
  const closingInDays = Math.floor(
    (new Date(deal.closingDate) - now) / (1000 * 60 * 60 * 24)
  );

  // 🎯 SCORING MODEL (max 100)
  let score = 0;

  if (daysInStage > 30) score += 30;
  else if (daysInStage > 14) score += 20;
  else if (daysInStage > 7) score += 10;

  if (lastActivityDays > 14) score += 30;
  else if (lastActivityDays > 7) score += 20;
  else if (lastActivityDays > 3) score += 10;

  if (probability < 40) score += 20;
  else if (probability < 60) score += 10;

  if (closingInDays <= 7) score += 20;

  if (score > 100) score = 100;

  const factors = {
    daysInStage,
    lastActivityDays,
    probability,
    closingInDays,
  };

  const riskLevel = calculateRiskLevel(score);
  const playbook = generatePlaybook(factors);

  // Store snapshot
  const riskRecord = await prisma.dealRisk.upsert({
    where: { dealId },
    update: {
      score,
      riskLevel,
      factors,
      playbook,
      lastCalculatedAt: new Date(),
    },
    create: {
      dealId,
      score,
      riskLevel,
      factors,
      playbook,
    },
  });

  // Store history
  await prisma.dealRiskHistory.create({
    data: {
      dealId,
      score,
      riskLevel,
      factors,
    },
  });

  return riskRecord;
}

export async function getDealRisk(dealId) {
  return prisma.dealRisk.findUnique({
    where: { dealId },
  });
}

export async function getTopRiskDeals(level) {
  return prisma.dealRisk.findMany({
    where: level ? { riskLevel: level } : undefined,
    orderBy: { score: "desc" },
    include: {
      deal: {
        select: {
          id: true,
          dealName: true,
          stage: true,
          amount: true,
        },
      },
    },
    take: 10,
  });
}