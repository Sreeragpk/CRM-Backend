// src/ai/salesInsights.service.js

import prisma from "../utils/prisma.js";

// In-memory cache
let cachedInsights = null;
let lastFetchedAt = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getSalesInsights() {
  if (cachedInsights && Date.now() - lastFetchedAt < CACHE_TTL) {
    return cachedInsights;
  }

  const deals = await prisma.deal.findMany({
    select: {
      stage: true,
      amount: true,
      dealOwnerId: true,
    },
  });

  const totalDeals = deals.length;

  let closedWon = 0;
  let closedLost = 0;
  let openDeals = 0;
  let totalPipelineValue = 0;

  const dealsByStage = {};
  const performerMap = {};

  for (const d of deals) {
    dealsByStage[d.stage] = (dealsByStage[d.stage] || 0) + 1;

    if (d.stage === "CLOSED_WON") {
      closedWon++;
      performerMap[d.dealOwnerId] =
        (performerMap[d.dealOwnerId] || 0) + 1;
    } else if (d.stage === "CLOSED_LOST") {
      closedLost++;
    } else {
      openDeals++;
      totalPipelineValue += d.amount || 0;
    }
  }

  const winRate =
    totalDeals > 0
      ? Math.round((closedWon / totalDeals) * 100)
      : 0;

  const topPerformers = Object.entries(performerMap).map(
    ([id, dealsWon]) => ({
      id,
      dealsWon,
    })
  );

  const result = {
    totalDeals,
    openDeals,
    closedWon,
    closedLost,
    winRate,
    totalPipelineValue,
    dealsByStage,
    topPerformers,
  };

  cachedInsights = result;
  lastFetchedAt = Date.now();

  return result;
}