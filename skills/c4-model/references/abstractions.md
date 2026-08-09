# C4 Abstractions, Deep Reference

Load when the one-line definitions in `SKILL.md` are not enough: edge cases, the model-code gap, volatility, or hardware systems.

## Why fixed abstractions, not fixed notation

The industry's diagramming problem is primarily about **abstractions**, secondarily about notation. The word "component" can validly mean "the web app is a component of the system" and "the web app is made of components" at the same time. C4 fixes this by giving each word exactly one meaning in a strict hierarchy. Maps of the same territory use different colors and icons but the same abstractions (roads, rivers, towns), explained by a key. C4 diagrams work the same way: shared abstractions, variable notation, always a key.

The power of the model is the small set of fixed levels. When someone says "a database is a database, debating container vs component is pointless", the debate is the point: "database" could mean server, schema, or dataset, and the answer changes real advice (microservices sharing a database *server* is fine; sharing a *schema* is not).

## Person

- Humans who use the software: roles, actors, personas, named individuals.
- Capture: **name + short description**.
- Include functional users by default. Include admins/ops only when the system has a surface built specifically for them (e.g. an admin UI). People who only read log files are usually omitted.
- Multiple context diagrams are allowed: one for functional users, one for ops/admin if the stories differ.

## Software system

- The hardest abstraction to define. Working definition: something that delivers value to its users (human or not), that **a single team builds, owns, is responsible for, and can see inside**. Often one repo, one release boundary, deployed together.
- Includes both the system you are describing and the systems it depends on (or that depend on it), which appear as opaque neighbors.
- **Not** software systems: product domains, DDD bounded contexts, business capabilities, feature teams, squads. Those are organizational constructs; draw them as grouping boxes around C4 elements (see `advanced.md`).
- Ownership/visibility test: if your team cannot change its internals, it is an **external** software system on your diagrams: a single opaque box with a name and description, never opened into containers.

## Container (application or data store)

A container is something that must be running for the system to work, with a degree of isolation from other containers regardless of deployment. Isolation implies out-of-process communication between containers.

**Application containers**

| Kind | Examples |
|------|----------|
| Server-side web app | Spring Boot app, ASP.NET MVC on IIS, Rails app, Node.js service |
| Client-side web app | SPA in the browser (React, Angular, Vue) |
| Desktop app | WPF, Swift/AppKit, JavaFX, Electron |
| Mobile app | iOS, Android |
| Console/CLI process | anything with a `main`, any language |
| Serverless function | a single Lambda or Azure Function |
| Shell script | Bash/Zsh automation |

**Data-store containers**

| Kind | Examples |
|------|----------|
| Database | relational schema, document collection, graph, cache dataset |
| Blob/content store | S3 bucket, Azure Blob container, CDN file set |
| File system | local directory, SAN/NAS share |
| Message queue/topic | a store of messages; producers add, consumers take (see `advanced.md`) |

Key subtleties:

- **Isolation is logical, not physical.** Two Java web apps in one Tomcat/JVM are still two containers (separate class loaders, no in-process calls). Two schemas in one MySQL server are two data stores (no joins across schemas).
- **Schema/bucket/collection, not server.** Model the unit of isolation. An S3 bucket your system owns is a container inside your boundary even though AWS hosts it; the AWS service API you merely call (SES) is an external software system.
- **Serverless:** a single function is a container. Fifty functions are fifty containers, which is why function-heavy systems clutter fast; see scaling strategies in `advanced.md`.
- **Microservice is not a container.** "Java and MySQL" cannot run in one OS process, so a box labeled that way is always two containers (API + schema), usually drawn as a group.
- During up-front design with undecided tech, write candidates or a category: "PostgreSQL or MySQL", "relational schema".

## Component

- A grouping of related functionality behind a well-defined interface, running **inside** a container. All components in a container share one process space and call each other in-process.
- Language mappings: OO languages, a collection of classes/interfaces; procedural, a directory of files; functional, a module; JavaScript, a module of objects/functions.
- Components are **not** separately deployable. Packaging (one or many JARs/DLLs per component) is orthogonal to the abstraction.
- "Containers contain components" is the mnemonic, and the origin of the name.
- The component set should mirror the real architectural style: layers, ports-and-adapters, feature packages. Do not draw three clean layers when the code is a web of collaborators; draw the web, optionally with layer group boxes around components.

## Code

- Classes, interfaces, enums, functions, objects: the building blocks of the language.
- Exists in the model mainly for traceability: code is the anchor that connects every level above it to reality.
- Rarely hand-drawn. Prefer IDE reverse engineering on demand, pruned to the story (hide irrelevant members). Hand-draw only when summarizing a large/tricky component or a pattern others must copy.

## The model-code gap

Architectural abstractions (components, layers) do not exist in programming languages; teams implement them by convention:

- **Naming:** `LoggingComponent` is the entry point of the logging classes.
- **Packaging:** `com.example.application.logging`.
- **Build modules:** the `application-logging` project/library.

Conventions drift within and across teams, so diagrams and code disagree. Mitigations: keep component boundaries aligned with package/module boundaries, state the mapping convention next to the diagram set, and treat mismatches found while diagramming as design feedback.

## Volatility (why you do not need all four levels)

| Diagram | Change rate when hand-maintained |
|---------|----------------------------------|
| System context | Very slow: environment and integrations are stable |
| Container | Slow, unless microservice/serverless-heavy |
| Component | Fast under active development (refactors, new components) |
| Code | Potentially every commit |

This is why context + container is the recommended baseline, and component/code are optional, earned detail.

## Hardware systems

For software controlling hardware (cameras, robots, medical devices), either model the device as a software system or introduce an explicit **hardware system** abstraction with its own type label and icon. Treat it as opaque; you care about the integration points (control signals, telemetry), not its internals.
