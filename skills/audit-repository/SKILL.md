---
name: audit-repository
description: Audit PRs and issues for current relevance, recover actionable backlog, and complete authorized merges or delivery. Use for repository-maintenance and backlog-triage requests; auditing alone does not authorize closing, merging, or deploying work.
---

# Audit Repository

Turn accumulated repository work into evidenced decisions and complete the actions the user authorizes. Covers points 4 and 5 of the original audit list.

## Triage

Read the repository workflow, relevant issues and PRs, current implementation, diffs, review state, and checks. Confirm which repository, branches, and environments the request concerns. Use available connectors or repository tools; distinguish unavailable remote evidence from an empty backlog.

Classify each inspected item as relevant and actionable, already resolved, duplicate or superseded, blocked, or requiring a product decision. Support recommendations with links and current evidence. Age, inactivity, or a green CI run alone does not establish obsolescence or merge readiness. State the scope and pagination limits of the inspection.

Finish straightforward items when the request authorizes implementation, respecting local issue scope and checks. Diagnose stuck approaches before extending them. Keep unrelated contributor work intact.

## Authorized actions

Match actions to the user's actual authorization and repository workflow. An audit produces recommendations; it does not itself permit remote comments, closures, merges, releases, or deployments. Reuse authorization already provided, and prepare the concrete result before requesting any essential additional approval.

Before an authorized closure or other mutation, recheck that its supporting state is current. Before merging, inspect the current PR head, intended base, diff, required checks, reviews, conflicts, and affected behavior. Revalidate when relevant code or the base changes; explain low risk through the actual impact and verification rather than a label.

For authorized delivery, follow the repository's established promotion path, verify the artifact or revision reaches the intended environment, and observe the relevant completion or health signal. Use the existing recovery procedure on failure within its authorization; stop blind retries or further promotion when a stage fails or the outcome is uncertain.

## Result

Report decisions and completed actions separately, with links, revisions, verification evidence, and remaining judgment calls. Do not report a requested or queued operation as completed. Stop after the authorized items and delivery stages are handled; leave unrelated backlog for a later task.
