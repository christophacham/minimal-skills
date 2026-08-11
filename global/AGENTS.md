My name is Christoph. You're my agent. We will be working together a lot, so I thought it would be worth introducing myself.

I work on repos under the `christophacham` and `NonPlanarSlicer` GitHub orgs. Repo-specific `AGENTS.md` files override anything here.

I love to build. I focus on building complex things as simple as possible. I love to find ways to reduce complexity when solving problems.

I wanted to share some of my preferences here so we can be more aligned as we work together.

## Hard no-gos

- **Questions are read-only.** If I ask "what do you think", "how hard would it be", "should we", "is it possible", etc., answer first. Do not edit files unless explicitly asked.
- **No destructive surprises.** Be careful with destructive actions that are not explicitly requested. Never touch production, live databases, or daily-driver build/preview channels unless I explicitly tell you to. Name what you are about to touch before touching anything adjacent to them.
- **No real components first for visual work.** For non-trivial UI, layout, or copy changes, build several distinct static mocks, publish them (e.g., with `html-communication` or as local static files), report the URL/path, and stop for a pick.
- **No unnecessary agents.** Do not spawn subagents or run a multi-agent panel for work a single agent can finish in one pass. Use delegation only for breadth or adversarial review. When several agents work in parallel, state file ownership up front so they do not collide.

## Coding preferences

- Keep things simple. Channel YAGNI unless told otherwise.
- Type safety is useful. Prefer inferred types; `any` is the enemy in TypeScript. Don't write TS like a Python dev.
- Avoid one-line functions that are just casting wrappers.
- Comments are useful to clarify how functions/classes are used. Keep them concise and up to date.
- Tests are good; endless smoke tests and regression tests for deleted features are not. Keep tests focused.

## Rust

- `unwrap()`/`expect()` are for prototypes and tests only. Library and app code returns `Result` with typed errors (`thiserror`); binaries may use `anyhow`.
- Let the type system carry the rules: newtypes over primitives, enums over booleans, invalid states unrepresentable.
- `clone()` to silence the borrow checker is a smell; rethink ownership first.
- Prefer iterators over index loops; use `iter()`, not `.clone().into_iter()`.
- `unsafe` needs a comment stating the invariant it upholds. If you can't write the comment, don't write the `unsafe`.
- Public API docs explain what callers need to know, not internals. `cargo doc` should read clean; clippy clean; no `#[allow]` without a written reason.

## Design and architecture

- Prefer deep modules over small ones: a simple interface hiding real complexity beats many shallow classes. If a name or comment is hard to write, the design is the problem.
- Refactor in small behavior-preserving steps with tests green between each. Never refactor and add features in the same step.
- Dependencies point inward toward business policy: domain code knows nothing about I/O, frameworks, or databases; adapters translate at the boundary.
- Wrap primitives that carry business rules in types that refuse invalid construction (`Email`, `Money`), and put invariants on the type that owns the data.
- Domain logic tests should be pure; use fakes only at boundaries you own; assert call order only when order is part of the contract.

## Visual and design work

- For non-trivial UI changes, build static mocks first and wait for a pick before touching real components.
- Standing constraints: dark mode, true black (`#000`) background, white primary text. Information-dense, no decorative card/pill chrome, no light-gray subtitle lines above sections. Minimal copy. No em dashes.
- Avoid continuously repainting CSS animations (pulse, shimmer, blur, spinners) that peg the GPU on high-refresh displays.

## Pull requests

- Follow the repo's title conventions. Use conventional commits if the project uses them, e.g. `fix(web): new threads no longer spike CPU`.
- Keep descriptions simple: minimal, clear problem statement, then how you solved it.
- Open a real PR, not a draft. Drafts do not get review-bot coverage.
- Rebase onto the latest default branch before opening.
- When asked to monitor a PR: poll checks and comments newer than the last push; verify each bot finding against the source before acting; fix real issues and dismiss false positives with a written reason; fix CI failures, distinguishing real breaks from known infra flakes. Stay quiet if nothing is new. Stop when review bots are green on the latest commit.
- Merge only per the disposition given. If none was given, report and ask.
- When the agent creates the PR description, append a short blurb noting the model and harness used.

## Bold ideas

If a bold idea can meaningfully benefit our work, propose it. Don't gold-plate.
