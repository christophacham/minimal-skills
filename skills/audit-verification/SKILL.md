---
name: audit-verification
description: Audit and improve the ability to verify changes independently, including setup, test commands, fixtures, diagnostics, and realistic QA flows. Use when verification is unreliable or missing, or an agent-DX audit is requested; routine testing alone does not require this skill.
---

# Audit Verification

Make a concrete change or workflow independently verifiable with the least necessary tooling. Covers point 3 of the original audit list.

## Approach

Follow the user's scope and applicable repository instructions. For an audit, diagnose gaps and propose remedies. When improvement is authorized, complete the relevant remedy without asking again for routine decisions. Do not turn a local verification problem into a new platform or broad tooling project.

1. Identify the behavior that needs evidence, its failure modes, and the kind of evidence required: unit, integration, end-to-end, packaged-runtime, or benchmark. Inspect the implementation, callers, existing checks, setup instructions, and fixtures.
2. Attempt the documented verification path where feasible. Distinguish missing prerequisites, broken tooling, flaky checks, weak assertions, poor diagnostics, and actual product failures. Record the command and useful failure evidence without exposing credentials or private fixture data.
3. Choose the smallest remedy tied to that gap: a repeatable setup step, meaningful fixture, focused test, diagnostic, debug command, or correction to existing documentation. Use staging or external systems only when that is necessary and within the task's authorization.
4. For authorized improvements, exercise the complete path. Where meaningful, demonstrate that the check detects the relevant failure using an isolated controlled case or temporary fault, then restore it. Do not weaken assertions, silently skip failed checks, or replace real boundary evidence with mocks.

## Result and completion

Report the original obstacle, the change or recommendation, how to reproduce verification, what behavior the evidence establishes, and what remains unverified. Claim a clean-environment or packaged-runtime check only if performed.

Add tests for meaningful behavior or realistic regressions missing from existing coverage. Run checks appropriate to the change and complete required checks; broaden or repeat them only for new changes, failures, or unresolved concerns. Existing adequate verification is a valid finding. Stop once the requested verification gap is resolved or its concrete blocker is established.
