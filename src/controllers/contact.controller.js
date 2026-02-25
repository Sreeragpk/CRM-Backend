import prisma from "../utils/prisma.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

// @desc    Get all contacts
// @route   GET /api/contacts
export const getContacts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    accountId,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(accountId && { accountId }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        account: { select: { id: true, accountName: true } },
        owner: { select: { id: true, name: true } },
        _count: { select: { deals: true } },

        // ⭐ UPCOMING TASK
        tasks: {
          where: {
            status: { not: "COMPLETED" },
            dueDate: { gte: new Date() },
          },
          orderBy: { dueDate: "asc" },
          take: 1,
          select: {
            subject: true,
            dueDate: true,
             priority: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit),
    }),

    prisma.contact.count({ where }),
  ]);

  // 👉 flatten upcomingTask for frontend
  const formatted = contacts.map((c) => ({
    ...c,
    upcomingTask: c.tasks[0] || null,
  }));

  res.json({
    success: true,
    data: formatted,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single contact
// @route   GET /api/contacts/:id
export const getContact = asyncHandler(async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
    include: {
      account: { select: { id: true, accountName: true, phone: true } },
      owner: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      modifiedBy: { select: { id: true, name: true } },
      deals: {
        select: {
          id: true,
          dealName: true,
          amount: true,
          stage: true,
          closingDate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  res.json({ success: true, data: contact });
});

// @desc    Create contact
// @route   POST /api/contacts
export const createContact = asyncHandler(async (req, res) => {
  const existingEmail = await prisma.contact.findUnique({
    where: { email: req.body.email },
  });

  if (existingEmail) {
    throw new ApiError(400, "Contact with this email already exists");
  }

  const data = {
    ...req.body,
    contactOwnerId: req.body.contactOwnerId || req.user.id,
    createdById: req.user.id,
    modifiedById: req.user.id,
  };

  const contact = await prisma.contact.create({
    data,
    include: {
      account: { select: { id: true, accountName: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, data: contact });
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
export const updateContact = asyncHandler(async (req, res) => {
  const existing = await prisma.contact.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  // Check email uniqueness if changing
  if (req.body.email && req.body.email !== existing.email) {
    const emailExists = await prisma.contact.findUnique({
      where: { email: req.body.email },
    });
    if (emailExists) {
      throw new ApiError(400, "Email already in use by another contact");
    }
  }

  const data = { ...req.body, modifiedById: req.user.id };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.createdById;

  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data,
    include: {
      account: { select: { id: true, accountName: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: contact });
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
export const deleteContact = asyncHandler(async (req, res) => {
  const existing = await prisma.contact.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  await prisma.contact.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: "Contact deleted successfully" });
});

// @desc    Get contacts dropdown
// @route   GET /api/contacts/dropdown/list
export const getContactsDropdown = asyncHandler(async (req, res) => {
  const { accountId } = req.query;

  const contacts = await prisma.contact.findMany({
    where: accountId ? { accountId } : {},
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: "asc" },
  });

  res.json({ success: true, data: contacts });
});