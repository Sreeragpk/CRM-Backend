import { Router } from "express";
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  // getPipelineStats,
} from "../controllers/deal.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateDeal } from "../middlewares/validate.middleware.js";

const router = Router();

router.use(protect);

// router.get("/pipeline/stats", getPipelineStats);
router.route("/").get(getDeals).post(validateDeal, createDeal);
router.route("/:id").get(getDeal).put(validateDeal, updateDeal).delete(deleteDeal);

export default router;