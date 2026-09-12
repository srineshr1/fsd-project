import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send({
        error: {
          code: "REQUEST_ERROR",
          message: err.message || "Invalid request",
        },
      });
    }

    request.log.error({ err }, "unhandled error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
        ...(config.isProd ? {} : { debug: err.message }),
      },
    });
  });
}
