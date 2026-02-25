import { ApiError } from "../utils/ApiError.js";

export const validateAccount = (req, res, next) => {
  const { accountName } = req.body;
  if (!accountName?.trim()) {
    throw new ApiError(400, "Account name is required");
  }
  next();
};

export const validateContact = (req, res, next) => {
  const { firstName, email, accountId } = req.body;
  const errors = [];

  if (!firstName?.trim()) errors.push("First name is required");
  if (!email?.trim()) errors.push("Email is required");
  if (email && !/\S+@\S+\.\S+/.test(email)) errors.push("Valid email is required");
  if (!accountId?.trim()) errors.push("Account ID is required");

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }
  next();
};

export const validateDeal = (req, res, next) => {
  const isUpdate = req.method === "PUT" || req.method === "PATCH";

  const { dealName, closingDate, stage, accountId } = req.body;
  const errors = [];

  const validStages = [
    "RFQ",
    "VISIT_MEETING",
    "PREVIEW",
    "REGRETTED",
    "TECHNICAL_PROPOSAL",
    "COMMERCIAL_PROPOSAL",
    "REVIEW_FEEDBACK",
    "MOVED_TO_PURCHASE",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
    "CLOSED_LOST_TO_COMPETITION",
  ];

  // ✅ CREATE → full validation
  if (!isUpdate) {
    if (!dealName?.trim()) errors.push("Deal name is required");
    if (!closingDate) errors.push("Closing date is required");
    if (!accountId?.trim()) errors.push("Account ID is required");
  }

  // ✅ If stage is sent → validate it
  if (stage && !validStages.includes(stage)) {
    errors.push("Invalid deal stage");
  }

  if (errors.length) {
    throw new ApiError(400, errors.join(", "));
  }

  next();
};