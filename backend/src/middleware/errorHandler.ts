import type { NextFunction, Request, Response } from "express";

function getStatusCode(error: Error) {
  const candidate = (error as Error & { statusCode?: unknown }).statusCode;

  return typeof candidate === "number" ? candidate : 500;
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  res.status(getStatusCode(error)).json({
    message: error.message || "Internal server error",
  });
}
