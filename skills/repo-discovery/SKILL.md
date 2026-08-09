---
name: repo-discovery
description: >-
  Analyze a repository and create or update CLAUDE.md so future agents can work
  effectively without trial-and-error. Use when the user asks to discover the
  codebase, bootstrap agent context, generate or refresh CLAUDE.md, document
  repo conventions for agents, onboard to an unfamiliar project, or write an
  agent map of commands, architecture, and gotchas. Not for human README
  rewrites, product marketing docs, or inventing conventions that are not in
  the tree.
---

# Repo discovery → CLAUDE.md

Explore the working tree and write (or improve) **`CLAUDE.md`** at the project
root: the agent-facing map of how to work here.

**Human docs stay in `README.md`.** Do not replace README with CLAUDE.md, and
do not dump CLAUDE.md content into README unless the user asks.

## Hard stop — empty tree

Before any write:

1. List the project root (`ls` / directory listing).
2. If the directory is empty, or only contains config/tooling with **no
   application or library source** (e.g. only `.git`, editor config, empty
   package stubs with no `src`/`lib`/`app` code), **stop**.
3. Tell the user: *Directory appears empty or only contains config. Add source
   code first, then re-run repo discovery.*

Do not invent a map for a repo that has nothing to map.

## Goal

Document what an agent needs to **act safely and efficiently** in this
codebase:

- Essential commands (build, test, lint, run, deploy — only those that exist)
- Layout and how major parts fit together (control/data flow at a useful grain)
- Naming and style patterns that are **project-specific**
- Testing approach and where tests live
- Gotchas, non-obvious conventions, hard no-gos
- Pointers into existing rule files (do not duplicate them wholesale)

## Progressive disclosure (quality bar)

Agents already read files well. **Obvious** facts they would learn from one
or two source files are actively harmful in CLAUDE.md — noise that crowds out
signal.

Prefer:

| Keep | Drop |
|------|------|
| Gotchas and implicit conventions | File-by-file API tours |
| Commands with surprising flags or cwd requirements | Restating standard language idioms |
| Cross-cutting architecture and ownership boundaries | Listing every package dependency |
| Hard bans / do-not-touch areas | Generic “write clean code” advice |
| Where truth lives (which doc/config wins) | Duplicating long README sections |

Aim for **completeness of non-obvious knowledge**, not maximum length.

## Discovery process

Run these in order. Use tools; do not guess.

1. **Root inventory** — list top-level files and directories; note monorepo vs
   single package; note primary languages.
2. **Existing agent/rule files** — only if present, read and reconcile:
   - `CLAUDE.md` (update in place; do not discard hard no-gos without cause)
   - `AGENTS.md`, `agents.md`
   - `.cursor/rules/**`, `.cursorrules`
   - `.github/copilot-instructions.md`
   - `CONTRIBUTING.md`, `docs/**` that agents are told to follow
3. **Project type** — from config and layout only:
   - `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`,
     `build.gradle*`, `Gemfile`, `composer.json`, `*.csproj`, `Makefile`, etc.
   - `Dockerfile*`, `docker-compose*`, infra dirs if they define how the app runs
4. **Commands** — extract from:
   - package scripts, Makefile targets, Taskfile, justfile
   - CI workflows (`.github/workflows/**`, etc.) — real invoked commands
   - documented scripts in README **only if** they match files that exist
5. **Representative source** — read a small set of entrypoints, core modules,
   and tests to learn patterns, layering, and control/data flow. Prefer
   breadth of *kinds* of files over reading everything.
6. **Improve existing CLAUDE.md** — if it exists, treat it as the base: keep
   accurate sections, fix drift, add missing non-obvious items, remove stale
   or invented content.

## Content to include (when observed)

Use judgment on section order; adapt headings to the repo. Typical useful map:

```markdown
# CLAUDE.md — <repo-name>

One-line what this repo is (and what it is not).

## Hard no-gos
(Only real bans found in rules, code comments, or consistent practice.)

## Commands
(Exact commands that work from a stated cwd. Note required env/tools.)

## Layout
(Where skills/packages/apps live; who owns what.)

## Architecture / flow
(How requests or jobs move; key boundaries.)

## Conventions
(Naming, error handling, logging, PR/branch norms — if project-specific.)

## Testing
(How to run; where tests live; patterns that differ from language defaults.)

## Gotchas
(Surprising flags, caches, dual UIs, cross-scope rules, version pins, …)

## Pointers
(README, pattern essays, internal docs — paths only, short why.)
```

Omit any section with nothing real to say.

## Critical rules

1. **Only document what you observe.** Never invent commands, scripts, flags,
   env vars, architecture layers, or conventions. If you cannot find it, omit it.
2. **Prefer paths and commands over prose.** Agents navigate by file paths and
   runnable lines.
3. **Do not “improve” the product** while discovering — discovery writes
   CLAUDE.md (and only other files the user explicitly asked to update).
4. **Search / frozen / banned areas** — if existing CLAUDE.md or rules mark
   areas off-limits, preserve those bans verbatim unless the user overrides.
5. **Secrets** — never copy tokens, keys, or credentials into CLAUDE.md.
6. **Scope** — default output path is project-root `CLAUDE.md`. Only write a
   different agent file if the user names it explicitly.

## Done criteria

- Empty-tree guard applied when relevant
- CLAUDE.md created or updated from evidence in the tree
- Commands listed are copy-pasteable and verified against config/CI/scripts
- No invented conventions
- Non-obvious knowledge prioritized over tour-guide filler

When finished, briefly state what was written or changed (paths + section
names), not a full dump of the file.
