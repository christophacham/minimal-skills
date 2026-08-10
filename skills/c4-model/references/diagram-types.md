# C4 Diagram Types, Deep Reference

Each type: the questions it answers, its scope, its content, its audience, when it is recommended, and how to build one. Rendered examples for all of these are in `worked-example.md`.

## 1. System Context

**Answers:** What are we building? Who uses it? What are they doing with it? How does it fit into the existing landscape?

| Aspect | Guidance |
|--------|----------|
| Scope | A single software system |
| Elements | People + software systems (ours plus neighbors) + relationships |
| Omit | Technologies, protocols, containers, deployment detail |
| Audience | Everyone, technical and nontechnical |
| Recommended | Yes, for all teams; the starting point |

Element data: name + short description. Relationships: high-level intent labels only ("Views account balances using", "Sends trade data to"). No JSON/HTTP yet.

**Why it earns its place:** makes scope explicit (no assumptions about what is inside vs outside the boundary), shows what is being added to the landscape, gives nontechnical people a discussion starting point, identifies who to talk to about intersystem interfaces, and anchors the rest of the diagram set. Also a good requirements-workshop tool: drawing the boundary forces agreement on which features sit inside vs outside.

**How to build:** draw the system as a single box; add each user type with its relationship; add each external system it directly interacts with; title it `System Context view: <System>`; add the key.

## 2. Container

**Answers:** How is the system decomposed into applications and data stores? What are their responsibilities? What are the primary technology choices? How do they communicate? Where do I write code to add a feature?

| Aspect | Guidance |
|--------|----------|
| Scope | The same single software system |
| Elements | The people and external systems from the context diagram (continuity) + containers + **system boundary** box |
| Omit | Cloud regions, K8s, load balancers, failover, network zones: those vary per environment and belong on Deployment |
| Audience | Architects and engineers; also ops/support, QA, compliance/review boards, and product owners sanity-checking change scope |
| Recommended | Yes, for all teams; the second diagram |

Container data: **name + technology + responsibilities** (applications) or **what is stored** (data stores). Relationship data: **intent + primary protocol** ("Makes API calls to [JSON/HTTPS]", "Reads from [SQL/TCP]"). Container-to-container relationships are usually interprocess, so the protocol is valuable information. Solid vs dashed lines may mark sync vs async if the key says so.

**Why it earns its place:** shows what must actually be built, deployed, and operated; forces technology choices to be explicit, which smoke-tests feasibility. The classic catch: a "technology-independent UI" reading from a "technology-independent database" looks fine until you annotate React + MySQL and ask how a browser app authenticates to a database. Annotated tech turns a drawing into a design review.

Undecided tech: write candidates or category, not nothing.

## 3. Component

**Answers:** How is one container decomposed? What do the components do? How do they collaborate? What frameworks/libraries implement them? Where do I write code?

| Aspect | Guidance |
|--------|----------|
| Scope | **One container only.** Three apps means three diagrams, never one merged diagram |
| Elements | The people/systems/sibling containers from the container diagram (continuity) + components + **container boundary** (+ optional system boundary) |
| Audience | Engineers who own that app; maintenance/support |
| Recommended | Optional. Not for data stores (use ERDs), not for trivial single-endpoint apps. Volatile under active development |

Component data: name + technology (framework level, e.g. "Spring MVC controller", "Spring bean") + responsibilities. Relationships: intent label; in-process calls need no protocol. Reflect the actual style in the code (layers, hexagonal, feature packages); group boxes may show layers or modules around the components.

Cross-cutting noise (logging used by everything): omit with a note ("All components log via a logging component, not shown for brevity") or mark dependents with a key-defined symbol.

Cost warning: component diagrams age fast and clutter past a handful of boxes. Auto-generating them from code is nontrivial; AI generators are nondeterministic. Budget maintenance before committing to them as long-lived docs.

## 4. Code

**Answers:** How is one component decomposed into language building blocks? What is public vs internal? How big and complicated is it?

| Aspect | Guidance |
|--------|----------|
| Scope | **One component.** The scoping is what makes UML class diagrams usable; a class diagram of a whole app is thousands of boxes |
| Notation | UML class diagram for OO languages; module/file sketches otherwise |
| Audience | Engineers only |
| Recommended | Rarely. Exists in the model for traceability; prefer IDE reverse engineering on demand |

Hand-draw only to summarize a large/tricky component or to show a pattern others must copy (e.g. "every CBS call is a request/response class pair"). Resist dumping every property and method: include only what the story needs.

## 5. Dynamic

**Answers:** How does one feature/user story work at runtime, using only the elements it actually touches?

| Aspect | Guidance |
|--------|----------|
| Scope | One story; pick one abstraction level and stick to it (systems, containers, components, or code) |
| Styles | **Sequence** (lifelines, numbered messages top to bottom) or **collaboration** (free-form boxes and arrows from the static diagrams, numbered). Collaboration is easier on whiteboards |
| Audience | Mirrors the corresponding static level |
| Recommended | Sparingly: recurring patterns and genuinely hard flows, not one diagram per feature |

A system with a hundred features does not need a hundred dynamic diagrams; the maintenance cost exceeds the value. Use them for interactions that text describes badly.

UML extras (guards, loops, lifeline events) are fine when the tool supports them and they add value.

## 6. Deployment

**Answers:** How do instances of containers (and optionally external systems) sit on infrastructure in **one** environment?

| Aspect | Guidance |
|--------|----------|
| Scope | One system per diagram (relax only when several of your systems genuinely share infrastructure); one diagram **per environment** (dev and prod at minimum differ) |
| Elements | **Deployment nodes** (where software runs: physical host, VM, Docker container, app server, managed runtime; nest freely), **infrastructure nodes** (DNS, routers, load balancers, firewalls), **container instances**, **software system instances** |
| Audience | Same as container diagram, plus operations/support |
| Recommended | Yes; production is the critical one (incident readiness) |

This is the home for everything banned from the container diagram: Docker, K8s, load balancers, cloud services, network zones, TLS termination. The same logical container often maps to different nodes per environment (JVM on a laptop in dev, Fargate in prod; MinIO in dev, real S3 in prod; mock SES in dev, real SES in prod), which is exactly why environments get separate diagrams.

External dependencies appear as opaque instances ("point the backend at corebanking-dev"), preserving the abstraction: you do not model the internals of the Core Banking System's data-center deployment.

## 7. System Landscape

**Answers:** How do the systems in this group/department/organization fit together? What is the impact if one changes or is removed, or if the org restructures?

| Aspect | Guidance |
|--------|----------|
| Scope | Your choice: organization (small orgs only), department, product domain, business capability, DDD bounded context |
| Elements | People + software systems; optional org-boundary boxes |
| Audience | Same as system context: everyone |
| Recommended | Yes for larger organizations; the bridge to enterprise architecture (but not a full EA model) |

Essentially a context diagram without a single-system focus. Wider than context: context shows only direct neighbors of one system; landscape tells the broader story (e.g. support staff and back-office staff who also use the Core Banking System). Make it interactive if tooling allows: double-click a system to navigate to its context/container diagrams, and the landscape becomes a map of the estate.

## Supplementary, not replacement

C4 does not replace: UML activity/BPMN (business processes), state charts (state machines), class diagrams (domain models), ERDs (data models), ArchiMate (enterprise architecture), DDD context maps. Use them alongside.

C4 is also **not a design process** and **not universally applicable**: less suited to embedded/firmware, customization-heavy platforms (SAP, Salesforce), and libraries/frameworks/SDKs. Even there, context and container diagrams often still help.
