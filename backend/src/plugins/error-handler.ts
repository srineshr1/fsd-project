import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((err: unknown, request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    const status =
      typeof err === "object" && err && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined;
    const message = err instanceof Error ? err.message : "Invalid request";
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send({
        error: {
          code: "REQUEST_ERROR",
          message: message || "Invalid request",
        },
      });
    }

    request.log.error({ err }, "unhandled error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
        ...(config.isProd ? {} : { debug: message }),
      },
    });
  });
}
