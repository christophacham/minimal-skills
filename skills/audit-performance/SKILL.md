---
name: audit-performance
description: Investigate application bottlenecks with representative measurements and verify requested performance improvements. Use for performance audits, profiling, slow workflows, or resource-cost investigations; do not infer speed improvements from code appearance alone.
---

# Audit Performance

Find improvements that matter to the product and verify their effect without weakening correctness. Covers point 2 of the original audit list.

## Measure and explain

Follow the user's scope and repository instructions. A performance audit produces measurements and recommendations; an optimization request also authorizes the bounded implementation. Preserve existing authorization and resolve routine measurement choices from available workloads and requirements.

1. Define a representative workflow, inputs, build mode, runtime, hardware, concurrency, warm/cold state, and target metric. State correctness, precision, responsiveness, and resource constraints. Label assumptions and unavailable workloads.
2. Establish a repeatable baseline with enough observations to expose variability. Measure relevant latency, throughput, memory, CPU, I/O, or transfer costs. Use profiles or counters to locate the bottleneck; distinguish an end-to-end result from a narrow microbenchmark.
3. Investigate redundant queries, recomputation, loops, serialization, network calls, caching boundaries, rendering, and contention where evidence points. Explain the causal link between proposed work removal or representation changes and the measured cost.
4. When optimization is authorized, make a bounded change and compare equivalent workloads under comparable conditions. Check applicable outputs, ordering, precision, errors, cancellation, and cache invalidation as well as performance. Report regressions and tradeoffs alongside gains.

## Result and completion

Include reproduction commands, baseline and changed measurements, variability, environment, and the scope of the conclusion. Retain raw measurements where the project's workflow expects them. Never present an unmeasured hypothesis, a single lucky run, or reduced work/accuracy as an established improvement.

Stop when the requested target and relevant checks are satisfied. If results fall within noise or the change adds cost without benefit, remove only the experiment's changes unless it has an independently justified benefit within scope. If measurement is blocked, report the missing evidence and a concrete next experiment without claiming a win.
