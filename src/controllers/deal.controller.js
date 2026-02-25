// import prisma from "../utils/prisma.js";
// import { ApiError, asyncHandler } from "../utils/ApiError.js";

// const STAGE_PROBABILITY = {
//   QUALIFICATION: 10,
//   NEEDS_ANALYSIS: 20,
//   VALUE_PROPOSITION: 40,
//   IDENTIFY_DECISION_MAKERS: 60,
//   PROPOSAL_PRICE_QUOTE: 75,
//   NEGOTIATION_REVIEW: 90,
//   CLOSED_WON: 100,
//   CLOSED_LOST: 0,
//   CLOSED_LOST_TO_COMPETITION: 0,
// };

// // @desc    Get all deals
// // @route   GET /api/deals
// export const getDeals = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     search = "",
//     sortBy = "createdAt",
//     sortOrder = "desc",
//     stage,
//     accountId,
//     type,
//   } = req.query;

//   const skip = (parseInt(page) - 1) * parseInt(limit);

//   const where = {
//     ...(search && {
//       OR: [
//         { dealName: { contains: search, mode: "insensitive" } },
//         { account: { accountName: { contains: search, mode: "insensitive" } } },
//       ],
//     }),
//     ...(stage && { stage }),
//     ...(accountId && { accountId }),
//     ...(type && { type }),
//   };

//   const [deals, total] = await Promise.all([
//     prisma.deal.findMany({
//       where,
//       include: {
//         account: { select: { id: true, accountName: true } },
//         contact: { select: { id: true, firstName: true, lastName: true } },
//         owner: { select: { id: true, name: true } },
//       },
//       orderBy: { [sortBy]: sortOrder },
//       skip,
//       take: parseInt(limit),
//     }),
//     prisma.deal.count({ where }),
//   ]);

//   res.json({
//     success: true,
//     data: deals,
//     pagination: {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total,
//       pages: Math.ceil(total / parseInt(limit)),
//     },
//   });
// });

// // @desc    Get single deal
// // @route   GET /api/deals/:id
// export const getDeal = asyncHandler(async (req, res) => {
//   const deal = await prisma.deal.findUnique({
//     where: { id: req.params.id },
//     include: {
//       account: { select: { id: true, accountName: true, phone: true, website: true } },
//       contact: {
//         select: { id: true, firstName: true, lastName: true, email: true, phone: true },
//       },
//       owner: { select: { id: true, name: true, email: true } },
//       createdBy: { select: { id: true, name: true } },
//       modifiedBy: { select: { id: true, name: true } },
//     },
//   });

//   if (!deal) {
//     throw new ApiError(404, "Deal not found");
//   }

//   res.json({ success: true, data: deal });
// });

// // @desc    Create deal
// // @route   POST /api/deals
// export const createDeal = asyncHandler(async (req, res) => {
//   const data = {
//     ...req.body,
//     dealOwnerId: req.body.dealOwnerId || req.user.id,
//     createdById: req.user.id,
//     modifiedById: req.user.id,
//     closingDate: new Date(req.body.closingDate),
//     amount: req.body.amount ? parseFloat(req.body.amount) : null,
//     expectedRevenue: req.body.expectedRevenue ? parseFloat(req.body.expectedRevenue) : null,
//     probability: STAGE_PROBABILITY[req.body.stage] ?? null,
//   };

//   const deal = await prisma.deal.create({
//     data,
//     include: {
//       account: { select: { id: true, accountName: true } },
//       contact: { select: { id: true, firstName: true, lastName: true } },
//       owner: { select: { id: true, name: true } },
//     },
//   });

//   res.status(201).json({ success: true, data: deal });
// });

// // @desc    Update deal
// // @route   PUT /api/deals/:id
// export const updateDeal = asyncHandler(async (req, res) => {
//   const existing = await prisma.deal.findUnique({
//     where: { id: req.params.id },
//   });

//   if (!existing) {
//     throw new ApiError(404, "Deal not found");
//   }

//   const data = {
//     ...req.body,
//     modifiedById: req.user.id,
//     ...(req.body.closingDate && { closingDate: new Date(req.body.closingDate) }),
//     ...(req.body.amount !== undefined && { amount: req.body.amount ? parseFloat(req.body.amount) : null }),
//     ...(req.body.expectedRevenue !== undefined && {
//       expectedRevenue: req.body.expectedRevenue ? parseFloat(req.body.expectedRevenue) : null,
//     }),
//     ...(req.body.stage && { probability: STAGE_PROBABILITY[req.body.stage] ?? existing.probability }),
//   };

//   delete data.id;
//   delete data.createdAt;
//   delete data.updatedAt;
//   delete data.createdById;

//   const deal = await prisma.deal.update({
//     where: { id: req.params.id },
//     data,
//     include: {
//       account: { select: { id: true, accountName: true } },
//       contact: { select: { id: true, firstName: true, lastName: true } },
//       owner: { select: { id: true, name: true } },
//     },
//   });

//   res.json({ success: true, data: deal });
// });

// // @desc    Delete deal
// // @route   DELETE /api/deals/:id
// export const deleteDeal = asyncHandler(async (req, res) => {
//   const existing = await prisma.deal.findUnique({
//     where: { id: req.params.id },
//   });

//   if (!existing) {
//     throw new ApiError(404, "Deal not found");
//   }

//   await prisma.deal.delete({ where: { id: req.params.id } });

//   res.json({ success: true, message: "Deal deleted successfully" });
// });

// // @desc    Get deal pipeline stats
// // @route   GET /api/deals/pipeline/stats
// export const getPipelineStats = asyncHandler(async (req, res) => {
//   const stages = await prisma.deal.groupBy({
//     by: ["stage"],
//     _count: { id: true },
//     _sum: { amount: true },
//   });

//   const totalDeals = await prisma.deal.count();
//   const totalRevenue = await prisma.deal.aggregate({
//     _sum: { amount: true },
//   });

//   const wonDeals = await prisma.deal.aggregate({
//     where: { stage: "CLOSED_WON" },
//     _sum: { amount: true },
//     _count: { id: true },
//   });

//   res.json({
//     success: true,
//     data: {
//       stages,
//       totalDeals,
//       totalRevenue: totalRevenue._sum.amount || 0,
//       wonDeals: wonDeals._count.id || 0,
//       wonRevenue: wonDeals._sum.amount || 0,
//     },
//   });
// });
import prisma from "../utils/prisma.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

/* =========================================================
   STAGE → PROBABILITY MAP
========================================================= */
const STAGE_PROBABILITY = {
  RFQ: 10,
  VISIT_MEETING: 20,
  PREVIEW: 30,
  TECHNICAL_PROPOSAL: 40,
  COMMERCIAL_PROPOSAL: 50,
  REVIEW_FEEDBACK: 60,
  MOVED_TO_PURCHASE: 75,
  NEGOTIATION: 90,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
  CLOSED_LOST_TO_COMPETITION: 0,
  REGRETTED: 0,
};

/* =========================================================
   FY DEAL LOG ID GENERATOR
========================================================= */
const generateDealLogId = async (tx) => {
  const now = new Date();

  const year = now.getFullYear();
  const nextYear = year + 1;

  const fy =
    now.getMonth() + 1 >= 4
      ? `FY${String(year).slice(2)}${String(nextYear).slice(2)}`
      : `FY${String(year - 1).slice(2)}${String(year).slice(2)}`;

  const last = await tx.deal.findFirst({
    where: { dealLogId: { startsWith: fy } },
    orderBy: { dealLogId: "desc" },
    select: { dealLogId: true },
  });

  let number = 1000;

  if (last?.dealLogId) {
    number = parseInt(last.dealLogId.split(".")[1]) + 1;
  }

  return `${fy}.${number}`;
};

/* =========================================================
   COMMON INCLUDE (for frontend)
========================================================= */
// const dealInclude = {
//   account: { select: { id: true, accountName: true } },
//   contact: { select: { id: true, firstName: true, lastName: true } },
//   owner: { select: { id: true, name: true } },
//   createdBy: { select: { name: true } },
//   modifiedBy: { select: { name: true } },
// };

const dealInclude = {
  account: { select: { id: true, accountName: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  owner: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  modifiedBy: { select: { id: true, name: true } },
  stageHistory: {
    include: { changedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  },
};

/* =========================================================
   GET ALL DEALS
========================================================= */
export const getDeals = asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    include: dealInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: deals });
});

/* =========================================================
   GET SINGLE DEAL
========================================================= */
export const getDeal = asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: {
      ...dealInclude,
      stageHistory: {
        include: {
          changedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!deal) throw new ApiError(404, "Deal not found");

  res.json({ success: true, data: deal });
});

/* =========================================================
   CREATE DEAL
========================================================= */
export const createDeal = asyncHandler(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    const dealLogId = await generateDealLogId(tx);

    const deal = await tx.deal.create({
      data: {
        dealName: req.body.dealName,
        stage: req.body.stage,
        productGroup: req.body.productGroup || null,
        weightage: req.body.weightage || null,

        accountId: req.body.accountId,
        contactId: req.body.contactId || null,

        dealOwnerId: req.body.dealOwnerId || req.user.id,

        closingDate: new Date(req.body.closingDate),

        amount: req.body.amount ? parseFloat(req.body.amount) : null,
        expectedRevenue: req.body.expectedRevenue
          ? parseFloat(req.body.expectedRevenue)
          : null,

        probability: STAGE_PROBABILITY[req.body.stage] ?? null,

        dealLogId,

        createdById: req.user.id,
        modifiedById: req.user.id,
      },
    });

    await tx.dealStageHistory.create({
      data: {
        dealId: deal.id,
        stage: deal.stage,
        amount: deal.amount,
        probability: deal.probability,
        expectedRevenue: deal.expectedRevenue,
        closingDate: deal.closingDate,
        changedById: req.user.id,
      },
    });

    return tx.deal.findUnique({
      where: { id: deal.id },
      include: dealInclude,
    });
  });

  res.status(201).json({ success: true, data: result });
});

// /* =========================================================
//    UPDATE DEAL + STAGE HISTORY
// ========================================================= */
// export const updateDeal = asyncHandler(async (req, res) => {
//   const existing = await prisma.deal.findUnique({
//     where: { id: req.params.id },
//   });

//   if (!existing) throw new ApiError(404, "Deal not found");

//   const result = await prisma.$transaction(async (tx) => {
//     const updated = await tx.deal.update({
//       where: { id: req.params.id },
//       data: {
//         dealName: req.body.dealName ?? existing.dealName,
//         stage: req.body.stage ?? existing.stage,
//         productGroup: req.body.productGroup ?? existing.productGroup,
//         weightage: req.body.weightage ?? existing.weightage,

//         accountId: req.body.accountId ?? existing.accountId,
//         contactId: req.body.contactId ?? existing.contactId,

//         closingDate: req.body.closingDate
//           ? new Date(req.body.closingDate)
//           : existing.closingDate,

//         amount:
//           req.body.amount !== undefined
//             ? req.body.amount
//               ? parseFloat(req.body.amount)
//               : null
//             : existing.amount,

//         expectedRevenue:
//           req.body.expectedRevenue !== undefined
//             ? req.body.expectedRevenue
//               ? parseFloat(req.body.expectedRevenue)
//               : null
//             : existing.expectedRevenue,

//         probability: req.body.stage
//           ? STAGE_PROBABILITY[req.body.stage]
//           : existing.probability,

//         modifiedById: req.user.id,
//       },
//     });

//     /* 🔥 stage changed → history */
//     if (req.body.stage && req.body.stage !== existing.stage) {
//       await tx.dealStageHistory.create({
//         data: {
//           dealId: updated.id,
//           stage: updated.stage,
//           amount: updated.amount,
//           probability: updated.probability,
//           expectedRevenue: updated.expectedRevenue,
//           closingDate: updated.closingDate,
//           changedById: req.user.id,
//         },
//       });
//     }

//     return tx.deal.findUnique({
//       where: { id: updated.id },
//       include: dealInclude,
//     });
//   });

//   res.json({ success: true, data: result });
// });


/* =========================================================
   UPDATE DEAL + STAGE HISTORY
========================================================= */
export const updateDeal = asyncHandler(async (req, res) => {
  const existing = await prisma.deal.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) throw new ApiError(404, "Deal not found");

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: req.params.id },

      data: {
        dealName: req.body.dealName ?? existing.dealName,

        stage: req.body.stage ?? existing.stage,

        productGroup:
          req.body.productGroup !== undefined
            ? req.body.productGroup
            : existing.productGroup,

        weightage:
          req.body.weightage !== undefined
            ? req.body.weightage
            : existing.weightage,

        personInCharge:
          req.body.personInCharge !== undefined
            ? req.body.personInCharge
            : existing.personInCharge,

        accountId: req.body.accountId ?? existing.accountId,
        contactId: req.body.contactId ?? existing.contactId,

        closingDate: req.body.closingDate
          ? new Date(req.body.closingDate)
          : existing.closingDate,

        amount:
          req.body.amount !== undefined
            ? req.body.amount
              ? parseFloat(req.body.amount)
              : null
            : existing.amount,

        expectedRevenue:
          req.body.expectedRevenue !== undefined
            ? req.body.expectedRevenue
              ? parseFloat(req.body.expectedRevenue)
              : null
            : existing.expectedRevenue,

        probability: req.body.stage
          ? STAGE_PROBABILITY[req.body.stage]
          : existing.probability,

        modifiedById: req.user.id,
      },
    });

    /* 🔥 STAGE CHANGED → CREATE HISTORY */
    if (req.body.stage && req.body.stage !== existing.stage) {
      await tx.dealStageHistory.create({
        data: {
          dealId: updated.id,
          stage: updated.stage,
          amount: updated.amount,
          probability: updated.probability,
          expectedRevenue: updated.expectedRevenue,
          closingDate: updated.closingDate,
          changedById: req.user.id,
        },
      });
    }

    return tx.deal.findUnique({
      where: { id: updated.id },
      include: dealInclude,
    });
  });

  res.json({ success: true, data: result });
});
/* =========================================================
   DELETE DEAL
========================================================= */
export const deleteDeal = asyncHandler(async (req, res) => {
  await prisma.deal.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: "Deal deleted" });
});