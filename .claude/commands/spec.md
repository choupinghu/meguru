---
name: spec
description: Turn a feature idea into a reviewable Meguru spec file in specs/
---

Create a new feature spec for Meguru from this idea:

$ARGUMENTS

Steps:
1. Read `CLAUDE.md` for context if you haven't this session.
2. Think it through: what it touches in `index.html`, edge cases, how it fits the data model and hard rules.
3. Write the spec to `specs/NNNN-short-slug.md` (next number in sequence) with this shape:
   - **Goal** — one sentence.
   - **Context & files to touch**
   - **Requirements** — numbered, specific, testable.
   - **Out of scope**
   - **Done when** — a checklist to verify.
4. Show me the spec and STOP for review. Do not implement it yet.

(`specs/` is local/untracked — that's expected.)
