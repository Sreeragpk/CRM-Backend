// src/ai/advancedAnalytics.service.js

import prisma from "../utils/prisma.js";

export async function getAdvancedAnalyticsSnapshot() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Summary
  const totalDeals = await prisma.deal.count();

  const wonDeals = await prisma.deal.count({
    where: { stage: "CLOSED_WON" },
  });

  const openDeals = await prisma.deal.count({
    where: {
      stage: {
        notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
      },
    },
  });

  const monthlyWon = await prisma.deal.aggregate({
    where: {
      stage: "CLOSED_WON",
      updatedAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const winRate =
    totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

  return {
    totalDeals,
    openDeals,
    wonDeals,
    winRate,
    monthlyWonAmount: monthlyWon._sum.amount || 0,
    monthlyWonCount: monthlyWon._count.id || 0,
  };
}