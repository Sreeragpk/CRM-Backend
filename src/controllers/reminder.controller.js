// src/controllers/reminder.controller.js
import prisma from "../utils/prisma.js";

/**
 * ➕ CREATE REMINDER
 * POST /reminders
 */
export const createReminder = async (req, res, next) => {
  try {
    const {
      title,
      description,
      remindAt,
      emailBefore,
      popupBefore,
      priority,
      dealId,
      contactId,
      accountId,
    } = req.body;

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        remindAt: new Date(remindAt),
        emailBefore,
        popupBefore,
        priority,
        dealId,
        contactId,
        accountId,
        userId: req.user.id, // from auth middleware
      },
    });

    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
};

/**
 * 📄 GET MY REMINDERS
 * GET /reminders
 */
export const getMyReminders = async (req, res, next) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        remindAt: "asc",
      },
    });

    res.json(reminders);
  } catch (err) {
    next(err);
  }
};

/**
 * ❌ DELETE REMINDER
 * DELETE /reminders/:id
 */
export const deleteReminder = async (req, res, next) => {
  try {
    await prisma.reminder.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Reminder deleted" });
  } catch (err) {
    next(err);
  }
};