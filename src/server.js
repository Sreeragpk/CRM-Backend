// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import morgan from "morgan";
// import dotenv from "dotenv";

// import authRoutes from "./routes/auth.routes.js";
// import accountRoutes from "./routes/account.routes.js";
// import contactRoutes from "./routes/contact.routes.js";
// import dealRoutes from "./routes/deal.routes.js";

// dotenv.config();

// const app = express();

// // ─── MIDDLEWARE ──────────────────────────────────────
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

// // ─── ROUTES ─────────────────────────────────────────
// app.use("/api/auth", authRoutes);
// app.use("/api/accounts", accountRoutes);
// app.use("/api/contacts", contactRoutes);
// app.use("/api/deals", dealRoutes);

// // ─── HEALTH CHECK ───────────────────────────────────
// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// // ─── ERROR HANDLER ──────────────────────────────────
// app.use((err, req, res, next) => {
//   console.error("❌ Error:", err.message);

//   const statusCode = err.statusCode || 500;
//   const message = err.isOperational
//     ? err.message
//     : "Internal Server Error";

//   res.status(statusCode).json({
//     success: false,
//     message,
//     ...(process.env.NODE_ENV === "development" && {
//       stack: err.stack,
//     }),
//   });
// });

// // ─── 404 HANDLER (Express v5 syntax) ────────────────
// // Changed from "*" to "/{*path}" for Express v5
// app.use("/{*path}", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// // ─── START SERVER ───────────────────────────────────
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
// });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import dealRoutes from "./routes/deal.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import taskRoutes from "./routes/task.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import "./jobs/dealReminder.job.js";
import aiRoutes from "./routes/ai.routes.js";
import dealRiskRoutes from "./routes/dealRisk.routes.js";
import { warmUpModel, getModelStatus } from "./ai/aiClient.js";
dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ SOCKET.IO
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
  });
});

// ✅ START CRON
import "./services/reminder.scheduler.js";

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/analytics", dealRiskRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

/* ─────────────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    ai: getModelStatus(),
  });
});
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await warmUpModel();
  } catch (err) {
    console.error("AI initialization failed:", err.message);
  }
});