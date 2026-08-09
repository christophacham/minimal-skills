# C4 Notation, Deep Reference

C4 is **notation independent**: any shapes, colors, and line styles are legal, including UML or ArchiMate. The blue/gray style common online is one author's habit, not a standard. But not all notations are equal. A good notation:

- Makes diagrams readable by the widest audience.
- Describes every differentiator (shape, color, line style, icon) in a diagram key.
- Is consistent across diagrams in the same set.
- Lets each diagram stand alone without a verbal explanation, because diagrams get copied out of the docs that explain them.

The single highest-leverage habit: **add more words to your diagrams**.

## Titles

Title = diagram type + scope. Examples: `System Context view: Internet Banking System`, `Deployment view: Internet Banking System, live`. The title sets reader expectations before they look at a single box.

## Acronyms, abbreviations, code names

- Industry acronyms (HTTP, JSON, SQL) are fine on technical diagrams; spelling them out is tedious.
- Organizational code names are the trap: "Plutus" means nothing to a new hire. Write "Plutus (payment service)" or "Payment Service (also known as Plutus)", or keep the name and add a descriptive line underneath.
- When in doubt, expand. Document remaining terms in a glossary or on the key.

## Layout

- No correct orientation; users-top/database-bottom is convention, not law. Inverted layouts confuse or, used deliberately, emphasize.
- Keep element placement consistent across zoom levels (people at the top on both context and container views). This gets harder at lower levels but pays off in navigability.

## Elements: what goes inside the box

Template (whiteboard-, sticky-note-, and tool-friendly):

```text
Name
[Type: Technology]
Short description of responsibilities
```

Written out as `[Person]`, `[Software System]`, `[Container: Java and Spring Boot]`, `[Component: Spring MVC Controller]`.

**Type.** Removes the classic ambiguity of "is this box a system, an app, or a code module?". Square brackets are ASCII-friendly and deliberately distinct from UML guillemets.

**Technology.** Containers and components get the one or two most significant choices, not the full stack: "Java and Spring Boot", "JavaScript and React", "Python and Django". Version numbers are a trade: full versions are precise but rot on upgrades; major versions only ("Spring 5") are a reasonable middle when major jumps are painful; none invites wrong assumptions (your Java 21 reader assumes the other team's "Java" box is also 21, not legacy 8).

**Description.** One short sentence, or a bullet list of roughly seven plus or minus two items (Miller's law). Yes, this makes diagrams more verbose than typical boxes-and-arrows; that verbosity is the clarity. A sparse variant without descriptions is legitimate for presentations where you narrate each element, but never as the archived version.

## Color

Color applied to an already-sensible diagram reduces cognitive load and captures attention. Legitimate encodings:

- Existing vs new
- Off-the-shelf product vs custom build
- Technology
- Size/complexity
- Technical debt score
- Ownership
- Internal vs external (define relative to a named boundary!)
- Elements changing in the next release vs untouched

Rules: every color meaning goes in the key; the diagram must survive color-vision deficiency and black-and-white printing.

## Shapes

Common, immediately readable choices: rectangles and rounded boxes for systems/apps, a person shape for users, cylinders/buckets for data stores, folders for file systems, pipes for queues/topics. Shape variety gives a fast at-a-glance reading from a distance. Every shape goes in the key. When starting on a whiteboard, draft with plain single-color rectangles first and add visual encoding after the content stabilizes.

## Size

Readers assume bigger boxes are more significant. Draw all elements approximately the same size unless size deliberately encodes something and the key says so.

## Icons

From a terminal glyph in a corner to full cloud-provider icon packs. Treat icons like abbreviations: twenty AWS icons may look pretty and mean nothing to half the audience. Every icon appears in the key with a full description.

## Relationships: arrows

**Unidirectional, always.** Bidirectional arrows (or unlabeled double lines) cannot be labeled sensibly: "Makes API requests / responses?" reads badly in both directions. A real bidirectional interaction decomposes into two unidirectional ones ("Makes API requests to" / "Sends responses to"), and in practice you collapse that pair into a single arrow from initiator to receiver, understood as a summary of the relationship.

**Labels read as sentences.** "The UI makes API requests to the backend" is a sentence; if your label read in the arrow direction sounds wrong, the arrow or the label is wrong. End labels with a preposition where it helps ("to", "from", "with"). Avoid bare "uses".

**Two arrows between a pair** are justified when the two relationships differ in intent, technology, or synchronicity: service A pulls a customer list from B via sync API while B publishes customer events that A consumes async. Same-direction collapse would lose the story.

**Direction semantics are your choice:** dependency, data flow, or message flow. Request-driven systems read best with dependency arrows (caller to callee); message/event-driven systems read best with arrows following the messages. Pick one convention per diagram set and stay consistent.

## Relationships: line style

- Solid for synchronous, dashed for asynchronous is a common, effective encoding (key it).
- Color can encode security (green HTTPS / red HTTP), with the color-vision caveat.
- Avoid arrowhead vocabularies: UML/ArchiMate arrowhead distinctions vanish at zoom. One arrowhead, or at most two or three that survive zooming out.

## Diagram key

Non-negotiable, even when the notation "seems obvious". People pattern-match wrongly with total confidence; two teammates will assign opposite meanings to the same color. The key covers shapes, colors, icons, border styles, line styles, arrowheads, and any size encoding.

Beware reference-dependent words in the key: "blue = internal, green = external" is meaningless until you say internal to *what* (team? organization? network zone?).

Practical habit: whenever you catch yourself saying "just to be clear, these arrows are data flows" or "the green boxes are new" while presenting, that sentence goes into the key.

## Do we need a standard notation?

No. An org-wide standard is attractive (lower cognitive load across 20+ teams) but requires someone to define and maintain precise rules across every style and technology in use, which is tedious and politically hard. Tooling defaults get you partial standardization for free. Using UML/ArchiMate as the C4 notation is legitimate (systems as «Software System» stereotyped components, UML dependency arrows, even a UML profile), but few teams know UML today and most UML tools cannot put a description inside a component box. The real shared asset of C4 is the vocabulary of abstractions and diagram types, which survives any notation that comes with a key.
