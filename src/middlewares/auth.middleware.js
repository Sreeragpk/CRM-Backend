// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check cookie
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new ApiError(401, "Not authorized - No token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Not authorized - User not found or inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Not authorized - Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Not authorized - Token expired"));
    }
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized`);
    }
    next();
  };
};