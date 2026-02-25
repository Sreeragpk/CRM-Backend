import express from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();



router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markAsRead);

export default router;