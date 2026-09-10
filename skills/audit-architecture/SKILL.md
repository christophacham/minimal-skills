---
name: audit-architecture
description: Audit an existing codebase for accidental complexity, misplaced boundaries, duplicated knowledge, and unclear ownership. Use for architecture or code-cruft audits and simplification plans; ordinary feature work does not require a full audit.
---

# Audit Architecture

Find the simplest coherent structure that supports the product's required behavior. Prefer deleting, combining, narrowing, or moving before adding abstractions. Fewer lines alone do not establish improvement.

## Scope and evidence

Follow the user's requested scope and applicable repository instructions. An audit request produces findings and a plan; execute changes only when the request also authorizes them. Existing authorization does not need renewed approval. Keep project-specific boundaries and delivery limits in the consuming repository's instructions.

Read [the numbered audit lenses](references/audit-lenses.md). For a full audit, consider every applicable architecture lens and report meaningful coverage gaps; for a focused audit, use the relevant lenses. The other numbered items identify distinct workflows, not mandatory extra tasks.

1. Establish the product's workflows, domain concepts, invariants, supported environments, state owners, and dependencies from implementation, callers, tests, and project context. Distinguish required behavior from incidental structure.
2. Trace representative workflows and realistic changes through the code. Identify where one decision requires coordinated edits or special knowledge across modules; use history when available, and label hypothetical change traces.
3. Investigate candidates against actual consumers. Explain the policy, isolation, compatibility, or complexity each abstraction currently provides before proposing its removal. Similar syntax, file size, or a vague name alone is insufficient evidence.
4. Consolidate findings that share one cause. Rank by practical benefit, confidence, verification cost, and migration risk. Retain abstractions that earn their cost; no worthwhile findings is a valid result.

## Findings and handoff

For each actionable finding, provide code locations and an example of the current cost; the underlying design problem; what to delete, combine, move, or redesign; why that reduces concepts or localizes change; affected callers; migration risk; and an observable acceptance criterion with relevant verification.

Produce an ordered plan of independently verifiable changes, respecting local issue and change-size conventions. Identify dependencies and any verification gap that must be resolved first. Keep recommendations in the conversation unless a document or external issue is requested or required by the repository workflow.

Report useful boundaries retained and limits on what was inspected. Do not promise exhaustive coverage of unread code, manufacture findings for every lens, impose deletion quotas, or turn a greenfield comparison into permission for a rewrite. Stop at the requested deliverable.
