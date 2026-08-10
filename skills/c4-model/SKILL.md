---
name: c4-model
description: "Visualize and communicate software architecture with the C4 model (context, containers, components, code + dynamic, deployment, landscape). Use when drawing architecture diagrams, documenting system structure, onboarding maps of a codebase, critiquing boxes-and-arrows diagrams, modeling microservices or message-driven topologies, producing deployment topology views, or building shared architecture context for humans and AI agents. Not for Clean Architecture layer placement, module API depth, service-split trade-offs, ERDs, state machines, or enterprise-architecture business layers."
---

# C4 Model

Maps of your code at successive zoom levels, like Google Maps for a codebase: zoom out for context, zoom in for containers, components, code. The core value is a **shared vocabulary of abstractions**, not a shared visual notation. Notation is free-form, but every diagram must stand alone: title, labeled elements, labeled unidirectional arrows, diagram key.

**Out of scope:** layering/ports decisions, deployable granularity trade-offs, ERDs, state charts, ArchiMate-style business layers. C4 shows the *outcome* of architectural decisions (the what), not the ADR rationale (the why). Pair C4 with ADRs or arc42-style narrative.

**Scope:** one software system under discussion (or one landscape boundary). Prefer evidence from the repo, runtime config, and known integrations over speculation. State assumptions explicitly.

**C4 container is not a Docker container.** A C4 container is an application or data store that must run for the system to work. Say "C4 container" when Docker/K8s is also in the conversation.

## Why C4

C4 creates shared technical context for design reviews, operations, onboarding, maintenance, and AI-assisted work. It is **not a design process** or delivery workflow: its levels are structural zoom levels, not role gates or project stages.

## Abstractions (fixed vocabulary)

| Level | What it is | Heuristic |
|-------|------------|-----------|
| **Person** | Human user (role, actor, persona) | Functional users; ops/admin only if they use a purpose-built surface (e.g. an admin UI), not if they only read logs |
| **Software system** | Delivers value; something a team builds/owns and can see inside | Often one team, one primary repo, one release boundary |
| **Container** | Application or data store that must be running | Separately deployable/runnable; isolation implies out-of-process calls between containers |
| **Component** | Group of related functionality behind a clear interface *inside* a container | Same process space; not separately deployable |
| **Code** | Classes, modules, functions implementing a component | Prefer IDE/on-demand; rarely hand-draw |

Hierarchy: **system contains containers, containers contain components, components are implemented by code**. People use systems.

**Not** usually a software system: product domains, DDD bounded contexts, business capabilities, feature teams/squads. Those are **groupings** drawn around C4 elements, not extra abstraction levels. See `references/advanced.md`.

**Quick placement tests**

- "Can these technologies execute in one OS process?" If no, they are not one container ("Java and MySQL" on one box is always wrong: JVM vs MySQL server).
- "Is this owned by our team and can we change its internals?" If no from our POV, model it as an **external software system** (opaque box), not opened containers.
- Database *server* vs *schema*: microservices may share a server; sharing a schema is a different coupling story. Model the **schema / collection / bucket** as the data-store container when that is the isolation unit.
- Hosted service vs owned data: an S3 bucket you own and fill is a container inside your system; Amazon SES you call as an API is an external software system. Integral-part test: do we control what is stored and its format?

Deep dive with examples of every container kind: `references/abstractions.md`.

## Default recipe (what to produce)

1. **Name the system in scope** and the audience (technical vs mixed).
2. **Always:** System Context + Container diagrams for that system. These two age slowly and serve the widest audience.
3. **When earned:** one Component diagram **per** application container you need to navigate (never for data stores, rarely for tiny services); Deployment diagram **per** environment that differs (at least production); Dynamic diagram only for a few hard/recurring flows; Code only for a critical or confusing component; Landscape when the question is multi-system.
4. **Notation pass:** title, element text (name/type/tech/description), labeled unidirectional arrows, diagram key, no mixed abstraction levels.
5. **Standalone test:** would this diagram still work if pasted into a ticket or wiki page with **no** accompanying prose or meeting narrative? If someone needs "I'll talk you through it," the diagram failed.
6. **Review** against `references/checklist.md`.

Diagram levels age at different rates: context slowest, code changes every commit. Do not invent a fifth abstraction level casually; prefer grouping boxes (layers, modules, microservice boundaries, org boundaries) around existing elements.

## Diagram types (summary; full how-to in `references/diagram-types.md`)

| # | Type | Scope | Purpose | Recommended? |
|---|------|-------|---------|--------------|
| 1 | **System Context** | One system | What are we building, who uses it, what systems touch it. No tech/protocols. | Yes, all teams, first |
| 2 | **Container** | One system | Apps + data stores inside the boundary, responsibilities, primary tech, protocols. No deployment infra. | Yes, all teams, second |
| 3 | **Component** | One container | Decomposition of one app container, collaboration, frameworks. | Optional; volatile |
| 4 | **Code** | One component | Internals of one tricky component (UML class style). | Rare; IDE on demand |
| 5 | **Dynamic** | One story | Subset of elements collaborating for one feature; sequence or collaboration style. | Sparingly; patterns not per-feature |
| 6 | **Deployment** | One environment | Container/system instances on nodes in one environment. | Yes, at least production |
| 7 | **System Landscape** | Org/dept/product | Context diagram without single-system focus; org boundaries optional. | Yes for larger orgs |

Full worked example (Internet Banking System, every level, standard Mermaid): `references/worked-example.md`.

## Notation rules (non-negotiable quality bar)

1. **Title** = diagram type + scope (e.g. `Container view: Internet Banking System`).
2. **Every element** carries: name, type (e.g. `[Container: Java and Spring Boot]`), short description/responsibilities (one sentence or about 7 bullets max). Add more words to your diagrams; ambiguity is the enemy.
3. **Every relationship** is a **unidirectional** arrow whose label reads as a sentence in the arrow direction. End labels with a preposition when it helps ("Makes API calls to", "Reads from"). Avoid bare "uses".
4. Collapse request/response into one arrow (initiator to receiver) unless two distinct intents/techs/synchronicities need two arrows.
5. **Diagram key** for shapes, colors, icons, line styles, borders. Define "internal/external" relative to a named boundary. Include every icon.
6. Consistent element placement across zoom levels (e.g. people stay top).
7. Equal box sizes unless size intentionally encodes meaning (and the key says so).
8. Expand or gloss acronyms and code names ("Plutus (payment service)").
9. One abstraction level per diagram.
10. Supplementary docs (ADRs) carry the *why*; C4 carries the *what*.

Arrow direction is a deliberate choice (dependency vs data/message flow). Request-driven systems usually read best with dependency arrows; message-driven with message/event flow. Stay consistent within a diagram set. Full guidance: `references/notation.md`.

## Microservices

Pick the mapping by **ownership**, not fashion:

| Situation | Model |
|-----------|--------|
| One team, one system, services are internal implementation | Each service = **group of one or more containers** (API + schema) inside the system boundary |
| Separate teams/repos own services | Each service = **software system**; callers treat others as **opaque** external systems |

Never model "microservice = one container with technology Java+MySQL" (fails the one-process test). Do not routinely open other teams' systems on your container diagram: it couples your docs to their internals and goes stale the moment they restructure. Stage-by-stage progression (monolith, in-team microservices, team split): `references/advanced.md`.

## Message-driven architectures

- Model each **queue/topic** as a **data-store container** (a bucket for messages), not the whole bus as one container, and not a software system when it is part of *your* system.
- Prefer labels like "Sends customer-updated events to" over "Sends messages to".
- Explicit vs compact: show queue boxes, or omit them and put queue/topic names on the labels. Both valid; choose for the story.
- Pub/sub: arrow directions and layout should make publishers/subscribers legible for one-to-many topics.
- Cross-system queues: decide **who owns** the queue/topic definition and operations; ownership decides which system boundary contains that container.

Variants with diagrams: `references/advanced.md`.

## What "good" looks like (anti-slop)

Reject or fix diagrams that:

- Use unlabeled, ambiguous, or bidirectional arrows
- Say only "business logic", "DB", "security", "transport"
- Hide all technology on container views of existing systems
- Mix deployment infra (K8s pods, load balancers) onto the logical container view
- Open every neighbor system "because we know how it works"
- Claim one official C4 color standard (there is none; the **key** is the standard; the blue/gray style is just one author's habit)
- Mix abstraction levels on one diagram

If a design diagram is an unreadable tangle, treat that as **design feedback**: simplify the solution, not only the drawing.

## Review and repair workflow (existing systems)

When reviewing C4 documentation, do not stop at diagram criticism. Use this evidence-first loop:

1. **Establish authority.** Read the diagrams, nearby architecture prose, repository structure, runtime/build configuration, public interfaces, and representative host entry points. Treat code/config as primary evidence for *what exists*; treat explicit project principles/ADRs as authority for *why*.
2. **Build an as-built inventory.** Record people, owned and external systems, runnable applications/data stores, in-process libraries, protocols, deployment nodes, and shipped/unshipped capabilities. Apply the one-process and ownership tests before judging boxes.
3. **Audit at three levels.** Check:
   - **Factual integrity:** claims, technologies, protocols, UI-visible facts, runtime paths, and deployment status match evidence.
   - **Abstraction integrity:** values, DTOs, errors, files, and functions are not promoted to systems, containers, or components. Classify jobs, libraries, and infrastructure by runtime and ownership evidence instead of excluding them categorically.
   - **Set integrity:** names, ownership, colors, shapes, line styles, arrow semantics, and zoom transitions agree across every diagram.
4. **Classify findings.** Separate factual/modeling defects from optional depth. Rank concrete defects first and cite the evidence; do not inflate preferences into errors.
5. **Repair for altitude, not box count.** Collapse function/file-per-box component diagrams into cohesive responsibilities. Preserve valuable detail in source-to-component matrices, API tables, invariants, limitations, and implementation sketches explicitly labeled below C3. Remove weak diagrams rather than keeping them to satisfy a count.
6. **Normalize the set.** Establish canonical element names and a notation key, then apply them across context, container, component, dynamic, and deployment views. Distinguish system-in-scope, owned siblings, and opaque externals.
7. **Verify the artifact.** Run the repository's diagram parser/linter and docs build. If a live docs/browser workflow exists, run it against the live server with Playwright or the project's browser harness; exercise navigation and diagram controls, check console/network failures, and inspect screenshots for clipping, overlap, unreadable labels, misleading layout, and keys hidden by controls. Static syntax alone is insufficient for UI documentation.
8. **Adversarial final pass.** Re-run `references/checklist.md` after edits and, when tools permit, ask an independent reviewer to find remaining factual, abstraction, consistency, or rendered-readability defects. Fix verified findings and rerun affected checks.

Do not rewrite correct prose merely for style. Preserve honest limitations, evidence dates, completeness matrices, and explicit “not shipped” statements. Never turn configured intent into an as-built deployment claim.

## C4 + agents

Prefer structured textual models over screenshots for agent-assisted Q&A, drift detection, evidence-backed model generation, and code changes constrained to modeled boundaries. Keep assumptions explicit and verify generated architecture claims against repository and runtime evidence.

## Agent output contract

When asked to produce C4 for a system, deliver in this order unless the user asks otherwise:

1. **Scope statement**: system name, audience, environments, assumptions.
2. **System Context**: structured elements + relationships, then a renderable diagram.
3. **Container**: same, with technologies and protocols, system boundary shown.
4. **Optional next**: only what the question needs (component / deployment / dynamic / landscape), each with its own title and key notes.
5. **Open questions**: missing ownership, unknown protocols, undecided tech.

### Element / relationship records (use before drawing)

```text
Person|System|Container|Component:
  name:
  type:          # Person | Software System | Container | Component
  technology:    # containers/components; blank for person/system if unknown
  description:

Relationship:
  from:
  to:
  description:   # sentence fragment that matches arrow direction
  technology:    # protocol when inter-process; blank if in-process
```

### Diagram-set metadata (optional, durable docs)

```text
Diagram set:
  system:
  maintained_by:     # team or role
  update_when:       # triggers that force a refresh
  last_reviewed:     # if known
```

### Renderable default

Default to **standard Mermaid** (`flowchart` with `subgraph` boundaries, `sequenceDiagram` for dynamic, `classDiagram` for code): it renders almost everywhere and needs no plugins. Shape conventions and ready-to-copy templates: `references/mermaid-rendering.md`. Use Mermaid `C4Context`/`C4Container`/`C4Component`/`C4Deployment`, C4-PlantUML, or the Structurizr DSL only when the target environment is known to support them.

### Critique mode

For a quick critique, answer the review checklist with concrete fixes, not vague “add more detail.” For a repository-backed review, follow the full **Review and repair workflow** above and report:

1. verified defects, severity-ranked, with diagram and code/config evidence;
2. optional depth separately;
3. repairs applied or exact proposed edits;
4. syntax/build/browser verification actually run, including skipped checks;
5. remaining unknowns or assumptions.

Checklist: `references/checklist.md`.

## References (load on demand)

| File | Load when |
|------|-----------|
| `references/abstractions.md` | Unsure whether something is a system/container/component; model-code gap; volatility; hardware systems |
| `references/diagram-types.md` | Need intent/scope/content/audience/how-to for a specific diagram type |
| `references/worked-example.md` | Need a complete example at every zoom level with standard Mermaid |
| `references/notation.md` | Deep notation guidance: element text, color/shape/size, arrows, keys, layout |
| `references/advanced.md` | Microservices progression, message-driven variants, grouping vs new abstractions, scaling clutter, tooling, capability maturity |
| `references/mermaid-rendering.md` | Rendering C4 in standard Mermaid, C4-mermaid, PlantUML, Structurizr DSL |
| `references/checklist.md` | Reviewing/critiquing diagrams; situation-to-diagram-set table |
