import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/ApiError.js";

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Total counts
  const [totalAccounts, totalContacts, totalDeals] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),
  ]);

  // Deal statistics
  const dealStats = await prisma.deal.aggregate({
    _sum: { amount: true, expectedRevenue: true },
    _avg: { amount: true, probability: true },
    _count: { id: true },
  });

  // Won deals
  const wonDeals = await prisma.deal.aggregate({
    where: { stage: "CLOSED_WON" },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Lost deals
  const lostDeals = await prisma.deal.aggregate({
    where: { stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] } },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Open deals (not closed)
  const openDeals = await prisma.deal.aggregate({
    where: {
      stage: {
        notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
      },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // This month's deals
  const thisMonthDeals = await prisma.deal.aggregate({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Last month's deals for comparison
  const lastMonthDeals = await prisma.deal.aggregate({
    where: {
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // This month's won deals
  const thisMonthWon = await prisma.deal.aggregate({
    where: {
      stage: "CLOSED_WON",
      updatedAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Deals closing this month
  const dealsClosingThisMonth = await prisma.deal.findMany({
    where: {
      closingDate: { gte: startOfMonth, lte: endOfMonth },
      stage: {
        notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
      },
    },
    include: {
      account: { select: { id: true, accountName: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { closingDate: "asc" },
    take: 10,
  });

  // Calculate win rate
  const closedDealsCount = (wonDeals._count.id || 0) + (lostDeals._count.id || 0);
  const winRate = closedDealsCount > 0
    ? Math.round((wonDeals._count.id / closedDealsCount) * 100)
    : 0;

  // Calculate month-over-month growth
  const lastMonthAmount = lastMonthDeals._sum.amount || 0;
  const thisMonthAmount = thisMonthDeals._sum.amount || 0;
  const monthGrowth = lastMonthAmount > 0
    ? Math.round(((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100)
    : thisMonthAmount > 0 ? 100 : 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalAccounts,
        totalContacts,
        totalDeals,
        totalPipelineValue: dealStats._sum.amount || 0,
        averageDealSize: Math.round(dealStats._avg.amount || 0),
        averageProbability: Math.round(dealStats._avg.probability || 0),
      },
      deals: {
        won: {
          count: wonDeals._count.id || 0,
          amount: wonDeals._sum.amount || 0,
        },
        lost: {
          count: lostDeals._count.id || 0,
          amount: lostDeals._sum.amount || 0,
        },
        open: {
          count: openDeals._count.id || 0,
          amount: openDeals._sum.amount || 0,
        },
        winRate,
      },
      thisMonth: {
        deals: thisMonthDeals._count.id || 0,
        amount: thisMonthDeals._sum.amount || 0,
        wonDeals: thisMonthWon._count.id || 0,
        wonAmount: thisMonthWon._sum.amount || 0,
        growth: monthGrowth,
      },
      dealsClosingThisMonth,
    },
  });
});

// @desc    Get deals by stage
// @route   GET /api/analytics/deals-by-stage
export const getDealsByStage = asyncHandler(async (req, res) => {
  const stages = await prisma.deal.groupBy({
    by: ["stage"],
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _count: { id: "desc" } },
  });

  const stageOrder = [
    "QUALIFICATION",
    "NEEDS_ANALYSIS",
    "VALUE_PROPOSITION",
    "IDENTIFY_DECISION_MAKERS",
    "PROPOSAL_PRICE_QUOTE",
    "NEGOTIATION_REVIEW",
    "CLOSED_WON",
    "CLOSED_LOST",
    "CLOSED_LOST_TO_COMPETITION",
  ];

  const sortedStages = stageOrder.map((stage) => {
    const found = stages.find((s) => s.stage === stage);
    return {
      stage,
      count: found?._count.id || 0,
      amount: found?._sum.amount || 0,
    };
  });

  res.json({ success: true, data: sortedStages });
});

// @desc    Get monthly revenue trend
// @route   GET /api/analytics/monthly-trend
export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const today = new Date();
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

    const [wonDeals, newDeals, lostDeals] = await Promise.all([
      prisma.deal.aggregate({
        where: {
          stage: "CLOSED_WON",
          updatedAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.deal.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.deal.aggregate({
        where: {
          stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
          updatedAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    data.push({
      month: startDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      monthFull: startDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      wonRevenue: wonDeals._sum.amount || 0,
      wonCount: wonDeals._count.id || 0,
      newDeals: newDeals._count.id || 0,
      newAmount: newDeals._sum.amount || 0,
      lostCount: lostDeals._count.id || 0,
      lostAmount: lostDeals._sum.amount || 0,
    });
  }

  res.json({ success: true, data });
});

// @desc    Get top sales performers
// @route   GET /api/analytics/top-performers
export const getTopPerformers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const performers = await prisma.deal.groupBy({
    by: ["dealOwnerId"],
    where: { stage: "CLOSED_WON" },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const performersWithDetails = await Promise.all(
    performers.map(async (p) => {
      const user = await prisma.user.findUnique({
        where: { id: p.dealOwnerId },
        select: { id: true, name: true, email: true, avatar: true },
      });

      const totalDeals = await prisma.deal.count({
        where: { dealOwnerId: p.dealOwnerId },
      });

      const lostDeals = await prisma.deal.count({
        where: {
          dealOwnerId: p.dealOwnerId,
          stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
        },
      });

      const closedDeals = p._count.id + lostDeals;
      const winRate = closedDeals > 0 ? Math.round((p._count.id / closedDeals) * 100) : 0;

      return {
        user,
        wonDeals: p._count.id,
        wonAmount: p._sum.amount || 0,
        totalDeals,
        winRate,
      };
    })
  );

  res.json({ success: true, data: performersWithDetails });
});

// @desc    Get deals by lead source
// @route   GET /api/analytics/deals-by-source
export const getDealsBySource = asyncHandler(async (req, res) => {
  const sources = await prisma.deal.groupBy({
    by: ["leadSource"],
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Get won deals by source
  const wonBySource = await prisma.deal.groupBy({
    by: ["leadSource"],
    where: { stage: "CLOSED_WON" },
    _count: { id: true },
    _sum: { amount: true },
  });

  const data = sources.map((s) => {
    const won = wonBySource.find((w) => w.leadSource === s.leadSource);
    const winRate = s._count.id > 0 && won
      ? Math.round((won._count.id / s._count.id) * 100)
      : 0;

    return {
      source: s.leadSource || "Unknown",
      totalDeals: s._count.id,
      totalAmount: s._sum.amount || 0,
      wonDeals: won?._count.id || 0,
      wonAmount: won?._sum.amount || 0,
      winRate,
    };
  });

  res.json({ success: true, data });
});

// @desc    Get recent activities
// @route   GET /api/analytics/recent-activities
export const getRecentActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const [recentDeals, recentContacts, recentAccounts] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        account: { select: { id: true, accountName: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        account: { select: { id: true, accountName: true } },
      },
    }),
    prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        owner: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      recentDeals,
      recentContacts,
      recentAccounts,
    },
  });
});

// @desc    Get deals by industry
// @route   GET /api/analytics/deals-by-industry
export const getDealsByIndustry = asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    include: {
      account: { select: { industry: true } },
    },
  });

  const industryMap = {};

  deals.forEach((deal) => {
    const industry = deal.account?.industry || "Unknown";
    if (!industryMap[industry]) {
      industryMap[industry] = {
        industry,
        totalDeals: 0,
        totalAmount: 0,
        wonDeals: 0,
        wonAmount: 0,
      };
    }
    industryMap[industry].totalDeals++;
    industryMap[industry].totalAmount += deal.amount || 0;

    if (deal.stage === "CLOSED_WON") {
      industryMap[industry].wonDeals++;
      industryMap[industry].wonAmount += deal.amount || 0;
    }
  });

  const data = Object.values(industryMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  res.json({ success: true, data });
});