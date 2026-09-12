import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(root, ".pgdata");
fs.mkdirSync(dataDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "velo",
  password: "velo",
  port: 5432,
  persistent: true,
  onLog: (msg) => process.stdout.write(String(msg)),
  onError: (msg) => process.stderr.write(String(msg)),
});

const alreadyInit = fs.existsSync(path.join(dataDir, "PG_VERSION"));
if (!alreadyInit) {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("velo");
} catch {
  // already exists on subsequent boots
}
console.log("PostgreSQL ready on postgresql://velo:velo@localhost:5432/velo");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
