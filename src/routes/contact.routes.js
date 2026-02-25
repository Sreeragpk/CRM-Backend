import { Router } from "express";
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsDropdown,
} from "../controllers/contact.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateContact } from "../middlewares/validate.middleware.js";

const router = Router();

router.use(protect);

router.get("/dropdown/list", getContactsDropdown);
router.route("/").get(getContacts).post(validateContact, createContact);
router.route("/:id").get(getContact).put(validateContact, updateContact).delete(deleteContact);

export default router;