import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { env } from "../../../../config/env.js";
import { prisma } from "../../../../db/prisma.js";
import { toAuthenticatedUser } from "../models/user.model.js";
import { issueAuthToken } from "../middleware/auth.middleware.js";

const signupSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});

const roleSchema = z.object({
  role: z.enum(["business", "consumer"]),
});

function createHttpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

const DEMO_USER = {
  email: "demo@ascend.local",
  name: "Ascend Demo",
  role: "business" as const,
};

async function createAuthResponse(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return {
    user: toAuthenticatedUser(user),
    token: issueAuthToken({
      sub: user.id,
      email: user.email,
    }),
  };
}

export const authController = {
  async signup(req: Request, res: Response) {
    const payload = signupSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      throw createHttpError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        passwordHash,
      },
    });

    res.status(201).json(await createAuthResponse(user.id));
  },

  async login(req: Request, res: Response) {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      throw createHttpError(401, "Invalid email or password");
    }

    const matches = await bcrypt.compare(payload.password, user.passwordHash);

    if (!matches) {
      throw createHttpError(401, "Invalid email or password");
    }

    res.status(200).json(await createAuthResponse(user.id));
  },

  async demoLogin(_req: Request, res: Response) {
    if (!env.DEMO_MODE) {
      throw createHttpError(404, "Demo mode is not enabled");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: DEMO_USER.email },
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash("ascend-demo-password", 10);
      const user = await prisma.user.create({
        data: {
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          passwordHash,
          role: DEMO_USER.role,
        },
      });

      res.status(200).json(await createAuthResponse(user.id));
      return;
    }

    if (existingUser.role !== DEMO_USER.role || existingUser.name !== DEMO_USER.name) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: DEMO_USER.name,
          role: DEMO_USER.role,
        },
      });
    }

    res.status(200).json(await createAuthResponse(existingUser.id));
  },

  async me(req: Request, res: Response) {
    if (!req.authUser) {
      throw createHttpError(401, "Authentication required");
    }

    res.status(200).json({
      user: req.authUser,
    });
  },

  async updateRole(req: Request, res: Response) {
    if (!req.authUser) {
      throw createHttpError(401, "Authentication required");
    }

    const payload = roleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.authUser.id },
      data: { role: payload.role },
    });

    res.status(200).json({
      user: toAuthenticatedUser(user),
    });
  },

  async logout(_req: Request, res: Response) {
    res.status(200).json({
      success: true,
    });
  },
};
