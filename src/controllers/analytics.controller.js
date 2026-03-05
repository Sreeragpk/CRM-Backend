// import prisma from "../utils/prisma.js";
// import { asyncHandler } from "../utils/ApiError.js";

// // @desc    Get dashboard analytics
// // @route   GET /api/analytics/dashboard
// export const getDashboardAnalytics = asyncHandler(async (req, res) => {
//   const today = new Date();
//   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//   const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//   const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//   const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

//   // Total counts
//   const [totalAccounts, totalContacts, totalDeals] = await Promise.all([
//     prisma.account.count(),
//     prisma.contact.count(),
//     prisma.deal.count(),
//   ]);

//   // Deal statistics
//   const dealStats = await prisma.deal.aggregate({
//     _sum: { amount: true, expectedRevenue: true },
//     _avg: { amount: true, probability: true },
//     _count: { id: true },
//   });

//   // Won deals
//   const wonDeals = await prisma.deal.aggregate({
//     where: { stage: "CLOSED_WON" },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Lost deals
//   const lostDeals = await prisma.deal.aggregate({
//     where: { stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] } },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Open deals (not closed)
//   const openDeals = await prisma.deal.aggregate({
//     where: {
//       stage: {
//         notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
//       },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // This month's deals
//   const thisMonthDeals = await prisma.deal.aggregate({
//     where: {
//       createdAt: { gte: startOfMonth, lte: endOfMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Last month's deals for comparison
//   const lastMonthDeals = await prisma.deal.aggregate({
//     where: {
//       createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // This month's won deals
//   const thisMonthWon = await prisma.deal.aggregate({
//     where: {
//       stage: "CLOSED_WON",
//       updatedAt: { gte: startOfMonth, lte: endOfMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Deals closing this month
//   const dealsClosingThisMonth = await prisma.deal.findMany({
//     where: {
//       closingDate: { gte: startOfMonth, lte: endOfMonth },
//       stage: {
//         notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
//       },
//     },
//     include: {
//       account: { select: { id: true, accountName: true } },
//       owner: { select: { id: true, name: true } },
//     },
//     orderBy: { closingDate: "asc" },
//     take: 10,
//   });

//   // Calculate win rate
//   const closedDealsCount = (wonDeals._count.id || 0) + (lostDeals._count.id || 0);
//   const winRate = closedDealsCount > 0
//     ? Math.round((wonDeals._count.id / closedDealsCount) * 100)
//     : 0;

//   // Calculate month-over-month growth
//   const lastMonthAmount = lastMonthDeals._sum.amount || 0;
//   const thisMonthAmount = thisMonthDeals._sum.amount || 0;
//   const monthGrowth = lastMonthAmount > 0
//     ? Math.round(((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100)
//     : thisMonthAmount > 0 ? 100 : 0;

//   res.json({
//     success: true,
//     data: {
//       summary: {
//         totalAccounts,
//         totalContacts,
//         totalDeals,
//         totalPipelineValue: dealStats._sum.amount || 0,
//         averageDealSize: Math.round(dealStats._avg.amount || 0),
//         averageProbability: Math.round(dealStats._avg.probability || 0),
//       },
//       deals: {
//         won: {
//           count: wonDeals._count.id || 0,
//           amount: wonDeals._sum.amount || 0,
//         },
//         lost: {
//           count: lostDeals._count.id || 0,
//           amount: lostDeals._sum.amount || 0,
//         },
//         open: {
//           count: openDeals._count.id || 0,
//           amount: openDeals._sum.amount || 0,
//         },
//         winRate,
//       },
//       thisMonth: {
//         deals: thisMonthDeals._count.id || 0,
//         amount: thisMonthDeals._sum.amount || 0,
//         wonDeals: thisMonthWon._count.id || 0,
//         wonAmount: thisMonthWon._sum.amount || 0,
//         growth: monthGrowth,
//       },
//       dealsClosingThisMonth,
//     },
//   });
// });

// // @desc    Get deals by stage
// // @route   GET /api/analytics/deals-by-stage
// export const getDealsByStage = asyncHandler(async (req, res) => {
//   const stages = await prisma.deal.groupBy({
//     by: ["stage"],
//     _count: { id: true },
//     _sum: { amount: true },
//     orderBy: { _count: { id: "desc" } },
//   });

//   const stageOrder = [
//      "RFQ",
//   "VISIT_MEETING",
//   "PREVIEW",
//   "REGRETTED",
//   "TECHNICAL_PROPOSAL",
//   "COMMERCIAL_PROPOSAL",
//   "REVIEW_FEEDBACK",
//   "MOVED_TO_PURCHASE",
//   "NEGOTIATION",
//   "CLOSED_WON",
//   "CLOSED_LOST",
//   "CLOSED_LOST_TO_COMPETITION",
//   ];

//   const sortedStages = stageOrder.map((stage) => {
//     const found = stages.find((s) => s.stage === stage);
//     return {
//       stage,
//       count: found?._count.id || 0,
//       amount: found?._sum.amount || 0,
//     };
//   });

//   res.json({ success: true, data: sortedStages });
// });

// // @desc    Get monthly revenue trend
// // @route   GET /api/analytics/monthly-trend
// export const getMonthlyTrend = asyncHandler(async (req, res) => {
//   const months = parseInt(req.query.months) || 6;
//   const today = new Date();
//   const data = [];

//   for (let i = months - 1; i >= 0; i--) {
//     const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
//     const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

//     const [wonDeals, newDeals, lostDeals] = await Promise.all([
//       prisma.deal.aggregate({
//         where: {
//           stage: "CLOSED_WON",
//           updatedAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//       prisma.deal.aggregate({
//         where: {
//           createdAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//       prisma.deal.aggregate({
//         where: {
//           stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
//           updatedAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//     ]);

//     data.push({
//       month: startDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
//       monthFull: startDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
//       wonRevenue: wonDeals._sum.amount || 0,
//       wonCount: wonDeals._count.id || 0,
//       newDeals: newDeals._count.id || 0,
//       newAmount: newDeals._sum.amount || 0,
//       lostCount: lostDeals._count.id || 0,
//       lostAmount: lostDeals._sum.amount || 0,
//     });
//   }

//   res.json({ success: true, data });
// });

// // @desc    Get top sales performers
// // @route   GET /api/analytics/top-performers
// export const getTopPerformers = asyncHandler(async (req, res) => {
//   const limit = parseInt(req.query.limit) || 5;

//   const performers = await prisma.deal.groupBy({
//     by: ["dealOwnerId"],
//     where: { stage: "CLOSED_WON" },
//     _sum: { amount: true },
//     _count: { id: true },
//     orderBy: { _sum: { amount: "desc" } },
//     take: limit,
//   });

//   const performersWithDetails = await Promise.all(
//     performers.map(async (p) => {
//       const user = await prisma.user.findUnique({
//         where: { id: p.dealOwnerId },
//         select: { id: true, name: true, email: true, avatar: true },
//       });

//       const totalDeals = await prisma.deal.count({
//         where: { dealOwnerId: p.dealOwnerId },
//       });

//       const lostDeals = await prisma.deal.count({
//         where: {
//           dealOwnerId: p.dealOwnerId,
//           stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
//         },
//       });

//       const closedDeals = p._count.id + lostDeals;
//       const winRate = closedDeals > 0 ? Math.round((p._count.id / closedDeals) * 100) : 0;

//       return {
//         user,
//         wonDeals: p._count.id,
//         wonAmount: p._sum.amount || 0,
//         totalDeals,
//         winRate,
//       };
//     })
//   );

//   res.json({ success: true, data: performersWithDetails });
// });

// // @desc    Get deals by lead source
// // @route   GET /api/analytics/deals-by-source
// export const getDealsBySource = asyncHandler(async (req, res) => {
//   const sources = await prisma.deal.groupBy({
//     by: ["leadSource"],
//     _count: { id: true },
//     _sum: { amount: true },
//     orderBy: { _count: { id: "desc" } },
//   });

//   // Get won deals by source
//   const wonBySource = await prisma.deal.groupBy({
//     by: ["leadSource"],
//     where: { stage: "CLOSED_WON" },
//     _count: { id: true },
//     _sum: { amount: true },
//   });

//   const data = sources.map((s) => {
//     const won = wonBySource.find((w) => w.leadSource === s.leadSource);
//     const winRate = s._count.id > 0 && won
//       ? Math.round((won._count.id / s._count.id) * 100)
//       : 0;

//     return {
//       source: s.leadSource || "Unknown",
//       totalDeals: s._count.id,
//       totalAmount: s._sum.amount || 0,
//       wonDeals: won?._count.id || 0,
//       wonAmount: won?._sum.amount || 0,
//       winRate,
//     };
//   });

//   res.json({ success: true, data });
// });

// // @desc    Get recent activities
// // @route   GET /api/analytics/recent-activities
// export const getRecentActivities = asyncHandler(async (req, res) => {
//   const limit = parseInt(req.query.limit) || 10;

//   const [recentDeals, recentContacts, recentAccounts] = await Promise.all([
//     prisma.deal.findMany({
//       orderBy: { updatedAt: "desc" },
//       take: limit,
//       include: {
//         account: { select: { id: true, accountName: true } },
//         owner: { select: { id: true, name: true } },
//       },
//     }),
//     prisma.contact.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 5,
//       include: {
//         account: { select: { id: true, accountName: true } },
//       },
//     }),
//     prisma.account.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 5,
//       include: {
//         owner: { select: { id: true, name: true } },
//       },
//     }),
//   ]);

//   res.json({
//     success: true,
//     data: {
//       recentDeals,
//       recentContacts,
//       recentAccounts,
//     },
//   });
// });

// // @desc    Get deals by industry
// // @route   GET /api/analytics/deals-by-industry
// export const getDealsByIndustry = asyncHandler(async (req, res) => {
//   const deals = await prisma.deal.findMany({
//     include: {
//       account: { select: { industry: true } },
//     },
//   });

//   const industryMap = {};

//   deals.forEach((deal) => {
//     const industry = deal.account?.industry || "Unknown";
//     if (!industryMap[industry]) {
//       industryMap[industry] = {
//         industry,
//         totalDeals: 0,
//         totalAmount: 0,
//         wonDeals: 0,
//         wonAmount: 0,
//       };
//     }
//     industryMap[industry].totalDeals++;
//     industryMap[industry].totalAmount += deal.amount || 0;

//     if (deal.stage === "CLOSED_WON") {
//       industryMap[industry].wonDeals++;
//       industryMap[industry].wonAmount += deal.amount || 0;
//     }
//   });

//   const data = Object.values(industryMap)
//     .sort((a, b) => b.totalAmount - a.totalAmount)
//     .slice(0, 10);

//   res.json({ success: true, data });
// });

// controllers/analytics.controller.js
// controllers/analytics.controller.js
// import prisma from "../utils/prisma.js";
// import { asyncHandler } from "../utils/ApiError.js";
// import { getStageProbability } from "../utils/stageProbability.js";

// // @desc    Get dashboard analytics
// // @route   GET /api/analytics/dashboard
// export const getDashboardAnalytics = asyncHandler(async (req, res) => {
//   const today = new Date();
//   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//   const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//   const startOfLastMonth = new Date(
//     today.getFullYear(),
//     today.getMonth() - 1,
//     1,
//   );
//   const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

//   // Total counts
//   const [totalAccounts, totalContacts, totalDeals] = await Promise.all([
//     prisma.account.count(),
//     prisma.contact.count(),
//     prisma.deal.count(),
//   ]);

//   // Deal statistics
//   const dealStats = await prisma.deal.aggregate({
//     _sum: { amount: true, expectedRevenue: true },
//     _avg: { amount: true, probability: true },
//     _count: { id: true },
//   });

//   // Won deals
//   const wonDeals = await prisma.deal.aggregate({
//     where: { stage: "CLOSED_WON" },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Lost deals
//   const lostDeals = await prisma.deal.aggregate({
//     where: { stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] } },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Open deals (not closed)
//   const openDeals = await prisma.deal.aggregate({
//     where: {
//       stage: {
//         notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
//       },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // This month's deals
//   const thisMonthDeals = await prisma.deal.aggregate({
//     where: {
//       createdAt: { gte: startOfMonth, lte: endOfMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Last month's deals for comparison
//   const lastMonthDeals = await prisma.deal.aggregate({
//     where: {
//       createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // This month's won deals
//   const thisMonthWon = await prisma.deal.aggregate({
//     where: {
//       stage: "CLOSED_WON",
//       updatedAt: { gte: startOfMonth, lte: endOfMonth },
//     },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   // Deals closing this month
//   const dealsClosingThisMonth = await prisma.deal.findMany({
//     where: {
//       closingDate: { gte: startOfMonth, lte: endOfMonth },
//       stage: {
//         notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
//       },
//     },
//     include: {
//       account: { select: { id: true, accountName: true } },
//       owner: { select: { id: true, name: true } },
//     },
//     orderBy: { closingDate: "asc" },
//     take: 10,
//   });

//   // Calculate win rate
//   const closedDealsCount =
//     (wonDeals._count.id || 0) + (lostDeals._count.id || 0);
//   const winRate =
//     closedDealsCount > 0
//       ? Math.round((wonDeals._count.id / closedDealsCount) * 100)
//       : 0;

//   // Calculate month-over-month growth
//   const lastMonthAmount = lastMonthDeals._sum.amount || 0;
//   const thisMonthAmount = thisMonthDeals._sum.amount || 0;
//   const monthGrowth =
//     lastMonthAmount > 0
//       ? Math.round(
//           ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100,
//         )
//       : thisMonthAmount > 0
//         ? 100
//         : 0;

//   res.json({
//     success: true,
//     data: {
//       summary: {
//         totalAccounts,
//         totalContacts,
//         totalDeals,
//         totalPipelineValue: dealStats._sum.amount || 0,
//         averageDealSize: Math.round(dealStats._avg.amount || 0),
//         averageProbability: Math.round(dealStats._avg.probability || 0),
//       },
//       deals: {
//         won: {
//           count: wonDeals._count.id || 0,
//           amount: wonDeals._sum.amount || 0,
//         },
//         lost: {
//           count: lostDeals._count.id || 0,
//           amount: lostDeals._sum.amount || 0,
//         },
//         open: {
//           count: openDeals._count.id || 0,
//           amount: openDeals._sum.amount || 0,
//         },
//         winRate,
//       },
//       thisMonth: {
//         deals: thisMonthDeals._count.id || 0,
//         amount: thisMonthDeals._sum.amount || 0,
//         wonDeals: thisMonthWon._count.id || 0,
//         wonAmount: thisMonthWon._sum.amount || 0,
//         growth: monthGrowth,
//       },
//       dealsClosingThisMonth,
//     },
//   });
// });

// // @desc    Get deals by stage
// // @route   GET /api/analytics/deals-by-stage
// export const getDealsByStage = asyncHandler(async (req, res) => {
//   const stages = await prisma.deal.groupBy({
//     by: ["stage"],
//     _count: { id: true },
//     _sum: { amount: true },
//     orderBy: { _count: { id: "desc" } },
//   });

//   const stageOrder = [
//     "RFQ",
//     "VISIT_MEETING",
//     "PREVIEW",
//     "TECHNICAL_PROPOSAL",
//     "COMMERCIAL_PROPOSAL",
//     "REVIEW_FEEDBACK",
//     "MOVED_TO_PURCHASE",
//     "NEGOTIATION",
//     "CLOSED_WON",
//     "CLOSED_LOST",
//     "CLOSED_LOST_TO_COMPETITION",
//     "REGRETTED",
//   ];

//   const sortedStages = stageOrder.map((stage) => {
//     const found = stages.find((s) => s.stage === stage);
//     return {
//       stage,
//       count: found?._count.id || 0,
//       amount: found?._sum.amount || 0,
//     };
//   });

//   res.json({ success: true, data: sortedStages });
// });

// // @desc    Get monthly revenue trend
// // @route   GET /api/analytics/monthly-trend
// export const getMonthlyTrend = asyncHandler(async (req, res) => {
//   const months = parseInt(req.query.months) || 6;
//   const today = new Date();
//   const data = [];

//   for (let i = months - 1; i >= 0; i--) {
//     const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
//     const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

//     const [wonDeals, newDeals, lostDeals] = await Promise.all([
//       prisma.deal.aggregate({
//         where: {
//           stage: "CLOSED_WON",
//           updatedAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//       prisma.deal.aggregate({
//         where: {
//           createdAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//       prisma.deal.aggregate({
//         where: {
//           stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
//           updatedAt: { gte: startDate, lte: endDate },
//         },
//         _sum: { amount: true },
//         _count: { id: true },
//       }),
//     ]);

//     data.push({
//       month: startDate.toLocaleDateString("en-IN", {
//         month: "short",
//         year: "2-digit",
//       }),
//       monthFull: startDate.toLocaleDateString("en-IN", {
//         month: "long",
//         year: "numeric",
//       }),
//       wonRevenue: wonDeals._sum.amount || 0,
//       wonCount: wonDeals._count.id || 0,
//       newDeals: newDeals._count.id || 0,
//       newAmount: newDeals._sum.amount || 0,
//       lostCount: lostDeals._count.id || 0,
//       lostAmount: lostDeals._sum.amount || 0,
//     });
//   }

//   res.json({ success: true, data });
// });

// // @desc    Get top sales performers
// // @route   GET /api/analytics/top-performers
// export const getTopPerformers = asyncHandler(async (req, res) => {
//   const limit = parseInt(req.query.limit) || 5;

//   const performers = await prisma.deal.groupBy({
//     by: ["dealOwnerId"],
//     where: { stage: "CLOSED_WON" },
//     _sum: { amount: true },
//     _count: { id: true },
//     orderBy: { _sum: { amount: "desc" } },
//     take: limit,
//   });

//   const performersWithDetails = await Promise.all(
//     performers.map(async (p) => {
//       const user = await prisma.user.findUnique({
//         where: { id: p.dealOwnerId },
//         select: { id: true, name: true, email: true, avatar: true },
//       });

//       const totalDeals = await prisma.deal.count({
//         where: { dealOwnerId: p.dealOwnerId },
//       });

//       const lostDeals = await prisma.deal.count({
//         where: {
//           dealOwnerId: p.dealOwnerId,
//           stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
//         },
//       });

//       const closedDeals = p._count.id + lostDeals;
//       const winRate =
//         closedDeals > 0 ? Math.round((p._count.id / closedDeals) * 100) : 0;

//       return {
//         user,
//         wonDeals: p._count.id,
//         wonAmount: p._sum.amount || 0,
//         totalDeals,
//         winRate,
//       };
//     }),
//   );

//   res.json({ success: true, data: performersWithDetails });
// });

// // @desc    Get deals by lead source
// // @route   GET /api/analytics/deals-by-source
// export const getDealsBySource = asyncHandler(async (req, res) => {
//   const sources = await prisma.deal.groupBy({
//     by: ["leadSource"],
//     _count: { id: true },
//     _sum: { amount: true },
//     orderBy: { _count: { id: "desc" } },
//   });

//   // Get won deals by source
//   const wonBySource = await prisma.deal.groupBy({
//     by: ["leadSource"],
//     where: { stage: "CLOSED_WON" },
//     _count: { id: true },
//     _sum: { amount: true },
//   });

//   const data = sources.map((s) => {
//     const won = wonBySource.find((w) => w.leadSource === s.leadSource);
//     const winRate =
//       s._count.id > 0 && won
//         ? Math.round((won._count.id / s._count.id) * 100)
//         : 0;

//     return {
//       source: s.leadSource || "Unknown",
//       totalDeals: s._count.id,
//       totalAmount: s._sum.amount || 0,
//       wonDeals: won?._count.id || 0,
//       wonAmount: won?._sum.amount || 0,
//       winRate,
//     };
//   });

//   res.json({ success: true, data });
// });

// // @desc    Get recent activities
// // @route   GET /api/analytics/recent-activities
// export const getRecentActivities = asyncHandler(async (req, res) => {
//   const limit = parseInt(req.query.limit) || 10;

//   const [recentDeals, recentContacts, recentAccounts] = await Promise.all([
//     prisma.deal.findMany({
//       orderBy: { updatedAt: "desc" },
//       take: limit,
//       include: {
//         account: { select: { id: true, accountName: true } },
//         owner: { select: { id: true, name: true } },
//       },
//     }),
//     prisma.contact.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 5,
//       include: {
//         account: { select: { id: true, accountName: true } },
//       },
//     }),
//     prisma.account.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 5,
//       include: {
//         owner: { select: { id: true, name: true } },
//       },
//     }),
//   ]);

//   res.json({
//     success: true,
//     data: {
//       recentDeals,
//       recentContacts,
//       recentAccounts,
//     },
//   });
// });

// // @desc    Get deals by industry
// // @route   GET /api/analytics/deals-by-industry
// export const getDealsByIndustry = asyncHandler(async (req, res) => {
//   const deals = await prisma.deal.findMany({
//     include: {
//       account: { select: { industry: true } },
//     },
//   });

//   const industryMap = {};

//   deals.forEach((deal) => {
//     const industry = deal.account?.industry || "Unknown";
//     if (!industryMap[industry]) {
//       industryMap[industry] = {
//         industry,
//         totalDeals: 0,
//         totalAmount: 0,
//         wonDeals: 0,
//         wonAmount: 0,
//       };
//     }
//     industryMap[industry].totalDeals++;
//     industryMap[industry].totalAmount += deal.amount || 0;

//     if (deal.stage === "CLOSED_WON") {
//       industryMap[industry].wonDeals++;
//       industryMap[industry].wonAmount += deal.amount || 0;
//     }
//   });

//   const data = Object.values(industryMap)
//     .sort((a, b) => b.totalAmount - a.totalAmount)
//     .slice(0, 10);

//   res.json({ success: true, data });
// });

// // @desc    Lead Source Cohort Analytics
// // @route   GET /api/analytics/cohort-lead-source
// export const getLeadSourceCohort = asyncHandler(async (req, res) => {
//   const deals = await prisma.deal.findMany({
//     include: {
//       account: {
//         select: {
//           id: true,
//           accountName: true,
//         },
//       },
//       owner: {
//         select: {
//           name: true,
//         },
//       },
//     },
//   });

//   const cohortMap = {};

//   deals.forEach((deal) => {
//     const source = deal.leadSource || "Unknown";

//     if (!cohortMap[source]) {
//       cohortMap[source] = {
//         source,
//         totalDeals: 0,
//         wonDeals: 0,
//         totalAmount: 0,
//         totalCloseDays: 0,
//         closedCount: 0,
//         accounts: new Set(),
//         deals: [], // 🔥 ADD DEAL BREAKDOWN
//       };
//     }

//     const cohort = cohortMap[source];

//     cohort.totalDeals++;
//     cohort.totalAmount += deal.amount || 0;
//     cohort.accounts.add(deal.accountId);

//     // 🔥 Push deal details for drilldown
//     cohort.deals.push({
//       dealId: deal.id,
//       dealName: deal.dealName,
//       accountName: deal.account?.accountName || "Unknown",
//       amount: deal.amount || 0,
//       stage: deal.stage,
//       owner: deal.owner?.name || "N/A",
//       createdAt: deal.createdAt,
//     });

//     if (deal.stage === "CLOSED_WON") {
//       cohort.wonDeals++;
//       cohort.closedCount++;

//       const closeDays = Math.floor(
//         (new Date(deal.updatedAt) - new Date(deal.createdAt)) /
//           (1000 * 60 * 60 * 24),
//       );

//       cohort.totalCloseDays += closeDays;
//     }
//   });

//   const result = Object.values(cohortMap).map((c) => {
//     const winRate =
//       c.totalDeals > 0 ? Math.round((c.wonDeals / c.totalDeals) * 100) : 0;

//     const avgDealSize =
//       c.totalDeals > 0 ? Math.round(c.totalAmount / c.totalDeals) : 0;

//     const avgCloseDays =
//       c.closedCount > 0 ? Math.round(c.totalCloseDays / c.closedCount) : 0;

//     const repeatFactor =
//       c.accounts.size > 0 ? c.totalDeals / c.accounts.size : 1;

//     const ltv = Math.round(avgDealSize * repeatFactor);

//     return {
//       source: c.source,
//       totalDeals: c.totalDeals,
//       winRate,
//       avgDealSize,
//       avgCloseDays,
//       ltv,
//       deals: c.deals, // 🔥 SEND DEAL DETAILS
//     };
//   });

//   res.json({ success: true, data: result });
// });
// // @desc    Sales Funnel Conversion
// // @route   GET /api/analytics/funnel
// export const getFunnelAnalytics = asyncHandler(async (req, res) => {
//   const ACTIVE_STAGES = [
//     "RFQ",
//     "VISIT_MEETING",
//     "PREVIEW",
//     "TECHNICAL_PROPOSAL",
//     "COMMERCIAL_PROPOSAL",
//     "REVIEW_FEEDBACK",
//     "MOVED_TO_PURCHASE",
//     "NEGOTIATION",
//   ];

//   const stages = await prisma.deal.groupBy({
//     by: ["stage"],
//     where: {
//       stage: { in: ACTIVE_STAGES },
//     },
//     _count: { id: true },
//   });

//   const total = stages.reduce((sum, s) => sum + s._count.id, 0);

//   const funnel = stages.map((s) => ({
//     stage: s.stage,
//     count: s._count.id,
//     conversion: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
//   }));

//   res.json({ success: true, data: funnel });
// });

// // @desc    Risk Distribution
// // @route   GET /api/analytics/risk-distribution
// // ✅ Risk Distribution (DYNAMIC, CONSISTENT)
// // @route GET /api/analytics/risk-distribution
// export const getRiskDistribution = asyncHandler(async (req, res) => {
//   const now = new Date();

//   const ACTIVE_STAGES = [
//     "RFQ",
//     "VISIT_MEETING",
//     "PREVIEW",
//     "TECHNICAL_PROPOSAL",
//     "COMMERCIAL_PROPOSAL",
//     "REVIEW_FEEDBACK",
//     "MOVED_TO_PURCHASE",
//     "NEGOTIATION",
//   ];

//   const deals = await prisma.deal.findMany({
//     where: { stage: { in: ACTIVE_STAGES } },
//     include: {
//       stageHistory: {
//         orderBy: { createdAt: "desc" },
//         take: 1,
//       },
//     },
//   });

//   const counters = { LOW: 0, MEDIUM: 0, HIGH: 0 };

//   deals.forEach((deal) => {
//     const enteredAt =
//       deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;

//     const daysInStage = Math.max(
//       1,
//       Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
//     );

//     if (daysInStage >= 30) counters.HIGH++;
//     else if (daysInStage >= 8) counters.MEDIUM++;
//     else counters.LOW++;
//   });

//   res.json({
//     success: true,
//     data: [
//       { riskLevel: "LOW", _count: { id: counters.LOW } },
//       { riskLevel: "MEDIUM", _count: { id: counters.MEDIUM } },
//       { riskLevel: "HIGH", _count: { id: counters.HIGH } },
//     ],
//   });
// });

// // @desc    Stage Aging Analytics
// // @route   GET /api/analytics/stage-aging
// // @desc    Stage Aging Analytics
// // @route   GET /api/analytics/stage-aging
// export const getStageAgingAnalytics = asyncHandler(async (req, res) => {
//   const now = new Date();

//   const ACTIVE_STAGES = [
//     "RFQ",
//     "VISIT_MEETING",
//     "PREVIEW",
//     "TECHNICAL_PROPOSAL",
//     "COMMERCIAL_PROPOSAL",
//     "REVIEW_FEEDBACK",
//     "MOVED_TO_PURCHASE",
//     "NEGOTIATION",
//   ];

//   const deals = await prisma.deal.findMany({
//     where: {
//       stage: { in: ACTIVE_STAGES },
//     },
//     include: {
//       owner: { select: { name: true } },
//       stageHistory: {
//         where: { stage: { in: ACTIVE_STAGES } },
//         orderBy: { createdAt: "desc" },
//       },
//     },
//   });

//   const stageMap = {};
//   const dealAgingList = [];

//   deals.forEach((deal) => {
//     const stage = deal.stage;

//     const lastStageEntry = deal.stageHistory.find((h) => h.stage === stage);

//     const enteredAt = lastStageEntry?.createdAt || deal.createdAt;

//     const daysInStage = Math.max(
//       1,
//       Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
//     );

//     // Track per-stage
//     if (!stageMap[stage]) {
//       stageMap[stage] = {
//         stage,
//         deals: 0,
//         totalDays: 0,
//         stuckDeals: 0,
//       };
//     }

//     stageMap[stage].deals += 1;
//     stageMap[stage].totalDays += daysInStage;
//     if (daysInStage > 14) stageMap[stage].stuckDeals += 1;

//     // Track individual deal aging
//     dealAgingList.push({
//       dealId: deal.id,
//       dealName: deal.dealName,
//       stage,
//       daysInStage,
//       owner: deal.owner?.name || "N/A",
//     });
//   });

//   const stages = Object.values(stageMap).map((s) => ({
//     stage: s.stage,
//     deals: s.deals,
//     avgDays: Math.round(s.totalDays / s.deals),
//     stuckDeals: s.stuckDeals,
//   }));

//   // 🔥 PRIMARY BOTTLENECK
//   const bottleneckStage = stages.reduce(
//     (max, s) => (s.avgDays > max.avgDays ? s : max),
//     stages[0],
//   );

//   // 🔥 TOP STUCK DEALS (from bottleneck stage only)
//   const topStuckDeals = dealAgingList
//     .filter((d) => d.stage === bottleneckStage.stage)
//     .sort((a, b) => b.daysInStage - a.daysInStage)
//     .slice(0, 5);

//   res.json({
//     success: true,
//     data: {
//       stages,
//       bottleneck: bottleneckStage,
//       topStuckDeals,
//     },
//   });
// });

// // @desc    Pipeline Risk – Deal level drilldown
// // @route   GET /api/analytics/risk-deals?risk=LOW|MEDIUM|HIGH
// export const getRiskDeals = asyncHandler(async (req, res) => {
//   const risk = (req.query.risk || "").toUpperCase();
//   const now = new Date();

//   const ACTIVE_STAGES = [
//     "RFQ",
//     "VISIT_MEETING",
//     "PREVIEW",
//     "TECHNICAL_PROPOSAL",
//     "COMMERCIAL_PROPOSAL",
//     "REVIEW_FEEDBACK",
//     "MOVED_TO_PURCHASE",
//     "NEGOTIATION",
//   ];

//   if (!["LOW", "MEDIUM", "HIGH"].includes(risk)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid risk level",
//     });
//   }

//   const deals = await prisma.deal.findMany({
//     where: {
//       stage: { in: ACTIVE_STAGES },
//     },
//     include: {
//       owner: { select: { name: true } },
//       account: { select: { accountName: true } },
//       stageHistory: {
//         orderBy: { createdAt: "desc" },
//         take: 1,
//       },
//     },
//   });

//   const result = [];

//   deals.forEach((deal) => {
//     const enteredAt =
//       deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;

//     const daysInStage = Math.max(
//       1,
//       Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
//     );

//     let dealRisk = "LOW";
//     if (daysInStage >= 30) dealRisk = "HIGH";
//     else if (daysInStage >= 8) dealRisk = "MEDIUM";

//     if (dealRisk === risk) {
//       result.push({
//         dealId: deal.id,
//         dealName: deal.dealName,
//         accountName: deal.account?.accountName || "Unknown",
//         stage: deal.stage,
//         daysInStage,
//         closingDate: deal.closingDate,
//         owner: deal.owner?.name || "N/A",
//         lastStageChangeAt: enteredAt,
//       });
//     }
//   });

//   res.json({
//     success: true,
//     data: result.sort((a, b) => b.daysInStage - a.daysInStage),
//   });
// });

// // @desc    Pipeline Velocity – Stage drilldown (deal list)
// // @route   GET /api/analytics/stage-deals?stage=STAGE_NAME
// export const getStageDeals = asyncHandler(async (req, res) => {
//   const stage = req.query.stage;
//   const now = new Date();

//   if (!stage) {
//     return res.status(400).json({
//       success: false,
//       message: "Stage is required",
//     });
//   }

//   const deals = await prisma.deal.findMany({
//     where: { stage },
//     include: {
//       owner: { select: { name: true } },
//       account: { select: { accountName: true } },
//       stageHistory: {
//         where: { stage },
//         orderBy: { createdAt: "desc" },
//         take: 1,
//       },
//     },
//   });

// // 🔥 calculate avg days for this stage
// const avgDays =
//   deals.reduce((sum, deal) => {
//     const enteredAt =
//       deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;

//     return (
//       sum +
//       Math.max(
//         1,
//         Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
//       )
//     );
//   }, 0) / deals.length;

// // 🔥 only return deals >= avgDays
// const data = deals
//   .map((deal) => {
//     const enteredAt =
//       deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;

//     const daysInStage = Math.max(
//       1,
//       Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
//     );

//     return {
//       dealId: deal.id,
//       dealName: deal.dealName,
//       accountName: deal.account?.accountName || "Unknown",
//       owner: deal.owner?.name || "N/A",
//       stage,
//       daysInStage,
//       closingDate: deal.closingDate,
//       enteredStageAt: enteredAt,
//     };
//   })
//   .filter((d) => d.daysInStage >= Math.round(avgDays))
//   .sort((a, b) => b.daysInStage - a.daysInStage);

//   res.json({
//     success: true,
//     data: data.sort((a, b) => b.daysInStage - a.daysInStage),
//   });
// });


import prisma from "../utils/prisma.js";
import { asyncHandler } from "../utils/ApiError.js";

/* ============================================================
   DASHBOARD OVERVIEW (Clean Operational Version)
============================================================ */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [
    totalAccounts,
    totalContacts,
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    thisMonthDeals,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),

    prisma.deal.count({
      where: {
        stage: {
          notIn: ["CLOSED_WON", "CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"],
        },
      },
    }),

    prisma.deal.count({
      where: { stage: "CLOSED_WON" },
    }),

    prisma.deal.count({
      where: {
        stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
      },
    }),

    prisma.deal.count({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const closedDeals = wonDeals + lostDeals;

  const winRate =
    closedDeals > 0
      ? Math.round((wonDeals / closedDeals) * 100)
      : 0;

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

  res.json({
    success: true,
    data: {
      summary: {
        totalAccounts,
        totalContacts,
        totalDeals,
        openDeals,
        closedDeals,
        thisMonthDeals,
      },
      performance: {
        wonDeals,
        lostDeals,
        winRate,
      },
      dealsClosingThisMonth,
    },
  });
});


/* ============================================================
   DEALS BY STAGE (Count Only)
============================================================ */
export const getDealsByStage = asyncHandler(async (req, res) => {
  const stages = await prisma.deal.groupBy({
    by: ["stage"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  res.json({
    success: true,
    data: stages.map((s) => ({
      stage: s.stage,
      count: s._count.id,
    })),
  });
});


/* ============================================================
   MONTHLY TREND (Count-Based Only)
============================================================ */
export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const today = new Date();
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

    const [wonCount, newDeals, lostCount] = await Promise.all([
      prisma.deal.count({
        where: {
          stage: "CLOSED_WON",
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.deal.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.deal.count({
        where: {
          stage: { in: ["CLOSED_LOST", "CLOSED_LOST_TO_COMPETITION"] },
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    data.push({
      month: startDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      wonCount,
      newDeals,
      lostCount,
    });
  }

  res.json({ success: true, data });
});


/* ============================================================
   TOP PERFORMERS (No Revenue, Only Deal Performance)
============================================================ */
export const getTopPerformers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const performers = await prisma.deal.groupBy({
    by: ["dealOwnerId"],
    where: { stage: "CLOSED_WON" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
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

      const winRate =
        closedDeals > 0
          ? Math.round((p._count.id / closedDeals) * 100)
          : 0;

      return {
        user,
        wonDeals: p._count.id,
        totalDeals,
        winRate,
      };
    })
  );

  res.json({ success: true, data: performersWithDetails });
});


/* ============================================================
   DEALS BY LEAD SOURCE (Count-Based)
============================================================ */
export const getDealsBySource = asyncHandler(async (req, res) => {
  const sources = await prisma.deal.groupBy({
    by: ["leadSource"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const wonBySource = await prisma.deal.groupBy({
    by: ["leadSource"],
    where: { stage: "CLOSED_WON" },
    _count: { id: true },
  });

  const data = sources.map((s) => {
    const won = wonBySource.find((w) => w.leadSource === s.leadSource);

    const winRate =
      s._count.id > 0 && won
        ? Math.round((won._count.id / s._count.id) * 100)
        : 0;

    return {
      source: s.leadSource || "Unknown",
      totalDeals: s._count.id,
      wonDeals: won?._count.id || 0,
      winRate,
    };
  });

  res.json({ success: true, data });
});


/* ============================================================
   RECENT ACTIVITIES
============================================================ */
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

// NEW ONE ANIRUDDHA
// @desc    Lead Source Cohort Analytics
// @route   GET /api/analytics/cohort-lead-source
export const getLeadSourceCohort = asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    include: {
      account: {
        select: {
          id: true,
          accountName: true,
        },
      },
      owner: {
        select: {
          name: true,
        },
      },
    },
  });
 
  const cohortMap = {};
 
  deals.forEach((deal) => {
    const source = deal.leadSource || "Unknown";
 
    if (!cohortMap[source]) {
      cohortMap[source] = {
        source,
        totalDeals: 0,
        wonDeals: 0,
        totalAmount: 0,
        totalCloseDays: 0,
        closedCount: 0,
        accounts: new Set(),
        deals: [], // 🔥 ADD DEAL BREAKDOWN
      };
    }
 
    const cohort = cohortMap[source];
 
    cohort.totalDeals++;
    cohort.totalAmount += deal.amount || 0;
    cohort.accounts.add(deal.accountId);
 
    // 🔥 Push deal details for drilldown
    cohort.deals.push({
      dealId: deal.id,
      dealName: deal.dealName,
      accountName: deal.account?.accountName || "Unknown",
      amount: deal.amount || 0,
      stage: deal.stage,
      owner: deal.owner?.name || "N/A",
      createdAt: deal.createdAt,
    });
 
    if (deal.stage === "CLOSED_WON") {
      cohort.wonDeals++;
      cohort.closedCount++;
 
      const closeDays = Math.floor(
        (new Date(deal.updatedAt) - new Date(deal.createdAt)) /
          (1000 * 60 * 60 * 24),
      );
 
      cohort.totalCloseDays += closeDays;
    }
  });
 
  const result = Object.values(cohortMap).map((c) => {
    const winRate =
      c.totalDeals > 0 ? Math.round((c.wonDeals / c.totalDeals) * 100) : 0;
 
    const avgDealSize =
      c.totalDeals > 0 ? Math.round(c.totalAmount / c.totalDeals) : 0;
 
    const avgCloseDays =
      c.closedCount > 0 ? Math.round(c.totalCloseDays / c.closedCount) : 0;
 
    const repeatFactor =
      c.accounts.size > 0 ? c.totalDeals / c.accounts.size : 1;
 
    const ltv = Math.round(avgDealSize * repeatFactor);
 
    return {
      source: c.source,
      totalDeals: c.totalDeals,
      winRate,
      avgDealSize,
      avgCloseDays,
      ltv,
      deals: c.deals, // 🔥 SEND DEAL DETAILS
    };
  });
 
  res.json({ success: true, data: result });
});
// @desc    Sales Funnel Conversion
// @route   GET /api/analytics/funnel
export const getFunnelAnalytics = asyncHandler(async (req, res) => {
  const ACTIVE_STAGES = [
    "RFQ",
    "VISIT_MEETING",
    "PREVIEW",
    "TECHNICAL_PROPOSAL",
    "COMMERCIAL_PROPOSAL",
    "REVIEW_FEEDBACK",
    "MOVED_TO_PURCHASE",
    "NEGOTIATION",
  ];
 
  const stages = await prisma.deal.groupBy({
    by: ["stage"],
    where: {
      stage: { in: ACTIVE_STAGES },
    },
    _count: { id: true },
  });
 
  const total = stages.reduce((sum, s) => sum + s._count.id, 0);
 
  const funnel = stages.map((s) => ({
    stage: s.stage,
    count: s._count.id,
    conversion: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
  }));
 
  res.json({ success: true, data: funnel });
});
 
// @desc    Risk Distribution
// @route   GET /api/analytics/risk-distribution
// ✅ Risk Distribution (DYNAMIC, CONSISTENT)
// @route GET /api/analytics/risk-distribution
export const getRiskDistribution = asyncHandler(async (req, res) => {
  const now = new Date();
 
  const ACTIVE_STAGES = [
    "RFQ",
    "VISIT_MEETING",
    "PREVIEW",
    "TECHNICAL_PROPOSAL",
    "COMMERCIAL_PROPOSAL",
    "REVIEW_FEEDBACK",
    "MOVED_TO_PURCHASE",
    "NEGOTIATION",
  ];
 
  const deals = await prisma.deal.findMany({
    where: { stage: { in: ACTIVE_STAGES } },
    include: {
      stageHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
 
  const counters = { LOW: 0, MEDIUM: 0, HIGH: 0 };
 
  deals.forEach((deal) => {
    const enteredAt =
      deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;
 
    const daysInStage = Math.max(
      1,
      Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
    );
 
    if (daysInStage >= 30) counters.HIGH++;
    else if (daysInStage >= 8) counters.MEDIUM++;
    else counters.LOW++;
  });
 
  res.json({
    success: true,
    data: [
      { riskLevel: "LOW", _count: { id: counters.LOW } },
      { riskLevel: "MEDIUM", _count: { id: counters.MEDIUM } },
      { riskLevel: "HIGH", _count: { id: counters.HIGH } },
    ],
  });
});
 
// @desc    Stage Aging Analytics
// @route   GET /api/analytics/stage-aging
// @desc    Stage Aging Analytics
// @route   GET /api/analytics/stage-aging
export const getStageAgingAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
 
  const ACTIVE_STAGES = [
    "RFQ",
    "VISIT_MEETING",
    "PREVIEW",
    "TECHNICAL_PROPOSAL",
    "COMMERCIAL_PROPOSAL",
    "REVIEW_FEEDBACK",
    "MOVED_TO_PURCHASE",
    "NEGOTIATION",
  ];
 
  const deals = await prisma.deal.findMany({
    where: {
      stage: { in: ACTIVE_STAGES },
    },
    include: {
      owner: { select: { name: true } },
      stageHistory: {
        where: { stage: { in: ACTIVE_STAGES } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
 
  const stageMap = {};
  const dealAgingList = [];
 
  deals.forEach((deal) => {
    const stage = deal.stage;
 
    const lastStageEntry = deal.stageHistory.find((h) => h.stage === stage);
 
    const enteredAt = lastStageEntry?.createdAt || deal.createdAt;
 
    const daysInStage = Math.max(
      1,
      Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
    );
 
    // Track per-stage
    if (!stageMap[stage]) {
      stageMap[stage] = {
        stage,
        deals: 0,
        totalDays: 0,
        stuckDeals: 0,
      };
    }
 
    stageMap[stage].deals += 1;
    stageMap[stage].totalDays += daysInStage;
    if (daysInStage > 14) stageMap[stage].stuckDeals += 1;
 
    // Track individual deal aging
    dealAgingList.push({
      dealId: deal.id,
      dealName: deal.dealName,
      stage,
      daysInStage,
      owner: deal.owner?.name || "N/A",
    });
  });
 
  const stages = Object.values(stageMap).map((s) => ({
    stage: s.stage,
    deals: s.deals,
    avgDays: Math.round(s.totalDays / s.deals),
    stuckDeals: s.stuckDeals,
  }));
 
  // 🔥 PRIMARY BOTTLENECK
  const bottleneckStage = stages.reduce(
    (max, s) => (s.avgDays > max.avgDays ? s : max),
    stages[0],
  );
 
  // 🔥 TOP STUCK DEALS (from bottleneck stage only)
  const topStuckDeals = dealAgingList
    .filter((d) => d.stage === bottleneckStage.stage)
    .sort((a, b) => b.daysInStage - a.daysInStage)
    .slice(0, 5);
 
  res.json({
    success: true,
    data: {
      stages,
      bottleneck: bottleneckStage,
      topStuckDeals,
    },
  });
});
 
// @desc    Pipeline Risk – Deal level drilldown
// @route   GET /api/analytics/risk-deals?risk=LOW|MEDIUM|HIGH
export const getRiskDeals = asyncHandler(async (req, res) => {
  const risk = (req.query.risk || "").toUpperCase();
  const now = new Date();
 
  const ACTIVE_STAGES = [
    "RFQ",
    "VISIT_MEETING",
    "PREVIEW",
    "TECHNICAL_PROPOSAL",
    "COMMERCIAL_PROPOSAL",
    "REVIEW_FEEDBACK",
    "MOVED_TO_PURCHASE",
    "NEGOTIATION",
  ];
 
  if (!["LOW", "MEDIUM", "HIGH"].includes(risk)) {
    return res.status(400).json({
      success: false,
      message: "Invalid risk level",
    });
  }
 
  const deals = await prisma.deal.findMany({
    where: {
      stage: { in: ACTIVE_STAGES },
    },
    include: {
      owner: { select: { name: true } },
      account: { select: { accountName: true } },
      stageHistory: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
 
  const result = [];
 
  deals.forEach((deal) => {
    const enteredAt =
      deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;
 
    const daysInStage = Math.max(
      1,
      Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24)),
    );
 
    let dealRisk = "LOW";
    if (daysInStage >= 30) dealRisk = "HIGH";
    else if (daysInStage >= 8) dealRisk = "MEDIUM";
 
    if (dealRisk === risk) {
      result.push({
        dealId: deal.id,
        dealName: deal.dealName,
        accountName: deal.account?.accountName || "Unknown",
        stage: deal.stage,
        daysInStage,
        closingDate: deal.closingDate,
        owner: deal.owner?.name || "N/A",
        lastStageChangeAt: enteredAt,
      });
    }
  });
 
  res.json({
    success: true,
    data: result.sort((a, b) => b.daysInStage - a.daysInStage),
  });
});
 
// @desc    Pipeline Velocity – Stage drilldown (deal list)
// @route   GET /api/analytics/stage-deals?stage=STAGE_NAME
export const getStageDeals = asyncHandler(async (req, res) => {
  const stage = req.query.stage;
  const now = new Date();
 
  if (!stage) {
    return res.status(400).json({
      success: false,
      message: "Stage is required",
    });
  }
 
  const deals = await prisma.deal.findMany({
    where: { stage },
    include: {
      owner: { select: { name: true } },
      account: { select: { accountName: true } },
      stageHistory: {
        where: { stage },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
 
// 🔥 calculate avg days for this stage
const avgDays =
  deals.reduce((sum, deal) => {
    const enteredAt =
      deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;
 
    return (
      sum +
      Math.max(
        1,
        Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
      )
    );
  }, 0) / deals.length;
 
// 🔥 only return deals >= avgDays
const data = deals
  .map((deal) => {
    const enteredAt =
      deal.stageHistory[0]?.createdAt || deal.updatedAt || deal.createdAt;
 
    const daysInStage = Math.max(
      1,
      Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
    );
 
    return {
      dealId: deal.id,
      dealName: deal.dealName,
      accountName: deal.account?.accountName || "Unknown",
      owner: deal.owner?.name || "N/A",
      stage,
      daysInStage,
      closingDate: deal.closingDate,
      enteredStageAt: enteredAt,
    };
  })
  .filter((d) => d.daysInStage >= Math.round(avgDays))
  .sort((a, b) => b.daysInStage - a.daysInStage);
 
  res.json({
    success: true,
    data: data.sort((a, b) => b.daysInStage - a.daysInStage),
  });
});