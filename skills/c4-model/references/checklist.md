# C4 Review Checklist and Quick Reference

Use when critiquing an existing diagram or self-reviewing before publishing. Answer every question; each "no" is a concrete fix, not a vague "add detail".

## General

- [ ] Does the diagram have a title?
- [ ] Do you understand what the diagram's type is (context / container / component / code / dynamic / deployment / landscape)?
- [ ] Do you understand what the diagram's scope is (which system, container, environment, or org boundary)?
- [ ] Does the diagram have a key describing any non-obvious notation?
- [ ] Is there exactly one abstraction level on the diagram (no components on a context view, no K8s on a container view)?
- [ ] **Standalone test:** would this still work if pasted into a ticket or wiki page with no prose or live walkthrough?

## Elements

- [ ] Does every element have a name?
- [ ] Do you understand the type of every element (person, software system, container, component, ...)?
- [ ] Do you understand what every element does (responsibilities, or what a data store holds)?
- [ ] Where applicable, do you understand the technology choices of every element?
- [ ] Do you understand all acronyms, abbreviations, and code names?
- [ ] Do you understand the meaning of all colors used?
- [ ] Do you understand the meaning of all shapes used?
- [ ] Do you understand the meaning of all icons used?
- [ ] Do you understand the meaning of all border styles (solid, dashed, dotted)?
- [ ] Do you understand the meaning of all element sizes (small vs large boxes)?

## Relationships

- [ ] Does every arrow have a label describing the intent of the relationship?
- [ ] Does every label read as a sentence in its arrow's direction?
- [ ] Are all arrows unidirectional (or bidirectional pairs decomposed)?
- [ ] Where applicable, do you understand the technology/protocol of every inter-process relationship?
- [ ] Do you understand all acronyms and abbreviations on labels?
- [ ] Do you understand the meaning of all arrow colors?
- [ ] Do you understand the meaning of all arrowheads?
- [ ] Do you understand the meaning of all line styles (solid, dashed, dotted)?

## Diagram-set questions (when reviewing more than one diagram)

- [ ] Is the notation consistent between diagrams?
- [ ] Are element names identical across zoom levels?
- [ ] Is the reading order obvious (context to container to component)?
- [ ] Is the transition between diagrams clear (the box you zoom into on one diagram is the boundary on the next)?
- [ ] For long-lived multi-view sets: is there a single source of truth (model / diagrams-as-code) rather than copy-pasted shapes that will drift on rename?
- [ ] Optional durable-doc metadata: maintained by + update-when triggers present and plausible?
- [ ] Process smell check: are diagram levels treated as zoom levels, not as BA/architect/engineer role gates?

## Element text template

Inside each box (whiteboard-friendly):

```text
Name
[Type: Technology]
Short description of responsibilities
```

Types written as `[Person]`, `[Software System]`, `[Container: Java and Spring Boot]`, `[Component: Spring MVC Controller]`.

## Recommended diagram set by situation

| Situation | Produce |
|-----------|---------|
| New system design workshop | Context, Container; optional Dynamic for hard flows; Deployment draft for target env |
| Document existing system | Context + Container from code/config evidence; Component for the app under change; Deployment for production |
| Ops incident readiness | Production Deployment (and staging if different) |
| Multi-team estate | Landscape + per-team Context/Container; no cross-team container internals |
| Onboarding | Context + Container; one Component for the main app |
| Message/event redesign | Container with queues/topics as data stores; optional Dynamic for one critical path |
| Threat modeling / review board | Container + production Deployment, protocols and data stores explicit |
| First maps / no existing diagrams | 30 min Context only; hang/wiki; Container only if useful |
| AI / agent shared context | Element+relationship records or modeling DSL; Context + Container minimum |
