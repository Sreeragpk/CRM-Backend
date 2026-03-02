// import { Router } from "express";
// import { register, login, logout, getMe, getUsers } from "../controllers/auth.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";

// const router = Router();

// router.post("/register", register);
// router.post("/login", login);
// router.post("/logout", logout);
// router.get("/me", protect, getMe);
// router.get("/users", protect, getUsers);


// export default router;
import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  getUsers,
  deleteUser, // ✅ ADD THIS
} from "../controllers/auth.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js"; // ✅ ADD authorize

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", protect, getMe);
router.get("/users", protect, getUsers);

router.delete(
  "/users/:id",
  protect,
  authorize("ADMIN"),
  deleteUser
);

export default router;