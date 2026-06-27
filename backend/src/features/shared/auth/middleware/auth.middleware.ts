import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../db/prisma.js";
import { env } from "../../../../config/env.js";
import { toAuthenticatedUser } from "../models/user.model.js";
import type { AuthTokenPayload } from "../types/index.js";

function createHttpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export function issueAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);

  if (!token) {
    next(createHttpError(401, "Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      next(createHttpError(401, "User session is no longer valid"));
      return;
    }

    req.authUser = toAuthenticatedUser(user);
    next();
  } catch {
    next(createHttpError(401, "Invalid or expired session"));
  }
}
