import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
