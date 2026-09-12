import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};
