// src/controllers/notification.controller.js
import prisma from "../utils/prisma.js";

export const getNotifications = async (req, res, next) => {
  try {
    const data = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};