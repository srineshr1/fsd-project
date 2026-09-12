import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });
dotenv.config({ path: path.resolve(here, "../.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const sameSiteRaw = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
const sameSite =
  sameSiteRaw === "none" || sameSiteRaw === "strict" || sameSiteRaw === "lax"
    ? sameSiteRaw
    : "lax";

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 7),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: sameSite as "lax" | "none" | "strict",
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  overdueCron: process.env.OVERDUE_CRON ?? "*/1 * * * *",
};

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return config.frontendOrigins.includes(origin);
}

export const REFRESH_COOKIE = "refresh_token";
