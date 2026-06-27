import { Router } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/auth/signup", asyncHandler(authController.signup));
authRouter.post("/auth/login", asyncHandler(authController.login));
authRouter.post("/auth/demo-login", asyncHandler(authController.demoLogin));
authRouter.get("/auth/me", requireAuth, asyncHandler(authController.me));
authRouter.patch("/auth/role", requireAuth, asyncHandler(authController.updateRole));
authRouter.post("/auth/logout", asyncHandler(authController.logout));
