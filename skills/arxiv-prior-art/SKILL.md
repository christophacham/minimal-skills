---
name: arxiv-prior-art
description: >-
  Check arXiv prior art before committing to a non-trivial architecture,
  algorithm, or protocol. Fetches real papers over HTTP, reads each abstract
  in an isolated parallel agent call, then converges on ONE recommended path
  with citations, a first step, and known pitfalls — then optionally
  deep-reads the winning papers as locally cached full-text markdown via
  one subagent per paper. Use when the user asks
  "has anyone solved this", "what's the state of the art", "am I rebuilding
  something that exists", or before designing caching, ranking, consensus,
  retrieval, ML, or coordination mechanisms. Skip for CRUD, glue code, or
  when the user already named the approach ("just do X the simple way").
disable-model-invocation: true
---

# arXiv prior art

Before building something non-trivial, check whether the hard part is
already solved and published — with its failure modes documented. This
skill makes the agent read arXiv **first**, then commit to one path.

The skill is expensive: real HTTP fetches plus roughly one agent call per
paper (~10–20), then scoring and convergence — plus optionally 1–3
deep-read subagents on full text (Phase 4). Do not pay that cost when
there is no real prior-art question.

## Gate — decide whether to run at all

Skip this section if the user explicitly asked to check arXiv / prior art
or invoked the skill by name. Otherwise answer three questions; **abort on
any "no"** and just implement directly:

1. **Is there a technical mechanism to research?** Variable naming, CRUD
   forms, gluing documented SDKs — no. Caching strategy, consensus,
   ranking/retrieval, ML technique, novel protocol, anything where "the
   naive version breaks at scale" — yes.
2. **Is real effort about to be committed?** A one-off script doesn't earn
   a literature search. A component that anchors the architecture, or is
   expensive to redo once built wrong, does.
3. **Did the user leave the approach open?** If they already named the
   algorithm/paper/library, or said "just do it the simple way", they've
   converged — don't re-open it.

On abort, optionally add one sentence: *"If you want this checked against
arXiv prior art first, ask me to run the arxiv-prior-art skill."*

## The loop

Fetch → read each paper in isolation → converge. Skipping the isolation
step turns this into an LLM guessing about papers it never read.

### Phase 0 — Categorize

Map the problem onto 3–5 arXiv categories and 3–6 concrete search terms —
the mechanism words ("cache invalidation", not "caching system").

| Category | Covers |
|---|---|
| cs.AI | agents, planning, knowledge representation |
| cs.LG | learning algorithms, training, model architectures |
| cs.CL | NLP, language models, text processing |
| cs.CV | image/video understanding, generation, perception |
| cs.IR | search, ranking, recommendation, retrieval-augmented systems |
| cs.DC | distributed systems, consensus, sharding, replication |
| cs.DB | storage engines, query processing, indexing, transactions |
| cs.SE | dev practices, testing, program analysis, tooling |
| cs.PL | language design, type systems, compilers, runtimes |
| cs.CR | protocols, authentication, adversarial robustness, privacy |
| cs.OS | kernels, schedulers, memory management, virtualization |
| cs.MA | coordination and emergent behavior among agents |
| cs.DS | algorithmic techniques, complexity, data structures |
| stat.ML | statistical learning theory, probabilistic models |
| math.OC | optimization, scheduling, resource allocation |

Name another category id if confident of it. If the problem is framed in
pure product/business terms, commit to a best-effort technical angle —
most build problems have one (caching, consistency, ranking, scheduling).

### Phase 1 — Fetch (real HTTP, never from memory)

For each category, fetch arXiv's export API — actually fetch it, do not
paraphrase from memory:

```
https://export.arxiv.org/api/query?search_query=cat:<CATEGORY>+AND+(all:"<term1>"+OR+all:"<term2>")&start=0&max_results=4&sortBy=relevance&sortOrder=descending
```

Extract per `<entry>`, verbatim from the feed: arXiv id, title, abstract,
authors, published date, abs/pdf links. Treat every field as ground truth;
never invent a paper, id, or detail not present in the response.

- Fewer than 2 results in a category → retry that category with the terms
  dropped (`cat:<CATEGORY>` alone). Do not pad with irrelevant hits.
- Everything thin → say so in the output; don't manufacture findings.
- **Courtesy:** arXiv asks for one request at a time. Fetch categories
  sequentially with a few seconds between calls, not concurrently.

### Phase 2 — Diverge (isolated reads, in parallel)

Spawn one parallel agent call **per paper**. Each agent gets only: the
build problem, that ONE paper's title/abstract/authors/year, and this
instruction:

> You are in DIVERGENT READ mode. You have exactly one paper's abstract
> and one build problem. You do not know what other papers exist — do not
> assume or gesture at a broader survey. Paraphrase; never quote the
> abstract beyond a few consecutive words. Extract:
> - approach — 1–2 sentences, the core mechanism
> - borrow — 1 sentence, the single most concrete implementable takeaway,
>   imperative ("Use X to do Y"); say plainly if too tangential
> - limitation — 1 sentence, the load-bearing weakness or breaking
>   condition
> - relevanceNote — 1 short clause on fit to the stated problem
>
> Output JSON only:
> `{"approach":"...","borrow":"...","limitation":"...","relevanceNote":"..."}`

**Critical invariant.** The reads must be parallel and isolated. A read
that has seen other abstracts starts summarizing the SET instead of
grounding in the ONE paper in front of it — and the output still looks
paper-specific, so the failure is easy to miss.

### Phase 3 — Converge (one path, not a shortlist)

1. **Score** each reading 0–10 on relevance (fit to the problem),
   practicality (buildable by a small team without exotic infra), rigor
   (abstract shows real evidence — benchmarks, proofs, a shipped system —
   vs pure concept). Flag a **trap** when a paper's own stated limitation
   implies a failure mode a builder would otherwise rediscover the hard
   way; pair it with the **strength** that paper gets right.
2. **Cluster** readings into 3–6 groups by underlying architectural angle
   (not by keyword): "cache-invalidation plays", "learned-index plays".
3. **Pick ONE** cluster — strongest relevance + practicality, not the
   most novel or most cited. Committing to a single recommendation is the
   point; "here are 4 papers, you decide" is the time-wasting this skill
   exists to prevent.
4. **Synthesize** for the chosen cluster: a 4–8 sentence implementation
   sketch (actionable, not a lit review); citations (id + title + url +
   role — "primary mechanism" / "supporting evidence" / "failure mode to
   avoid"); the first concrete step; the load-bearing risk; an avoid-list
   pulled from **every** paper's limitation — a pitfall named by a paper
   in a rejected cluster is still worth avoiding.
5. **Name the runner-ups** — one honest sentence per non-chosen cluster
   on the real trade-off that lost it the pick, so the builder can switch
   paths later knowing why.
6. **One open thread** — a question the papers raise but don't answer,
   worth a design-review checkpoint before shipping.

### Phase 4 — Deep-read the winners (subagent per paper)

Phases 0–3 run on abstracts (~400 tokens each) — enough to pick a path,
not to implement one. Phase 4 pays full-text cost only for the papers THE
PATH cites as **primary mechanism** (1–3, never the whole net). Skip it
when the user asked for a quick scan or the pick is advisory only.

**Cache resolution (done inside each subagent, not by you).** Each paper's
full text lives in a scope-following cache dir, keyed by arXiv id:

- This skill installed **globally** (`~/.agents/skills/…`) → cache at
  `~/.cache/arxiv-prior-art/` — shared across all projects.
- Installed **in the project** (`.agents/skills/…`) → cache at
  `<project>/.agents/arxiv-prior-art-cache/` — travels with the project.

Derive which case applies from where this SKILL.md actually lives.

**Spawn one subagent per primary-mechanism paper, parallel and isolated**
— the same invariant as Phase 2: each agent sees exactly one paper. Give
each agent: the build problem, the paper's id/title, the cache dir, and
this instruction:

> You are in DEEP-READ mode for exactly one paper. Do not assume or
> gesture at other papers.
> 1. Resolve the full text locally:
>    `python3 <skill-dir>/scripts/deep_read.py <arxiv-id> --cache <cache-dir>`
>    The script is three-state idempotent: markdown cached → uses it;
>    only the PDF cached → converts; neither → downloads from arXiv then
>    converts. The last stdout line is the markdown path. If it exits
>    non-zero (e.g. pymupdf missing), report the abs URL as
>    full-text-unavailable and stop — do not improvise a summary from
>    memory.
> 2. Read the markdown (page anchors `<!-- page N -->` included). Open
>    extracted figure PNGs only when a diagram is load-bearing.
> 3. Report findings grounded ONLY in that local file; cite page anchors
>    for anything non-obvious. No outside knowledge, no abstract-level
>    paraphrase — the point is what the body adds.
> Output JSON only:
> `{"keyFindings":["..."],"numbers":["..."],"caveats":["..."],"worthMentioning":["..."]}`
> — keyFindings: mechanism specifics that matter for the build problem
> (parameters, thresholds, algorithm steps); numbers: concrete results
> worth citing; caveats: limitations stated in the body, not the abstract;
> worthMentioning: anything unexpected (datasets, code links, related
> techniques) a builder would want to know.

**Synthesize a deep-read addendum** under THE PATH: implementation-level
details per paper, the confirmed numbers, new caveats, and an updated
avoid-list. **Corrections beat consistency** — if the full text
contradicts the abstract-level read (a withdrawn result, a benchmark at
only one scale, a claim the body doesn't support), say so explicitly and
adjust the recommendation; that correction is the highest-value output of
this phase.

## Output shape

1. **Searched.** Categories, search terms, paper count.
2. **Papers read.** Grouped by cluster; each paper: id, title, one-line
   approach, score chips `[rel8 prac6 rig7]`.
3. **Prior-art pitfalls.** Traps flagged from limitations — watch-outs,
   not verdicts.
4. **THE PATH.** The chosen cluster: sketch, citations, first step,
   load-bearing risk, avoid-list. This is the deliverable — make it bold
   and unmissable.
5. **Deep-read addendum** (when Phase 4 ran). Per primary-mechanism
   paper: key findings, numbers, caveats from the full text — and any
   correction to the abstract-level read, flagged loudly.
6. **Alternates considered, not chosen.** One line each.
7. **Open thread.** The unanswered question.

## Anti-patterns

- **Cross-contaminated reads.** If a read mentions "compared to the other
  papers" or "collectively these show", isolation broke — discard and
  re-run that read alone.
- **Hallucinated citations.** Never state a paper detail (number, claim,
  result) that wasn't in the fetched abstract. If unsure, re-fetch.
- **Shortlist cop-out.** Ending with "here are 3 good options" defeats
  the purpose. Commit to one.
- **Padding a thin result set.** Zero relevant papers is a valid, useful
  finding — the mechanism is genuinely novel, or the search terms were
  wrong. Say so; don't stretch tangential papers into fake coverage.
- **Abstract ≠ paper.** The abstract is a pointer, not ground truth on
  implementation details it doesn't state. Keep "borrow" and "avoid" at
  the level the abstract actually supports — unless Phase 4 deep-read the
  paper, in which case ground in the local full text with page anchors.
- **Deep-read shortcuts.** Phase 4 agents must read the cached markdown,
  not summarize from memory or the abstract. A deep-read report without
  page-anchored, body-level content is a failed read — re-run it.
- **Cache thrash.** Never re-download or re-convert a paper whose
  markdown already exists in the cache; the script's three-state check is
  the only path to the file.

## Calibration

- Default 4 papers/category × 3–5 categories ≈ 12–20 papers. Scale down
  to 2/category for narrow, well-known mechanisms; up for genuinely
  unclear territory.
- If a category-only retry still returns nothing usable, say so and move
  on — don't cascade into unrelated categories chasing a result count.
