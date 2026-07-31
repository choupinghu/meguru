/**
 * Google Drive is the source of truth for charm photos; this pulls them local.
 *
 * The shared Drive folder is where new photos actually appear — your friend
 * shoots and adds them there. Local copies exist only so the processing
 * pipeline has stable files to read, so they must never be authoritative:
 * a frozen copy silently goes stale the moment anything is added or re-shot.
 *
 * Run this to refresh, and to be told what changed:
 *   node scripts/sync-photos.mjs            (report only, changes nothing)
 *   node scripts/sync-photos.mjs --apply    (copy new and updated files down)
 *
 * Reports four things against photos/manifest.csv:
 *   new in Drive        - a photo nobody has identified yet
 *   updated in Drive    - re-shot; the local copy is stale
 *   missing from Drive  - renamed or deleted upstream; the manifest is stale
 *   local-only          - left behind after an upstream rename
 *
 * Drive is reached through a shortcut into a folder someone else owns, so the
 * path runs via .shortcut-targets-by-id rather than "My Drive". That id is
 * stable; the human-readable name is not.
 */
import { readFileSync, existsSync, copyFileSync, statSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DRIVE =
  "/Users/aaronchou/Library/CloudStorage/GoogleDrive-aaronchouhx@gmail.com/.shortcut-targets-by-id/17rgedbgi_VhzMwRtAKVeuCbZbc0LMc22/Hello Kitty Gotochis";
const LOCAL = "photos/named";
const MANIFEST = "photos/manifest.csv";
const apply = process.argv.includes("--apply");

if (!existsSync(DRIVE)) {
  console.error("Drive folder not reachable. Is Google Drive running and the shortcut intact?");
  console.error("  expected: " + DRIVE);
  process.exit(1);
}
mkdirSync(LOCAL, { recursive: true });

// manifest rows -> expected filenames (quoted-CSV aware enough for our columns)
const rows = readFileSync(MANIFEST, "utf8").trim().split("\n").slice(1);
const expected = new Map();
for (const line of rows) {
  const cells = [];
  let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur);
  const [no, , slug] = cells;
  if (no && slug) expected.set(`${no}_${slug}.jpg`, no);
}

const inDrive = readdirSync(DRIVE).filter((f) => /\.jpe?g$/i.test(f));
const inLocal = readdirSync(LOCAL).filter((f) => /\.jpe?g$/i.test(f));

const news = [], updated = [], missing = [], localOnly = [];

for (const f of inDrive) {
  const l = join(LOCAL, f), d = join(DRIVE, f);
  if (!expected.has(f)) news.push(f);
  if (!existsSync(l)) { if (expected.has(f)) updated.push(f); continue; }
  const a = statSync(d), b = statSync(l);
  if (a.size !== b.size) updated.push(f);
}
for (const f of expected.keys()) if (!inDrive.includes(f)) missing.push(f);
for (const f of inLocal) if (!inDrive.includes(f)) localOnly.push(f);

const show = (label, list, note) => {
  if (!list.length) return;
  console.log(`\n  ${label} (${list.length})${note ? " — " + note : ""}`);
  list.forEach((f) => console.log("    " + f));
};

console.log(`  Drive: ${inDrive.length} photos | local: ${inLocal.length} | manifest: ${expected.size} rows`);
show("new in Drive", news, "not in the manifest yet, so unidentified");
show("updated in Drive", updated, "local copy is stale");
show("missing from Drive", missing, "renamed or deleted upstream — manifest is stale");
show("local-only", localOnly, "probably left behind by an upstream rename");

const toCopy = [...new Set([...news, ...updated])];
if (!toCopy.length) {
  console.log("\n  Everything in sync.");
} else if (!apply) {
  console.log(`\n  ${toCopy.length} file(s) would be copied. Re-run with --apply.`);
} else {
  for (const f of toCopy) copyFileSync(join(DRIVE, f), join(LOCAL, f));
  console.log(`\n  Copied ${toCopy.length} file(s) into ${LOCAL}/.`);
  if (news.length) console.log("  Note: the new ones still need identifying and adding to the manifest.");
}
