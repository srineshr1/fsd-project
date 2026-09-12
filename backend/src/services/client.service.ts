import { Errors } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { publicClient } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";

export async function listClients(user: AuthUser) {
  if (user.role === "DEVELOPER") {
    throw Errors.forbidden("Developers cannot list clients");
  }
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  return clients.map(publicClient);
}

export async function createClient(
  user: AuthUser,
  input: { name: string; company: string; email: string },
) {
  if (user.role !== "ADMIN") {
    throw Errors.forbidden("Only admins can manage clients");
  }
  const client = await prisma.client.create({
    data: {
      name: input.name,
      company: input.company,
      email: input.email.toLowerCase(),
      createdById: user.id,
    },
  });
  return publicClient(client);
}

export async function updateClient(
  user: AuthUser,
  id: string,
  input: { name?: string; company?: string; email?: string },
) {
  if (user.role !== "ADMIN") {
    throw Errors.forbidden("Only admins can manage clients");
  }
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("Client");
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: input.name,
      company: input.company,
      email: input.email?.toLowerCase(),
    },
  });
  return publicClient(client);
}

export async function deleteClient(user: AuthUser, id: string) {
  if (user.role !== "ADMIN") {
    throw Errors.forbidden("Only admins can manage clients");
  }
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("Client");
  await prisma.client.delete({ where: { id } });
}
