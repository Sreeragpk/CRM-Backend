// import { Router } from "express";
// import {
//   getAccounts,
//   getAccount,
//   createAccount,
//   updateAccount,
//   deleteAccount,
//   getAccountsDropdown,
// } from "../controllers/account.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";
// import { validateAccount } from "../middlewares/validate.middleware.js";

// const router = Router();

// router.use(protect);

// router.get("/dropdown/list", getAccountsDropdown);
// router.route("/").get(getAccounts).post(validateAccount, createAccount);
// router.route("/:id").get(getAccount).put(validateAccount, updateAccount).delete(deleteAccount);

// export default router;
import { Router } from "express";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsDropdown,
} from "../controllers/account.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";
import { validateAccount } from "../middlewares/validate.middleware.js";

const router = Router();

// 🔐 All routes require login
router.use(protect);

// 👀 Read access → all logged-in users
router.get("/dropdown/list", getAccountsDropdown);
router.get("/", getAccounts);
router.get("/:id", getAccount);

// 🛑 ADMIN ONLY → create / update / delete
router.post("/", authorize("ADMIN"), validateAccount, createAccount);
router.put("/:id", authorize("ADMIN"), validateAccount, updateAccount);
router.delete("/:id", authorize("ADMIN"), deleteAccount);

export default router;