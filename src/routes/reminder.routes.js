import express from "express";
import {
  createReminder,
  getMyReminders,
  deleteReminder,
} from "../controllers/reminder.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createReminder);
router.get("/", protect, getMyReminders);
router.delete("/:id", protect, deleteReminder);

export default router;