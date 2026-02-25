import { Router } from "express";
import { register, login, logout, getMe, getUsers } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/users", protect, getUsers);

export default router;