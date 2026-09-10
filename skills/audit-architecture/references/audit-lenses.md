# Numbered audit lenses

These retain the original 36 concerns. Treat each as a question to investigate, not a defect to find. Apply the main skill's evidence standard to every recommendation.

## Complexity and scale

- **1. Slop audits:** Which dead code, redundant helpers, wrappers, stale comments, defensive branches, or tests provide no current value? Check callers, build variants, and the behavior a test protects before recommending removal.
- **7. Accidental complexity:** Where is a workflow harder to explain than the product problem, and what would express it with fewer concepts?
- **10. Unnecessary concepts:** What would break if a concept disappeared, and could an existing owner absorb its responsibility?
- **15. Simpler architecture:** Compare a minimal greenfield design supporting all required behavior with the current design, then identify incremental migrations with useful checkpoints.
- **16. Premature generalization:** Which extension points or generic machinery serve only hypothetical flexibility, and could current needs use concrete code?
- **18. Deletability:** Rank opportunities by concepts, modules, dependencies, and cognitive load removed against migration cost. Use line reductions as supporting evidence, without a percentage target.
- **21. Unnecessary layers:** Which forwarding layers own no meaningful policy, invariant, transformation, or complexity?
- **26. Configuration complexity:** Which flags, options, selectors, or wiring exist only to sustain an unnecessary abstraction? Preserve configuration with actual consumers or operational value.
- **32. Accidental frameworks:** Do registrations, hooks, DSLs, callback systems, or lifecycle mechanisms earn their cost for the supported use cases?
- **33. Current scale:** Does the structure fit the product's actual team, workload, deployment, and compatibility needs?
- **34. Common path:** Are frequent workflows direct, with exceptional cases contained where their policy belongs?
- **36. Fewer concepts:** Can deletion, combination, narrowing, or relocation solve the problem before introducing a new abstraction?

## Boundaries and understanding

- **8. Shallow modules:** Does an interface require substantial caller knowledge while hiding little complexity? Would deepening, combining, or removing it help?
- **9. Abstraction boundaries:** Are cohesive responsibilities scattered, or implementation details exposed across boundaries? Group by information hiding and change relationships.
- **11. Change amplification:** For representative changes, identify the modules that must change and the decisions forcing coordinated edits.
- **13. Dependency direction:** Trace cycles, domain policy coupled to infrastructure, leaking implementation details, and shared hubs. Explain the concrete cost before proposing inversion or separation.
- **14. Domain model:** Derive concepts, operations, workflows, and invariants from product behavior, then compare them with the implementation's structure.
- **19. Public APIs:** Can callers accomplish their work with fewer operations and less exposure to internal representations?
- **20. Leaky abstractions:** Where must callers understand provider, storage, state-machine, or execution details that the abstraction claims to hide?
- **22. Naming:** Do vague names conceal unclear responsibilities? Rename or move code only when the resulting ownership is more accurate.
- **28. Data-model leakage:** Are storage schemas or ORM objects spreading persistence decisions into unrelated policy? Add a boundary only when it reduces real coupling.
- **30. Required context:** What outside knowledge is needed to understand or safely change a module, and could the owning interface contain it?
- **31. Feature locality:** How scattered is one capability physically and conceptually? Would organizing around that capability localize changes?

## Knowledge, state, and contracts

- **12. Duplicated knowledge:** Find repeated business rules, mappings, validations, transitions, and assumptions even when their syntax differs; identify one authoritative owner.
- **17. State ownership:** For important mutable state, identify its owner, allowed writers, invariant enforcement, and any duplicated or indirectly synchronized representations.
- **23. Temporal coupling:** Does correctness depend on undocumented call order, initialization, or hidden setup? Could the owner contain the sequence or expose a meaningful staged contract?
- **24. Implicit contracts:** Find sentinel values, nullable fields, return shapes, side effects, and ordering assumptions whose meaning is spread across callers.
- **25. Error handling:** Examine swallowed errors, empty catch/rethrow layers, duplicate retries, inconsistent failure models, and leaked low-level errors. Preserve distinctions consumers need, including partial failure and cancellation.
- **27. Concurrency:** Which queues, locks, polling, events, or async flows could be simpler while preserving responsiveness, ordering, cancellation, and isolation requirements?
- **29. Hidden state machines:** Do interacting flags admit impossible combinations? Would an explicit model clarify valid states and transitions?
- **35. Invalid states:** Can construction and mutation enforce invariants at their owner rather than requiring every caller to remember them?

## Other workflows in the original list

- **2. Performance:** Measure representative workflows and resource costs; verify bottlenecks and before/after results through performance investigation.
- **3. Agent verification:** Improve the specific setup, fixtures, commands, diagnostics, or QA capability needed to establish correctness independently.
- **4. PR and issue audit:** Check current relevance, duplicates, completed work, and feasible next actions through repository maintenance.
- **5. Low-risk delivery:** Merge and deploy only within the authorized repository workflow, using current checks and observed outcomes.
- **6. Stuck work:** Re-establish the outcome and diagnose the failed approach; retain, simplify, or replace the implementation within authorized scope, then verify completion.
