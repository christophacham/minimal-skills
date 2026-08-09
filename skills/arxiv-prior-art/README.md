# arxiv-prior-art — flow

Grounding rule: in Phase 4 findings must come from the local markdown, always — the instruction says "grounded ONLY in that local file; cite page anchors", enforced by an anti-pattern ("a deep-read report without page-anchored, body-level content is a failed read — re-run it"). The one deliberate exception: if conversion is impossible (e.g. pymupdf missing), the subagent reports the paper as *full-text-unavailable* and stops — it returns nothing rather than improvising from memory. Phases 0–3 are abstract-based by design; only Phase 4 touches full text.

```
                            BUILD PROBLEM
                                 │
                          ┌──────▼──────┐
                          │  GATE (3Q)  │──── any "no" ──→ implement directly,
                          └──────┬──────┘                   no arXiv cost
                                 │ yes
                    ┌────────────▼────────────┐
                    │ P0  CATEGORIZE          │  3–5 arXiv cats + 3–6 mechanism terms
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
        real HTTP   │ P1  FETCH (sequential,  │  export.arxiv.org Atom API
        (no LLM)    │      courtesy delay)    │  → id, title, abstract, links
                    └────────────┬────────────┘
                                 │  abstracts only (~400 tok each)
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        ┌───────────┐      ┌───────────┐      ┌───────────┐
        │ subagent  │      │ subagent  │ ...  │ subagent  │   P2 DIVERGE
        │ paper #1  │      │ paper #2  │      │ paper #N  │   1 paper each,
        │ abstract  │      │ abstract  │      │ abstract  │   isolated, parallel
        └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
              └──────────────────┼──────────────────┘
                                 ▼  {approach, borrow, limitation, relevance}
                    ┌─────────────────────────┐
                    │ P3  CONVERGE            │  score → cluster → pick ONE
                    │  → THE PATH + citations │  citations get roles:
                    └───────────┬─────────────┘  "primary mechanism" (1–3)
                                │
              ┌─────────────────▼──────────────────┐
              │ P4  DEEP-READ (subagent per        │
              │      primary-mechanism paper)      │
              └─────────────────┬──────────────────┘
                                │ each subagent, for its ONE paper:
                                ▼
              ┌──────────────────────────────────────┐
              │ deep_read.py <id> --cache <dir>      │
              │                                      │
              │  cache dir by install scope:         │
              │   global skill → ~/.cache/arxiv-prior-art/      │
              │   project skill → <proj>/.claude/arxiv-prior-art-cache/ │
              │                                      │
              │   ┌─ <id>.md exists? ──yes──→ use it (no-op)     │ STATE 1
              │   │        │no                                   │
              │   ├─ <id>.pdf exists? ─yes──→ convert ──→ <id>.md│ STATE 2
              │   │        │no                     (CPU ~110MB)  │
              │   └─ download arxiv.org/pdf/<id> → convert → md  │ STATE 3
              │                                      │
              │   pymupdf missing? → exit 2 → report "full-text  │
              │   unavailable" + abs URL, STOP (no improvising)  │
              └──────────────────┬───────────────────┘
                                 ▼  local markdown (+ figure PNGs)
                    ┌─────────────────────────┐
                    │ subagent reads the .md  │  grounded ONLY in that file,
                    │ (figures if load-bearing)│ page anchors required
                    └───────────┬─────────────┘
                                ▼  {keyFindings, numbers, caveats, worthMentioning}
                    ┌─────────────────────────┐
                    │ main agent synthesizes  │
                    │ DEEP-READ ADDENDUM      │  corrections beat consistency:
                    │ under THE PATH          │  full text contradicts abstract
                    └─────────────────────────┘  → change the pick, flag loudly
```

Information retrieval in one line: **abstracts come from live HTTP (Phase 1), full text comes from the idempotent local cache (Phase 4), and nothing ever comes from model memory** — every claim traces to either the fetched feed or the cached markdown, or it's explicitly marked unavailable.
