import type { ZodType } from "zod";
import { Errors } from "./errors.js";

export function parseBody<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.validation("Invalid request body", result.error.flatten());
  }
  return result.data;
}

export function parseQuery<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.validation("Invalid query parameters", result.error.flatten());
  }
  return result.data;
}
