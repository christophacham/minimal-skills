My name is Christoph. You're my agent. We will be working together a lot, so I thought it would be worth introducing myself.

I work on git repos under the christophacham and NonPlanarSlicer GitHub orgs.

I love to build. I focus on building complex things as simple as possible. I love to find ways to reduce complexity when solving problems.

I wanted to share some of my preferences here so we can be more aligned as we work together.

## Coding preferences - general

- Keep things simple. Channel "yagni" energy unless told otherwise.
- Typesafety is useful, take advantage of it.
- Don't be scared to propose bold ideas if they can meaningfully benefit our work.
- Be careful with destructive actions that are not explicitly requested by the user.
- Tests are good! Endless smoke tests, "regression tests" for feature deletions, etc, much less good. Tests should be focused, not slop.
- Comments are a great way to clarify functionality and how code is used. Don't comment every line, but feel free to describe (concisely) how functions are used above function definitions, classes, etc.
- Keep comments up to date! When making changes, it's important to keep things in sync.

## Coding preferences (Typescript focused)

- `any` is the enemy. Inferred types are our friend. Our systems should adapt to changes, instead of requiring changes everywhere.
- If your TS code looks like a Python dev wrote it, it is bad TS code.
- Avoid one-line functions that are just casting wrappers.

## Coding preferences (Rust focused)

- `unwrap()` and `expect()` are for prototypes and tests. Library and app code returns `Result` with typed errors (`thiserror`); binaries may use `anyhow`.
- Let the type system carry the rules: newtypes over bare primitives, enums over booleans, make invalid states unrepresentable.
- `clone()` to silence the borrow checker is a smell. Rethink ownership or lifetimes first.
- Prefer iterators over index loops; `iter()`, not `.clone().into_iter()`.
- `unsafe` needs a comment stating the invariant it upholds. If you can't write the comment, don't write the `unsafe`.
- Public API docs explain what callers need to know, not how the internals work. `cargo doc` should read clean.
- Warnings are errors: clippy clean, no `#[allow]` without a reason written next to it.

## Questions are read-only

- A question is a request for an answer, not for changes. If the message opens with "how hard would it be", "what are your thoughts", "why does", "should we", "is it possible", "can X do Y", or otherwise asks rather than instructs: answer it, and do not edit files.
- If the answer is obvious and the change is trivial, still answer first and offer the change. Ask before making it.

## Match ceremony to the task

- Do not spawn subagents or a multi-agent panel for work a single agent finishes in one pass. Delegation is for breadth or adversarial review, not for ordinary tasks.
- When several agents do work in parallel, state file ownership up front so they do not collide.

## Visual and design work

- Do not edit real components first. For any non-trivial UI, layout, or copy change, build several distinct static mocks, publish them with the `html-communication` skill, report the URL, and stop. Wait for a pick before implementing.
- Standing constraints: dark mode, true black (`#000`) background, white primary text. Information-dense, no decorative card/pill chrome, no light-gray subtitle lines above sections. Minimal copy. No em dashes.
- Avoid continuously repainting CSS animations (pulse, shimmer, blur, spinners); they peg the GPU on high-refresh displays.

## Blast radius

- Never touch production, live databases, or daily-driver build/preview channels unless explicitly told to. When a task is adjacent to any of them, name what you are about to touch before touching it.

## Coding preferences - design and architecture

- Prefer deep modules over small ones: a simple interface that hides real complexity beats many shallow classes, and if a name or comment is hard to write the design is the problem.
- Refactor in small behavior-preserving steps with tests green between each, and never refactor and add features in the same step.
- Dependencies point inward toward business policy: domain code knows nothing about I/O, frameworks, or databases, and adapters translate at the boundary.
- When a primitive carries a business rule, wrap it in a type that refuses invalid construction (`Email`, `Money`), and put invariants on the type that owns the data.
- Domain logic tests should be pure; use fakes only at boundaries you own, and assert call order only when order is part of the contract.

## Pull Requests

- Make sure titles follow conventions from the repo. They should be simple and easy to understand. Conventional commit styles in projects that use them, i.e. "fix(web): new threads no longer spike CPU"
- PR descriptions should aim for simplicity. Open with a minimal, clear description of the problem. Follow up with how you solved it.
- Add a blurb to the end of the PR description about what model and harness is making the changes.
- **Open a real PR, not a draft.** Drafts do not get review-bot coverage.
- **Rebase onto latest `main` before opening.** Stale branches conflict and waste a review round.
- When asked to monitor or babysit a PR: poll checks and comments newer than the last push; verify each bot finding against the source before acting on it; fix real ones and dismiss false positives with a written reason; fix CI failures, distinguishing real breaks from known infra flakes. If nothing is new, stay quiet — do not post filler comments. Stop when the repo's review bots are green on the latest commit.
- Merge only per the disposition given in the request (merge when green, or stop and report). If none was given, report and ask.
