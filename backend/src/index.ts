import { buildApp } from "./app.js";
import { config } from "./config.js";
import { startOverdueJob } from "./jobs/overdue.job.js";
import { prisma } from "./lib/prisma.js";
import { attachSocketServer } from "./ws/server.js";

async function main() {
  const app = await buildApp();
  await app.ready();
  attachSocketServer(app);
  startOverdueJob();

  await app.listen({ port: config.port, host: config.host });
  app.log.info(`API listening on ${config.host}:${config.port}`);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
