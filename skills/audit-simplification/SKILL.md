---
name: audit-simplification
description: Assess or implement a bounded code simplification, including recovering a stuck branch or failed implementation approach. Use for acting on architecture findings or simplifying existing work; a broad architecture audit or ordinary feature request alone does not require this skill.
---

# Audit Simplification

Turn an evidenced design problem into a smaller, understandable implementation while preserving required behavior. Covers point 6 and implementation of agreed architecture findings.

## Establish the change

Follow the user's scope and repository workflow, including issue agreement and change-size limits where applicable. Assessment alone produces a recommendation. If implementation is already authorized, complete it without adding a new approval gate. Preserve local work and identify the affected implementation, callers, tests, and compatibility requirements before editing.

State the concrete outcome and the behavior that must remain: outputs, errors, state transitions, ordering, numerical precision, cancellation, persistence, and supported platforms as relevant. Choose a verification path that can distinguish a successful structural change from a regression.

For stuck work, inspect the original objective, existing diff, checks, and prior failure evidence. Diagnose whether the obstacle is an incorrect premise, implementation defect, verification gap, or missing requirement. Compare retaining, simplifying, and replacing the approach; do not repeat failed attempts without new evidence. Replacement must remain within the authorized scope and preserve unrelated work through a recoverable checkpoint.

## Implement and verify

Prefer deleting, combining, narrowing, or moving code. Add an abstraction only when it hides meaningful complexity or gives a real rule or state one owner. Check whether a small preparatory structural step would reduce risk; avoid unrelated cleanup and speculative flexibility.

Keep changes independently understandable and verifiable. Follow repository conventions for structural refactoring; preserve required behavior and distinguish any explicitly requested behavior change. Add focused coverage only where existing checks cannot establish a realistic regression.

Run appropriate checks and the required completion checks. Inspect the final diff for unrelated changes, lost contracts, displaced complexity, or caller work created by an apparently smaller implementation. Reassess the approach when evidence contradicts it; an independently sound existing design may warrant no edit.

Report what became simpler, which behavior was verified, and any unresolved limits. Stop after the agreed change, rather than automatically starting the next finding or continuing a cleanup loop.
