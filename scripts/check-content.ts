/**
 * Tier 1 (spec 0015): static content checks against `scripts/seed-data.ts`.
 * No server, no database, no secrets, no environment variables — this must
 * be safe to run in CI on every push and PR with nothing but `npm ci`.
 *
 * Imports ONLY from `./seed-data`, never `./seed` — `seed.ts` ends in a bare
 * `main().catch(...)` that TRUNCATEs `items`/`designs` the moment it loads
 * (see D1 in specs/0015-checks-and-ci.md). Importing it here would run the
 * seed as a side effect of a "read-only" check.
 *
 * Each assertion below maps to a CLAUDE.md invariant or a silent-failure mode
 * that has nearly shipped (see the spec's "Why, concretely" table). Every
 * failure prints one line naming the offending row before the run exits
 * non-zero; a passing run still prints a one-line summary of what it checked
 * so success is visible too, not just silent.
 */
import { DOCUMENTED, OWNED, OWNED_RAW, SPECIAL_NOS, STORIES, UNPLACED } from "./seed-data";

const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

// ---------------------------------------------------------------------------
// Content safety (invariant 3: an item's `note` is public)
// ---------------------------------------------------------------------------

// 1. No note reads like an internal cataloguer's reasoning rather than a
// public remark about the physical item. Calibrated against the current 25
// notes: "only" (0012's "the only aquarium...") and "unnamed on card" (0008)
// must NOT trip this, so the pattern targets first-person/hedging phrasing
// specifically, not any occurrence of "only".
const CATALOGUER_PHRASING =
  /\bconfirmed\b|would settle|likely origin|\bmy reading\b|\bpresumably\b|\bI assume\b/i;
for (const row of OWNED_RAW) {
  if (CATALOGUER_PHRASING.test(row.note)) {
    fail(`OWNED_RAW ${row.no} (${row.name}): note reads like cataloguer reasoning, not a public note — "${row.note}"`);
  }
}

// 2. No note or story runs past 600 characters — a ceiling on runaway prose,
// not a style rule. The longest note shipped publicly was 383 and the
// longest story is 484.
const MAX_LEN = 600;
for (const row of OWNED_RAW) {
  if (row.note.length > MAX_LEN) {
    fail(`OWNED_RAW ${row.no} (${row.name}): note is ${row.note.length} chars, over the ${MAX_LEN} ceiling`);
  }
}
for (const [no, story] of Object.entries(STORIES)) {
  if (story.length > MAX_LEN) {
    fail(`STORIES ${no}: story is ${story.length} chars, over the ${MAX_LEN} ceiling`);
  }
}
for (const d of DOCUMENTED) {
  if (d.story && d.story.length > MAX_LEN) {
    fail(`DOCUMENTED "${d.name}": story is ${d.story.length} chars, over the ${MAX_LEN} ceiling`);
  }
}

// ---------------------------------------------------------------------------
// Data integrity (silent failures — a typo here changes the site and
// reports nothing)
// ---------------------------------------------------------------------------

const ownedNos = new Set(OWNED_RAW.map((r) => r.no));

// 3. Every STORIES key matches an existing OWNED_RAW.no. A typo'd key is a
// write-up that never renders and never errors.
for (const no of Object.keys(STORIES)) {
  if (!ownedNos.has(no)) {
    fail(`STORIES key "${no}" does not match any OWNED_RAW.no — write-up will never render`);
  }
}

// 4. Every SPECIAL_NOS / UNPLACED key matches an existing OWNED_RAW.no.
// SPECIAL_NOS sets price and UNPLACED sets isCollab/brand/rarity, so a typo
// here mis-prices a charm silently.
for (const no of SPECIAL_NOS) {
  if (!ownedNos.has(no)) {
    fail(`SPECIAL_NOS entry "${no}" does not match any OWNED_RAW.no`);
  }
}
for (const no of Object.keys(UNPLACED)) {
  if (!ownedNos.has(no)) {
    fail(`UNPLACED key "${no}" does not match any OWNED_RAW.no`);
  }
}

// 5. No two designs share the same story text — the failure mode that had to
// be ruled out by hand for 0007b (a write-up pasted onto the wrong design).
{
  const seen = new Map<string, string>();
  const allStoried: { label: string; story: string }[] = [
    ...DOCUMENTED.filter((d) => d.story).map((d) => ({ label: `DOCUMENTED "${d.name}"`, story: d.story! })),
    ...OWNED.filter((d) => d.story).map((d) => ({ label: `OWNED ${d.no} (${d.name})`, story: d.story! })),
  ];
  for (const { label, story } of allStoried) {
    const prior = seen.get(story);
    if (prior) {
      fail(`Duplicate story text between ${prior} and ${label}`);
    } else {
      seen.set(story, label);
    }
  }
}

// 6. No two designs share the same name.
{
  const seen = new Map<string, string>();
  const allNamed: { label: string; name: string }[] = [
    ...DOCUMENTED.map((d) => ({ label: `DOCUMENTED "${d.name}"`, name: d.name })),
    ...OWNED.map((d) => ({ label: `OWNED ${d.no} (${d.name})`, name: d.name })),
  ];
  for (const { label, name } of allNamed) {
    const prior = seen.get(name);
    if (prior) {
      fail(`Duplicate name "${name}" between ${prior} and ${label}`);
    } else {
      seen.set(name, label);
    }
  }
}

// 7. Every design has a non-null motif. 0008b's proof that the motif chip
// escaped `items.map()` depends on this being true of all of them.
for (const d of DOCUMENTED) {
  if (!d.motif) fail(`DOCUMENTED "${d.name}": motif is missing`);
}
for (const d of OWNED) {
  if (!d.motif) fail(`OWNED ${d.no} (${d.name}): motif is missing`);
}

// 8. Every prefectureCode is null or an integer 1-47.
function validCode(code: number | null | undefined): boolean {
  return code == null || (Number.isInteger(code) && code >= 1 && code <= 47);
}
for (const d of DOCUMENTED) {
  if (!validCode(d.code)) {
    fail(`DOCUMENTED "${d.name}": prefectureCode ${d.code} is out of range 1-47`);
  }
}
for (const d of OWNED) {
  if (!validCode(d.prefectureCode)) {
    fail(`OWNED ${d.no} (${d.name}): prefectureCode ${d.prefectureCode} is out of range 1-47`);
  }
}

// ---------------------------------------------------------------------------
// Structure (invariant 1: nothing unowned can show a price)
// ---------------------------------------------------------------------------

// 9. No DOCUMENTED entry carries a price/cond/status key. The TypeScript
// type already forbids this; assert it at runtime too, because the type is
// only as good as the next person's `as`.
for (const d of DOCUMENTED) {
  const asAny = d as unknown as Record<string, unknown>;
  for (const forbidden of ["price", "cond", "status"]) {
    if (forbidden in asAny) {
      fail(`DOCUMENTED "${d.name}": carries a forbidden "${forbidden}" key — a documented design must be structurally unable to price or condition itself`);
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`check:content FAILED — ${failures.length} issue(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

const designCount = DOCUMENTED.length + OWNED.length;
const withStory = [...DOCUMENTED, ...OWNED].filter((d) => d.story).length;
console.log(
  `check:content OK — ${designCount} designs (${DOCUMENTED.length} documented, ${OWNED.length} owned), ` +
    `${withStory} write-ups, ${OWNED_RAW.length} notes checked, 9/9 assertions passed.`
);
