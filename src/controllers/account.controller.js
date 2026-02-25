import prisma from "../utils/prisma.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

// @desc    Get all accounts
// @route   GET /api/accounts
export const getAccounts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    industry,
    accountType,
    rating,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { accountName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { accountNumber: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(industry && { industry }),
    ...(accountType && { accountType }),
    ...(rating && { rating }),
  };

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        parentAccount: { select: { id: true, accountName: true } },
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit),
    }),
    prisma.account.count({ where }),
  ]);

  res.json({
    success: true,
    data: accounts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single account
// @route   GET /api/accounts/:id
export const getAccount = asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      parentAccount: { select: { id: true, accountName: true } },
      childAccounts: { select: { id: true, accountName: true } },
      contacts: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          title: true,
        },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        select: {
          id: true,
          dealName: true,
          amount: true,
          stage: true,
          closingDate: true,
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!account) {
    throw new ApiError(404, "Account not found");
  }

  res.json({ success: true, data: account });
});

// @desc    Create account
// @route   POST /api/accounts
export const createAccount = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    accountOwnerId: req.body.accountOwnerId || req.user.id,
    annualRevenue: req.body.annualRevenue ? parseFloat(req.body.annualRevenue) : null,
    employees: req.body.employees ? parseInt(req.body.employees) : null,
  };

  // Generate account number
  const count = await prisma.account.count();
  data.accountNumber = `ACC-${String(count + 1).padStart(6, "0")}`;

  const account = await prisma.account.create({
    data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({ success: true, data: account });
});

// @desc    Update account
// @route   PUT /api/accounts/:id
export const updateAccount = asyncHandler(async (req, res) => {
  const existing = await prisma.account.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  const data = {
    ...req.body,
    annualRevenue: req.body.annualRevenue ? parseFloat(req.body.annualRevenue) : null,
    employees: req.body.employees ? parseInt(req.body.employees) : null,
  };

  // Remove fields that shouldn't be updated directly
  delete data.id;
  delete data.accountNumber;
  delete data.createdAt;
  delete data.updatedAt;

  const account = await prisma.account.update({
    where: { id: req.params.id },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ success: true, data: account });
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
export const deleteAccount = asyncHandler(async (req, res) => {
  const existing = await prisma.account.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { contacts: true, deals: true } } },
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  await prisma.account.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: "Account deleted successfully" });
});

// @desc    Get accounts for dropdown
// @route   GET /api/accounts/dropdown/list
export const getAccountsDropdown = asyncHandler(async (req, res) => {
  const accounts = await prisma.account.findMany({
    select: { id: true, accountName: true },
    orderBy: { accountName: "asc" },
  });

  res.json({ success: true, data: accounts });
});