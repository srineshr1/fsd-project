export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  unauthorized: (message = "Authentication required") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "You do not have permission to perform this action") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (entity = "Resource") =>
    new AppError(404, "NOT_FOUND", `${entity} not found`),
  conflict: (message: string) => new AppError(409, "CONFLICT", message),
  validation: (message: string, details?: unknown) =>
    new AppError(400, "VALIDATION_ERROR", message, details),
};
