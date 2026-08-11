/**
 * Idempotent seed: truncates `designs`/`items` and re-inserts two sets.
 *
 * The data itself (DOCUMENTED, OWNED and the raw pieces they're built from)
 * lives in `./seed-data` (spec 0015/D1) — moved out so it can be imported by
 * `check-content.ts` without also importing this file, which ends in a bare
 * `main().catch(...)` that TRUNCATEs `items`/`designs` the moment it loads.
 * This file keeps the Drizzle row mappers (they depend on `db/schema`'s row
 * types, which `seed-data.ts` must stay clear of), the target guard, the
 * truncate and the inserts.
 *
 * Run with: npm run db:seed (dev) or npm run db:seed:prod (the live branch).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { designs, items, type NewDesign, type NewItem } from "../db/schema";
import { DOCUMENTED, OWNED, type DocumentedDesign, type OwnedDesign } from "./seed-data";

type Region =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa";

// Region prefecture-code ranges, ported from prototype/index.html's REGIONS.
const REGION_RANGES: Record<Region, number[]> = {
  hokkaido: [1],
  tohoku: [2, 3, 4, 5, 6, 7],
  kanto: [8, 9, 10, 11, 12, 13, 14],
  chubu: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  kinki: [24, 25, 26, 27, 28, 29, 30],
  chugoku: [31, 32, 33, 34, 35],
  shikoku: [36, 37, 38, 39],
  kyushu: [40, 41, 42, 43, 44, 45, 46],
  okinawa: [47],
};

function regionForCode(code: number): Region {
  for (const region of Object.keys(REGION_RANGES) as Region[]) {
    if (REGION_RANGES[region].includes(code)) return region;
  }
  throw new Error(`No region found for prefecture code ${code}`);
}

function toDocumentedDesignRow(d: DocumentedDesign): NewDesign {
  const isCollab = !!d.collab;
  return {
    name: d.name,
    nameJa: d.ja,
    isCollab,
    brand: isCollab ? d.brand ?? null : null,
    prefectureCode: isCollab ? null : d.code!,
    region: isCollab ? "collab" : regionForCode(d.code!),
    city: isCollab ? null : d.city ?? null,
    motif: d.motif,
    rarity: d.rarity,
    special: !!d.special,
    story: d.story ?? null,
  };
}

function toOwnedDesignRow(d: OwnedDesign): NewDesign {
  return {
    name: d.name,
    nameJa: d.ja,
    isCollab: d.isCollab,
    brand: d.brand,
    prefectureCode: d.prefectureCode,
    region: d.prefectureCode != null ? regionForCode(d.prefectureCode) : "collab",
    city: d.city,
    motif: d.motif,
    rarity: d.rarity,
    special: d.special,
    story: d.story,
    imageUrl: d.imageUrl,
  };
}

function toOwnedItemRow(d: OwnedDesign, designId: number): NewItem {
  return {
    designId,
    condition: "bnib",
    status: "available",
    priceSgd: d.price,
    note: d.note,
    imageUrl: null,
  };
}

/**
 * Two targets, matching scripts/migrate.ts:
 *   npm run db:seed        -> DATABASE_URL            (the dev branch)
 *   npm run db:seed:prod   -> PRODUCTION_DATABASE_URL (the live site)
 *
 * Production is a *named* target rather than something you reach by editing
 * DATABASE_URL, for the same reason migrating is: this script TRUNCATEs before
 * inserting, so a forgotten variable swap would wipe live data on the next
 * routine `npm run db:seed`. The endpoint is printed before anything runs.
 */
const toProduction = process.env.SEED_TARGET === "production";

async function main() {
  const varName = toProduction ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[varName];

  if (!url) {
    throw new Error(
      toProduction
        ? "PRODUCTION_DATABASE_URL is not set. Add the live branch's pooled connection string to .env.local to seed production."
        : "DATABASE_URL is not set. Add the pooled Neon connection string to .env.local before seeding."
    );
  }

  const endpoint = url.match(/@(ep-[a-z0-9-]+)/)?.[1] ?? "unknown endpoint";
  console.log(
    `Target: ${toProduction ? "PRODUCTION" : "dev"}  (${varName} -> ${endpoint})`
  );
  if (toProduction) {
    console.log(
      "This is the live database, and seeding TRUNCATEs first. Ctrl-C within 5s to abort."
    );
    await new Promise((r) => setTimeout(r, 5000));
  }

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Truncating items and designs ...");
  await sql`TRUNCATE TABLE items, designs RESTART IDENTITY`;

  const documentedRows = DOCUMENTED.map(toDocumentedDesignRow);
  const ownedRows = OWNED.map(toOwnedDesignRow);
  const allDesignRows = [...documentedRows, ...ownedRows];

  console.log(
    `Inserting ${allDesignRows.length} designs (${documentedRows.length} documented, ${ownedRows.length} owned) ...`
  );
  const insertedDesigns = await db
    .insert(designs)
    .values(allDesignRows)
    .returning({ id: designs.id });

  const ownedDesignIds = insertedDesigns.slice(documentedRows.length);
  const itemRows = OWNED.map((d, i) => toOwnedItemRow(d, ownedDesignIds[i].id));
  console.log(`Inserting ${itemRows.length} items (owned designs only) ...`);
  await db.insert(items).values(itemRows);

  const ownedPrefectures = new Set(
    OWNED.filter((d) => d.prefectureCode != null).map((d) => d.prefectureCode)
  );
  const withStory = allDesignRows.filter((d) => d.story != null).length;
  console.log(
    `Seeded ${allDesignRows.length} designs (${itemRows.length} with an item) across ${ownedPrefectures.size} owned prefectures.`
  );
  console.log(
    `${withStory} of ${allDesignRows.length} designs carry a write-up; ${allDesignRows.length - withStory} are deliberately null.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
