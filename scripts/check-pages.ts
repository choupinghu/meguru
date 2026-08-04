/**
 * Tier 2 (spec 0015): builds the app, serves the production build on a
 * throwaway port, and asserts what the rendered HTML actually contains.
 *
 * Needs `DATABASE_URL` — every page (`/`, `/browse`, `/charm/[id]`) is
 * `export const dynamic = "force-dynamic"` and queries Neon at request time.
 * `next build` itself does not touch the database.
 *
 * Port 3100, never 3000 (D6): 3000 is where the dev server for manual review
 * lives, sometimes for days at a stretch. A check that starts, shadows or
 * kills whatever is on 3000 would recreate exactly the stale-server
 * confusion CLAUDE.md already calls out as more costly than any real bug.
 * The server this script starts is always torn down in `finally`, and on
 * SIGINT/SIGTERM, so a Ctrl-C or a failed assertion never leaves it running.
 *
 * All expectations are derived from `seed-data.ts` (D2) rather than
 * hard-coded, so this keeps passing for the right reason as the collection
 * grows and starts failing for the right reason if something regresses.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { DOCUMENTED, OWNED } from "./seed-data";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const START_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Expectations, derived from the data (D2) — never a bare literal count.
// ---------------------------------------------------------------------------
const designCount = DOCUMENTED.length + OWNED.length; // cards on /browse
const ownedCount = OWNED.length; // footers, prices
const documented = DOCUMENTED.length; // is-documented
const withStory = [...DOCUMENTED, ...OWNED].filter((d) => d.story).length;
// Every OWNED row becomes exactly one item, always status "available" — a
// fixed policy in seed.ts's toOwnedItemRow, not a per-row field, so there is
// no per-item "available" flag in seed-data.ts to filter on. Until the seed
// grows a non-"available" owned item, availableCount is ownedCount; this is
// re-derived from OWNED.length (not a bare literal) so it still tracks the
// collection's size.
const availableCount = OWNED.length;

// A known story fragment (invariant 2: never rendered on /browse). Any
// story works; the first 40 characters is enough to prove presence/absence
// without matching on punctuation the grid might coincidentally share.
const KNOWN_STORY = (DOCUMENTED.find((d) => d.story)?.story ?? "").slice(0, 40);

// ---------------------------------------------------------------------------
// D5 — the three grep traps this project has been bitten by, handled once.
// ---------------------------------------------------------------------------

/**
 * 1. The RSC flight payload (the `self.__next_f.push(...)` script near the
 *    end of the document) re-serialises the page's props, which duplicates
 *    every string that also appears in the rendered markup — so counting
 *    against the raw response roughly doubles every number. Strip
 *    everything from that marker onward before counting anything.
 * 2. React inserts `<!-- -->` comment nodes between server-rendered text
 *    interpolations (e.g. `{a} charms across {b} prefectures`), which can
 *    split a substring across a comment and make a present string count as
 *    absent. Strip comment nodes too, so a text check can't false-negative
 *    into looking like it caught something it didn't.
 * 3. Count occurrences, not lines: `grep -c` counts matching *lines*, and a
 *    rendered grid puts many cards on one line, so a shell-grep count comes
 *    back as 1 no matter how many cards are on the page. Count regex matches
 *    in JS instead.
 */
function cleanHtml(html: string): string {
  const flightIdx = html.indexOf("self.__next_f");
  const beforeFlight = flightIdx === -1 ? html : html.slice(0, flightIdx);
  return beforeFlight.replace(/<!--.*?-->/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Count occurrences of a literal substring (not a line count — see D5.3). */
function countOccurrences(html: string, needle: string): number {
  const cleaned = cleanHtml(html);
  const re = new RegExp(escapeRegExp(needle), "g");
  return (cleaned.match(re) ?? []).length;
}

/**
 * 4. Anchor `class="X"` matches so a bare-prefix search can't also match
 *    `X-link`, `X-body`, `X-foot`, etc. — `class="card` once counted 187
 *    instead of 54 because it also matched `card-link`/`card-body`/
 *    `card-foot` on every single card. Only `class="X"` (no modifier) or
 *    `class="X <modifier>"` (a space right after X) count.
 */
function countClass(html: string, className: string): number {
  const cleaned = cleanHtml(html);
  const escaped = escapeRegExp(className);
  const re = new RegExp(`class="${escaped}"|class="${escaped} `, "g");
  return (cleaned.match(re) ?? []).length;
}

function containsText(html: string, needle: string): boolean {
  return countOccurrences(html, needle) > 0;
}

// ---------------------------------------------------------------------------
// Assertion bookkeeping
// ---------------------------------------------------------------------------
const failures: string[] = [];
let checked = 0;

function expect(label: string, actual: number | boolean, expected: number | boolean) {
  checked++;
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

// ---------------------------------------------------------------------------
// Build + serve
// ---------------------------------------------------------------------------

function buildApp() {
  console.log("Building (next build) ...");
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`next build failed (exit ${result.status})`);
  }
}

function startServer(): ChildProcess {
  console.log(`Starting (next start --port ${PORT}) ...`);
  const child = spawn("npx", ["next", "start", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  child.stdout?.on("data", () => {});
  child.stderr?.on("data", () => {});
  return child;
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200) return;
    } catch {
      // not up yet
    }
    await delay(500);
  }
  throw new Error(
    `Server on port ${PORT} never answered 200 within ${START_TIMEOUT_MS / 1000}s`
  );
}

let serverProcess: ChildProcess | null = null;

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    stopServer();
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// Page assertions (D4)
// ---------------------------------------------------------------------------

async function checkHome() {
  const res = await fetch(`${BASE_URL}/`);
  expect("/ status", res.status, 200);
  const html = await res.text();

  // Invariant 5: `/` shows no price, condition, status or Enquire anywhere,
  // not even after the map panel's client-side drill-down. The server HTML
  // alone can't prove the client-rendered half, but it's free to assert and
  // catches the server-rendered half of the same invariant.
  expect('/ class="price 0 occurrences', countOccurrences(html, 'class="price'), 0);
  expect('/ class="enq" 0 occurrences', countClass(html, "enq"), 0);
  expect("/ card-foot 0 occurrences", countOccurrences(html, "card-foot"), 0);

  // Invariant 4: rarity is not displayed anywhere.
  expect('/ class="tag rare" 0 occurrences', countClass(html, "tag rare"), 0);
  expect('/ class="tag grail" 0 occurrences', countClass(html, "tag grail"), 0);
  expect('/ "Rare & grail" 0 occurrences', countOccurrences(html, "Rare & grail"), 0);

  expect('/ "Discover a charm" occurrences', countOccurrences(html, "Discover a charm"), 1);
  expect(
    '/ "Discover a prefecture" occurrences',
    countOccurrences(html, "Discover a prefecture"),
    0
  );
}

async function checkBrowse() {
  const res = await fetch(`${BASE_URL}/browse`);
  expect("/browse status", res.status, 200);
  const html = await res.text();

  expect("/browse article cards (class=card)", countClass(html, "card"), designCount);
  expect("/browse is-documented", countOccurrences(html, "is-documented"), documented);
  expect('/browse class="tag motif"', countClass(html, "tag motif"), designCount);

  expect("/browse card-foot", countOccurrences(html, "card-foot"), ownedCount);
  expect('/browse class="price', countOccurrences(html, 'class="price'), ownedCount);
  expect('/browse class="enq"', countClass(html, "enq"), availableCount);

  expect('/browse class="tag rare"', countClass(html, "tag rare"), 0);
  expect('/browse class="tag grail"', countClass(html, "tag grail"), 0);

  // Invariant 2: the story never appears in the Browse grid. Checked by
  // content, not by class name — a class-name check would pass even if the
  // story block's class were renamed and it started rendering here.
  if (KNOWN_STORY) {
    expect("/browse story fragment absent", containsText(html, KNOWN_STORY), false);
  }
}

async function checkCharmPages() {
  let pagesWithStory = 0;
  let pagesWithRarity = 0;

  for (let id = 1; id <= designCount; id++) {
    const res = await fetch(`${BASE_URL}/charm/${id}`);
    if (res.status !== 200) {
      failures.push(`/charm/${id} status: expected 200, got ${res.status}`);
      checked++;
      continue;
    }
    const html = await res.text();
    if (countClass(html, "charm-story") > 0) pagesWithStory++;
    if (countClass(html, "tag rare") > 0 || countClass(html, "tag grail") > 0) {
      pagesWithRarity++;
      failures.push(`/charm/${id}: rarity badge rendered`);
    }
  }
  checked += 2; // the two aggregate assertions below

  expect("/charm/[id] pages with a story block", pagesWithStory, withStory);
  expect("/charm/[id] pages with a rarity badge", pagesWithRarity, 0);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. check:pages needs the dev branch's connection string " +
        "because every page is force-dynamic and queries it at request time."
    );
  }

  buildApp();
  serverProcess = startServer();

  try {
    await waitForServer();
    await checkHome();
    await checkBrowse();
    await checkCharmPages();
  } finally {
    stopServer();
  }

  if (failures.length > 0) {
    console.error(`check:pages FAILED — ${failures.length} issue(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(
    `check:pages OK — ${checked} assertions passed across / , /browse and ${designCount} /charm/[id] pages ` +
      `(${designCount} designs, ${ownedCount} owned, ${documented} documented, ${withStory} with a story).`
  );
}

main().catch((err) => {
  stopServer();
  console.error(err);
  process.exit(1);
});
