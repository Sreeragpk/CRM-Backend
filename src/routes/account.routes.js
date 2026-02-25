import { Router } from "express";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsDropdown,
} from "../controllers/account.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateAccount } from "../middlewares/validate.middleware.js";

const router = Router();

router.use(protect);

router.get("/dropdown/list", getAccountsDropdown);
router.route("/").get(getAccounts).post(validateAccount, createAccount);
router.route("/:id").get(getAccount).put(validateAccount, updateAccount).delete(deleteAccount);

export default router;