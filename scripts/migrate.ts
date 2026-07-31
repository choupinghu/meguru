/**
 * Applies pending migrations from ./drizzle.
 *
 * Two targets, because dev and production are separate Neon branches:
 *   npm run db:migrate        -> DATABASE_URL            (the dev branch)
 *   npm run db:migrate:prod   -> PRODUCTION_DATABASE_URL (the live site)
 *
 * Production is a *named* target rather than something you reach by editing
 * DATABASE_URL. Swapping that variable and forgetting to swap it back would
 * leave local development quietly mutating production data — the failure mode
 * this split exists to prevent. The endpoint is printed before anything runs,
 * so a wrong target is obvious rather than silent.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const toProduction = process.env.MIGRATE_TARGET === "production";

async function main() {
  const varName = toProduction ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[varName];

  if (!url) {
    throw new Error(
      toProduction
        ? "PRODUCTION_DATABASE_URL is not set. Add the live branch's pooled connection string to .env.local to migrate production."
        : "DATABASE_URL is not set. Add the dev branch's pooled connection string to .env.local."
    );
  }

  const endpoint = url.match(/@(ep-[a-z0-9-]+)/)?.[1] ?? "unknown endpoint";
  console.log(
    `Target: ${toProduction ? "PRODUCTION" : "dev"}  (${varName} -> ${endpoint})`
  );
  if (toProduction) {
    console.log("This is the live database. Ctrl-C within 5s to abort.");
    await new Promise((r) => setTimeout(r, 5000));
  }

  const db = drizzle(neon(url));
  console.log("Applying migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
