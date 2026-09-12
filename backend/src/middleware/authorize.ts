import type { Role } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../lib/errors.js";

export function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw Errors.unauthorized();
    }
    if (roles.length > 0 && !roles.includes(request.user.role)) {
      throw Errors.forbidden("Insufficient role for this resource");
    }
  };
}
