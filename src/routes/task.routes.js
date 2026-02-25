// import express from "express";
// import {
//   createTask,
//   getTasks,
//   getMyTasks,
//   getUpcomingTaskForContact,
//   updateTask,
//   deleteTask,
// } from "../controllers/task.controller.js";

// import { protect } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.use(protect);

// // CREATE
// router.post("/", createTask);

// // LIST
// router.get("/", getTasks);

// // MY TASKS
// router.get("/my", getMyTasks);

// // UPCOMING TASK FOR CONTACT
// router.get("/upcoming/:contactId", getUpcomingTaskForContact);

// // UPDATE
// router.put("/:id", updateTask);

// // DELETE
// router.delete("/:id", deleteTask);

// export default router;
import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,   // ⭐ ADD THIS
  getMyTasks,
  getUpcomingTaskForContact,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

/* ================= CREATE ================= */
router.post("/", createTask);

/* ================= SINGLE TASK (⭐ MUST BE BEFORE "/") ================= */
router.get("/:id", getTaskById);

/* ================= LIST ================= */
router.get("/", getTasks);

/* ================= MY TASKS ================= */
router.get("/my", getMyTasks);

/* ================= UPCOMING TASK ================= */
router.get("/upcoming/:contactId", getUpcomingTaskForContact);

/* ================= UPDATE ================= */
router.put("/:id", updateTask);

/* ================= DELETE ================= */
router.delete("/:id", deleteTask);

export default router;