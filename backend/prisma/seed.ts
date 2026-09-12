import {
  PrismaClient,
  type ActivityType,
  type Role,
  type TaskPriority,
  type TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Password123!";

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users: { email: string; name: string; role: Role }[] = [
    { email: "system@velozity.local", name: "Velozity Bot", role: "ADMIN" },
    { email: "admin@velozity.dev", name: "Ava Shah", role: "ADMIN" },
    { email: "priya@velozity.dev", name: "Priya Mehta", role: "PROJECT_MANAGER" },
    { email: "james@velozity.dev", name: "James Okonkwo", role: "PROJECT_MANAGER" },
    { email: "ravi@velozity.dev", name: "Ravi Iyer", role: "DEVELOPER" },
    { email: "ananya@velozity.dev", name: "Ananya Rao", role: "DEVELOPER" },
    { email: "marcus@velozity.dev", name: "Marcus Chen", role: "DEVELOPER" },
    { email: "leila@velozity.dev", name: "Leila Haddad", role: "DEVELOPER" },
  ];

  const created = await Promise.all(
    users.map((user) => prisma.user.create({ data: { ...user, passwordHash } })),
  );

  const byEmail = Object.fromEntries(created.map((user) => [user.email, user]));
  const admin = byEmail["admin@velozity.dev"];
  const priya = byEmail["priya@velozity.dev"];
  const james = byEmail["james@velozity.dev"];
  const ravi = byEmail["ravi@velozity.dev"];
  const ananya = byEmail["ananya@velozity.dev"];
  const marcus = byEmail["marcus@velozity.dev"];
  const leila = byEmail["leila@velozity.dev"];
  const bot = byEmail["system@velozity.local"];

  const northwind = await prisma.client.create({
    data: {
      name: "Elena Vasquez",
      company: "Northwind Retail",
      email: "elena@northwind.example",
      createdById: admin.id,
    },
  });
  const helios = await prisma.client.create({
    data: {
      name: "Dr. Noah Klein",
      company: "Helios Health",
      email: "noah@helios.example",
      createdById: admin.id,
    },
  });
  const atlas = await prisma.client.create({
    data: {
      name: "Sofia Berg",
      company: "Atlas Logistics",
      email: "sofia@atlas.example",
      createdById: admin.id,
    },
  });

  const storefront = await prisma.project.create({
    data: {
      name: "Northwind Storefront Rebuild",
      description:
        "Replace the legacy catalog with a composable storefront, new checkout, and inventory sync.",
      clientId: northwind.id,
      createdById: priya.id,
    },
  });
  const portal = await prisma.project.create({
    data: {
      name: "Helios Patient Portal",
      description: "HIPAA-conscious patient portal for appointments, records, and secure messaging.",
      clientId: helios.id,
      createdById: priya.id,
    },
  });
  const tracking = await prisma.project.create({
    data: {
      name: "Atlas Tracking API",
      description: "Real-time shipment tracking API, webhook fan-out, and carrier adapter layer.",
      clientId: atlas.id,
      createdById: james.id,
    },
  });

  type SeedTask = {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
    isOverdue?: boolean;
  };

  const taskDefs: SeedTask[] = [
    {
      title: "Design checkout information architecture",
      description: "Map guest vs authenticated checkout and define error states for payments.",
      projectId: storefront.id,
      assigneeId: ravi.id,
      status: "DONE",
      priority: "HIGH",
      dueDate: daysFromNow(-12),
    },
    {
      title: "Implement product filter query layer",
      description: "Faceted search over category, price, and stock with shareable URL params.",
      projectId: storefront.id,
      assigneeId: ravi.id,
      status: "IN_REVIEW",
      priority: "HIGH",
      dueDate: daysFromNow(2),
    },
    {
      title: "Cart persistence across devices",
      description: "Sync anonymous carts after login without duplicating line items.",
      projectId: storefront.id,
      assigneeId: ananya.id,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      dueDate: daysFromNow(5),
    },
    {
      title: "Inventory webhook consumer",
      description: "Idempotent consumer for warehouse stock events; flag SKUs below threshold.",
      projectId: storefront.id,
      assigneeId: ananya.id,
      status: "TODO",
      priority: "CRITICAL",
      dueDate: daysFromNow(-3),
      isOverdue: true,
    },
    {
      title: "Accessibility pass on PDP",
      description: "Keyboard focus, alt text, and contrast on the product detail page.",
      projectId: storefront.id,
      assigneeId: ravi.id,
      status: "TODO",
      priority: "LOW",
      dueDate: daysFromNow(10),
    },
    {
      title: "Appointment booking API",
      description: "Slot reservation with optimistic locking so double-books cannot land.",
      projectId: portal.id,
      assigneeId: marcus.id,
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      dueDate: daysFromNow(1),
    },
    {
      title: "Records PDF export",
      description: "Generate a signed PDF of lab results for patient download.",
      projectId: portal.id,
      assigneeId: ananya.id,
      status: "TODO",
      priority: "HIGH",
      dueDate: daysFromNow(6),
    },
    {
      title: "Secure messaging thread model",
      description: "Provider-patient threads with audit log and attachment scanning.",
      projectId: portal.id,
      assigneeId: marcus.id,
      status: "IN_REVIEW",
      priority: "HIGH",
      dueDate: daysFromNow(3),
    },
    {
      title: "Session timeout UX",
      description: "Warn at 2 minutes remaining and restore draft messages after re-auth.",
      projectId: portal.id,
      assigneeId: leila.id,
      status: "DONE",
      priority: "MEDIUM",
      dueDate: daysFromNow(-4),
    },
    {
      title: "Audit event export",
      description: "Nightly S3 export of access logs for the compliance team.",
      projectId: portal.id,
      assigneeId: leila.id,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: daysFromNow(-1),
      isOverdue: true,
    },
    {
      title: "Carrier adapter: UPS",
      description: "Normalize tracking events from UPS into the internal shipment schema.",
      projectId: tracking.id,
      assigneeId: leila.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: daysFromNow(4),
    },
    {
      title: "Webhook retry with backoff",
      description: "Replay failed subscriber deliveries with jittered exponential backoff.",
      projectId: tracking.id,
      assigneeId: marcus.id,
      status: "TODO",
      priority: "CRITICAL",
      dueDate: daysFromNow(2),
    },
    {
      title: "Public status page widget",
      description: "Embeddable JS widget showing live ETA for a tracking token.",
      projectId: tracking.id,
      assigneeId: ravi.id,
      status: "TODO",
      priority: "LOW",
      dueDate: daysFromNow(14),
    },
    {
      title: "Rate-limit per API key",
      description: "Token bucket at the edge; return structured 429s with retry-after.",
      projectId: tracking.id,
      assigneeId: leila.id,
      status: "IN_REVIEW",
      priority: "MEDIUM",
      dueDate: daysFromNow(1),
    },
    {
      title: "Dead-letter admin view",
      description: "Let ops inspect and replay poison messages from the tracking queue.",
      projectId: tracking.id,
      assigneeId: marcus.id,
      status: "DONE",
      priority: "HIGH",
      dueDate: daysFromNow(-8),
    },
    {
      title: "OpenAPI contract tests",
      description: "Fail CI when response payloads drift from the published spec.",
      projectId: tracking.id,
      assigneeId: leila.id,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: daysFromNow(-2),
      isOverdue: true,
    },
  ];

  const tasks = [];
  for (const def of taskDefs) {
    tasks.push(
      await prisma.task.create({
        data: {
          title: def.title,
          description: def.description,
          projectId: def.projectId,
          assigneeId: def.assigneeId,
          status: def.status,
          priority: def.priority,
          dueDate: def.dueDate,
          isOverdue: Boolean(def.isOverdue),
        },
      }),
    );
  }

  const taskByTitle = Object.fromEntries(tasks.map((task) => [task.title, task]));

  type SeedActivity = {
    title: string;
    actorId: string;
    type: ActivityType;
    from?: TaskStatus;
    to?: TaskStatus;
    message: string;
    createdAt: Date;
  };

  const activities: SeedActivity[] = [
    {
      title: "Design checkout information architecture",
      actorId: ravi.id,
      type: "STATUS_CHANGED",
      from: "IN_REVIEW",
      to: "DONE",
      message: "Ravi Iyer moved Task #1 from In Review → Done",
      createdAt: hoursAgo(30),
    },
    {
      title: "Implement product filter query layer",
      actorId: ravi.id,
      type: "STATUS_CHANGED",
      from: "IN_PROGRESS",
      to: "IN_REVIEW",
      message: "Ravi Iyer moved Task #2 from In Progress → In Review",
      createdAt: hoursAgo(2),
    },
    {
      title: "Cart persistence across devices",
      actorId: ananya.id,
      type: "STATUS_CHANGED",
      from: "TODO",
      to: "IN_PROGRESS",
      message: "Ananya Rao moved Task #3 from To Do → In Progress",
      createdAt: hoursAgo(5),
    },
    {
      title: "Inventory webhook consumer",
      actorId: bot.id,
      type: "TASK_OVERDUE",
      message: "Task #4 “Inventory webhook consumer” was flagged as Overdue",
      createdAt: hoursAgo(20),
    },
    {
      title: "Appointment booking API",
      actorId: marcus.id,
      type: "STATUS_CHANGED",
      from: "TODO",
      to: "IN_PROGRESS",
      message: "Marcus Chen moved Task #6 from To Do → In Progress",
      createdAt: hoursAgo(8),
    },
    {
      title: "Secure messaging thread model",
      actorId: marcus.id,
      type: "STATUS_CHANGED",
      from: "IN_PROGRESS",
      to: "IN_REVIEW",
      message: "Marcus Chen moved Task #8 from In Progress → In Review",
      createdAt: hoursAgo(3),
    },
    {
      title: "Audit event export",
      actorId: bot.id,
      type: "TASK_OVERDUE",
      message: "Task #10 “Audit event export” was flagged as Overdue",
      createdAt: hoursAgo(6),
    },
    {
      title: "Carrier adapter: UPS",
      actorId: leila.id,
      type: "STATUS_CHANGED",
      from: "TODO",
      to: "IN_PROGRESS",
      message: "Leila Haddad moved Task #11 from To Do → In Progress",
      createdAt: hoursAgo(12),
    },
    {
      title: "Rate-limit per API key",
      actorId: leila.id,
      type: "STATUS_CHANGED",
      from: "IN_PROGRESS",
      to: "IN_REVIEW",
      message: "Leila Haddad moved Task #14 from In Progress → In Review",
      createdAt: hoursAgo(1),
    },
    {
      title: "Dead-letter admin view",
      actorId: marcus.id,
      type: "STATUS_CHANGED",
      from: "IN_REVIEW",
      to: "DONE",
      message: "Marcus Chen moved Task #15 from In Review → Done",
      createdAt: hoursAgo(40),
    },
    {
      title: "OpenAPI contract tests",
      actorId: bot.id,
      type: "TASK_OVERDUE",
      message: "Task #16 “OpenAPI contract tests” was flagged as Overdue",
      createdAt: hoursAgo(18),
    },
    {
      title: "Webhook retry with backoff",
      actorId: james.id,
      type: "TASK_CREATED",
      message: "James Okonkwo created Task #12 “Webhook retry with backoff”",
      createdAt: hoursAgo(48),
    },
  ];

  for (const activity of activities) {
    const task = taskByTitle[activity.title];
    await prisma.activity.create({
      data: {
        type: activity.type,
        taskId: task.id,
        projectId: task.projectId,
        actorId: activity.actorId,
        fromStatus: activity.from ?? null,
        toStatus: activity.to ?? null,
        message: activity.message.replace(/Task #\d+/, `Task #${task.number}`),
        createdAt: activity.createdAt,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: ravi.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "Priya Mehta assigned Task “Implement product filter query layer” to you",
        taskId: taskByTitle["Implement product filter query layer"].id,
        projectId: storefront.id,
        read: false,
        createdAt: hoursAgo(26),
      },
      {
        userId: priya.id,
        type: "TASK_IN_REVIEW",
        title: "Task ready for review",
        message: "Ravi Iyer moved Task “Implement product filter query layer” to In Review",
        taskId: taskByTitle["Implement product filter query layer"].id,
        projectId: storefront.id,
        read: false,
        createdAt: hoursAgo(2),
      },
      {
        userId: priya.id,
        type: "TASK_IN_REVIEW",
        title: "Task ready for review",
        message: "Marcus Chen moved Task “Secure messaging thread model” to In Review",
        taskId: taskByTitle["Secure messaging thread model"].id,
        projectId: portal.id,
        read: true,
        createdAt: hoursAgo(3),
      },
      {
        userId: james.id,
        type: "TASK_IN_REVIEW",
        title: "Task ready for review",
        message: "Leila Haddad moved Task “Rate-limit per API key” to In Review",
        taskId: taskByTitle["Rate-limit per API key"].id,
        projectId: tracking.id,
        read: false,
        createdAt: hoursAgo(1),
      },
      {
        userId: ananya.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: "Priya Mehta assigned Task “Cart persistence across devices” to you",
        taskId: taskByTitle["Cart persistence across devices"].id,
        projectId: storefront.id,
        read: true,
        createdAt: hoursAgo(10),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: Password123!):");
  console.log("  Admin            admin@velozity.dev");
  console.log("  Project Manager  priya@velozity.dev");
  console.log("  Project Manager  james@velozity.dev");
  console.log("  Developer        ravi@velozity.dev");
  console.log("  Developer        ananya@velozity.dev");
  console.log("  Developer        marcus@velozity.dev");
  console.log("  Developer        leila@velozity.dev");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
