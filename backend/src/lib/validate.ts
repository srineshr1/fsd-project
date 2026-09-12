import type { z } from "zod";
import { Errors } from "./errors.js";

export function parseBody<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.validation("Invalid request body", result.error.flatten());
  }
  return result.data;
}

export function parseQuery<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.validation("Invalid query parameters", result.error.flatten());
  }
  return result.data;
}
