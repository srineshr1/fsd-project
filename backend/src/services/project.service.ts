import { Errors } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { publicProject, publicTask } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";
import { assertProjectWrite, getProjectForUser, projectWhere } from "./scope.js";

const projectInclude = {
  client: { select: { id: true, name: true, company: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true } },
} as const;

export async function listProjects(user: AuthUser) {
  const projects = await prisma.project.findMany({
    where: projectWhere(user),
    include: projectInclude,
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(publicProject);
}

export async function getProject(user: AuthUser, id: string) {
  const project = await getProjectForUser(user, id);
  const tasks = await prisma.task.findMany({
    where:
      user.role === "DEVELOPER"
        ? { projectId: id, assigneeId: user.id }
        : { projectId: id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, createdById: true } },
    },
    orderBy: [{ dueDate: "asc" }],
  });
  return { ...publicProject(project), tasks: tasks.map(publicTask) };
}

export async function createProject(
  user: AuthUser,
  input: { name: string; description: string; clientId: string },
) {
  if (user.role === "DEVELOPER") {
    throw Errors.forbidden("Developers cannot create projects");
  }
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw Errors.notFound("Client");

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId,
      createdById: user.id,
    },
    include: projectInclude,
  });
  return publicProject(project);
}

export async function updateProject(
  user: AuthUser,
  id: string,
  input: { name?: string; description?: string; clientId?: string },
) {
  await assertProjectWrite(user, id);
  if (input.clientId) {
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw Errors.notFound("Client");
  }
  const project = await prisma.project.update({
    where: { id },
    data: input,
    include: projectInclude,
  });
  return publicProject(project);
}

export async function deleteProject(user: AuthUser, id: string) {
  await assertProjectWrite(user, id);
  await prisma.project.delete({ where: { id } });
}
