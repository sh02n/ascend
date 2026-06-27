import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1).default("ascend-dev-jwt-secret"),
  DEMO_MODE: z.coerce.boolean().default(false),
  OPENAI_API_KEY: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
