# Component Knowledgebase

Reference library of 16 reusable content components, supplied by the client as the knowledge
base for redesigning this page. This file is the durable record of that brief — read it before
starting any redesign work here, regardless of which Claude account or session is doing the work.

**Status:** preparatory reference only. Nothing in this file has been implemented yet. Do not
start building any of it without an explicit redesign brief from the user telling you which
components to use and where.

**Governing instruction:** adapt these components' *functionality and interaction*, not their
visual design. Implement them inside this project's existing design system (tokens, typography,
spacing already established in `style.css`) rather than copying whatever visual treatment a
mock-up implies. The Word Finder tool already built into `index.html`/`extra.js` is the model for
this: a functional adaptation of an idea, not a visual clone of a reference.

**On the original mock-ups:** each component below was originally paired with a Claude Artifact
link (`claude.ai/public/artifacts/<uuid>`) for UX reference. Those links are not durable — they
belong to whatever Claude account created them and are not fetchable from an arbitrary session
(confirmed: not shared, and the public preview page fails to render outside its origin — a
cross-origin `postMessage` mismatch between `claude.ai` and its sandboxed preview host). Do not
rely on those links working. The layout notes below come from hand-drawn wireframes the client
shared directly in chat, which is why they're specific about exact positioning, not just intent.

## 1. FAQ with Tabs / heading-hierarchy pattern

Labels filter/group FAQ questions under specific H2 sections; each label has its own `#` anchor
tied to a heading, and info icons explain what each label covers. A "show more" button appears
once a label has more than ~10 questions under it. Labels scroll horizontally if they don't fit
the available width.

The wireframe pairs this with an explicit heading-hierarchy demo: 5 horizontal tabs at the top,
then H2 through H6 stacked below as a **staircase** — H2 full width, H3 slightly narrower and
inset from the left, H4 narrower again, down to H6 narrowest and most inset. That progressive
width-and-indent shrink is literally how "every heading sized and indented according to its
prominence" should look — not just a font-size difference, an actual staircase silhouette.

## 2. Vertical Switcher with Images

Two panes: one image (left, large), one accordion (right). Desktop: side-by-side. Mobile:
stacked. Expanding an accordion item swaps the paired image.

The accordion pane wireframe shows a stack of entries, each with a title bar, a text bar, and a
small CTA — with a second full entry (title + text) below the first, confirming multiple
stackable accordion rows rather than a single fixed block. A separate diagram makes the state
model explicit: each row has two literal heights, a short "Closed" box and a tall "Open" box, not
just an opacity/fade transition.

## 3. Horizontal Tabbed Headings

Used to order similar attributes, templates, or contexts. Each tab has its own `#` anchor for
page-segmenting. Overflow uses a slider/carousel rather than wrapping.

Wireframe: 5 tabs across the top. The active tab's panel below shows, in order: an H2, a context
paragraph (itself truncatable with "read more"), a CTA, a representative image paired to the
heading, then a distinct bottom band explicitly reserved for "specified extra components" —
structured accordions, tables, listicles, or other unstructured content, chosen per the brief for
that specific tab. CTA and image are optional per the brief, not mandatory.

## 4. Vertical Tabbed Headings

Used when there are too many headings for horizontal tabs to hold comfortably; gives more room
per item. Primary attributes still live in horizontal tabs elsewhere on the page; secondary ones
move here.

Wireframe: a tall left rail of vertical tab labels (the sketch shows about 9), one marked as
selected. The active pane on the right shows an H2, a context paragraph with a "read more" arrow,
a CTA, then **two** stacked "Specified Structured Components" blocks — meaning a vertical-tab
pane can host two independently injected sub-components, not just one body block. If there are
too many headings even for this, only the tab rail itself should slide/scroll, not the content.

## 5. CTA/Form Component

The page's central conversion element for service-related pages; exact fields are brief-driven,
not fixed by this pattern.

Wireframe: an intro paragraph above the fields ("Form Element Context Paragraph"), a 2×2 grid of
input elements, one submit button below the grid, and — sitting below/outside the form card
itself, not inside it — a row of 4 short "info element" trust chips.

## 6. Poll Component

Collects responses to options; a summary re-orders/prioritizes options by how popular they turn
out to be.

Wireframe: a heading that frames the question with a point of view ("heading for the specific
options, with personalized opinion" — not neutral phrasing). Each option is a row: a radio circle
plus a full-width bar. One circle renders visually distinct (filled/highlighted) from the others,
showing the current leader inline rather than only in a separate results screen. A single
full-width "Summary of the Poll Results" bar closes the component.

## 7. QnA Component

Question submission field, question text, and an answer block. Each answer carries author name,
author title, the answer text, and a vote control. Questions and answers should be marked up as
structured data (an "effort signal" for SEO).

Wireframe specifics: the submission row is a wide text field with a separate button beside it
(not stacked below). Below that, a "Question-text" bar. The answer card puts a small square
"Expert Photo" beside a two-line "Expert Name / Expert Title" in its top-left, the full answer
text spanning the card's width beneath that, and the vote control anchored to the bottom-right
corner of that same card — vote lives inside the answer card, not as a separate element.

## 8. Information Box

A visually distinct callout (different background or iconography) that restates a body claim in
a more clinical, data-backed way — more numbers, more specific examples — without changing the
underlying claim. It's a secondary angle on the same fact, not new information.

Example pair from the brief:

- Body copy: "Falling in love does not have an age restriction. Many of the beautiful love
  stories come from older individuals who gave love a chance in their 60s and above."
- Information Box version: "Falling in love doesn't have any demographic limitation, supported by
  demographic research indicating that over 70% of individuals above the age of 60 report forming
  new romantic connections later in life."

Wireframe: one single box, a lightbulb icon on the left, label text filling the rest. One level,
no nesting.

## 9. Opinion Box

Same family as the Information Box, but first-person ("I think," "I believe") and attributed to a
named person: includes their name and face, plus a CTA (subscribe, sign up, log in, contact us).

Example: "I think falling in love doesn't have any demographic limitation, especially when
demographic research shows that over 70% of people above 60 continue to form new romantic
connections later in life."

Wireframe: one bordered container split into a small "Opinion Title" tag top-left, a large
opinion/context-paragraph block (left, most of the width), a photo+title column on the right
running the same height as the text block (not a small avatar tucked above or below it), and a
CTA bottom-left under the text.

## 10. Founder Box

Same purpose as the Opinion Box, but the quote is attributed specifically to the company's
founder as an authority signal, and should link out to the founder's official site or social
accounts.

Wireframe: literally the same skeleton as the Opinion Box (title tag, big text block on the left,
photo/name/title column on the right, CTA bottom-left) — the only differences are the middle
block is labeled "Quote" instead of "Opinion," and the container gets its own distinct border
treatment. Treat it as the Opinion Box pattern re-skinned for a named authority, not a separate
layout to build from scratch.

## 11. Reviews Component

A 2-5 way tabbed structure over review sources — typical tabs: Google/Customer Reviews, Video
Reviews, Expert Reviews, Awards, Featured On, Trustpilot, or industry-specific platforms. Each tab
is a carousel. Every review (video or text) needs: title, star rating, description, author, and
author photo; video reviews additionally need a thumbnail. Reviews should be in structured data.

Wireframe: a bracketed-template heading ("Best [Industry] [Topic] [Occupation] [Region] Reviews")
plus an instructional paragraph, then tab buttons, then a **row of side-by-side review cards**
(not a single-column stack) — each card has author + star rating on one top row, the review body
filling the middle, and a source/date/region bar along the bottom. Small triangular prev/next
arrows sit below the card row, confirming carousel behavior rather than a static grid.

## 12. Structured Accordion

8 sub-parts total: 3 listicles, 3 paragraphs, 1 CTA, 1 "Quick Insights" block. Two states:

- **Closed**: shows only the accordion title plus the 3 quick-insight icons/values (e.g. a
  duration or other short numeric label per insight).
- **Open**: reveals everything else.

Meant for complex, multi-angle entities — the brief's own example is car-accident injuries:
symptoms, treatments, legal requirements, compensation range, steps, defense strategy, claim
steps, and other angles all calculated as separate listicle/paragraph pairs under one accordion.

Wireframe: the header row is itself three tab-like segments — "Accordion Title," "Accordion
body," "Accordion quick insights." The open body is **3 side-by-side columns**, and critically
each column pairs its own listicle directly above its own paragraph (column 1's bullet list sits
directly over column 1's fact paragraph, and so on) — it is not "all 3 listicles, then all 3
paragraphs" as a flat reading of the text description might suggest. The footer has one wide "CTA
Quote and Text" bar plus two separate CTA buttons beside it, contextualized to the accordion's own
title. A side diagram again shows Closed (short) vs Open (tall) as two literal box heights.

## 13. Full-detail Card

Full width. Meant to present one clearly important entity in full detail, with room to link out
to individual review pages, versus-style comparison pages, or category pages.

Wireframe fields and layout, top to bottom:

1. One row, three items side by side: card title (with subtitle), card quick insights, and a CTA
   — insights and CTA sit next to the title, not below it.
2. A full-width description with a "read more" affordance.
3. A three-column row: Pros | Cons | Alternatives/Details.
4. One standalone "CARD CTA."
5. Two stacked "Extended Accordion Question" bars at the very bottom — the card ends in its own
   embedded mini-FAQ.

Depending on industry/entity, more listicles, accordions, or sub-sections can be added, but these
five slots are the universal baseline.

## 14. Mid-detail Card

Vertical, not full-width. Lives in a sliding carousel ("card-carousel") or a static three-up grid
("card-triple"). Universal fields: title, image, subtitle, CTA, quick insights, and info icons
that verbalize those insights.

Wireframe: title+subtitle, a description with "read more," then a quick-insights block described
as a literal **table** with info-icons/tooltips annotating each row (not plain bullet text), then
a "CARD CTA." Regardless of carousel or triple, this must be marked up as a real HTML list —
`<ol>` when the ordering is superlative/ranked, `<ul>` otherwise.

## 15. No-detail Card

The lightest card: image, title, CTA, quick insights, and a short verbalization line — the
wireframe shows just title+subtitle, a description with "read more," and a CTA; fewer insights
and shorter copy than the Mid-detail Card. Used at volume (can appear 8+ times on a page) for
internal linking from micro-context, without implying equal importance across all instances.

## 16. Trust Elements

Displays the most prestigious press mentions, certificates, licenses, or awards, framed as a
verbalized claim ("X trusts Y" / "X uses Y"). Implementation should use inline SVG with a
`<title>`/`<desc>` pair per logo, plus a hover (or touch, on mobile) tooltip that verbalizes what
the logo represents — the wireframe makes this explicit by drawing an arrow from one logo up to a
"tooltip verbalization for the logo" box, i.e. every logo needs its own tooltip, not just a
caption under the row.

## Applicability to this page

This page's actual center-piece is the Word Finder tool (`extra.js` `findMatches()` + the
`.wf-card` UI in `index.html`). Of the 16 components above, the ones most likely to genuinely fit
a single-tool utility page are:

- **FAQ with Tabs** — for the "How Can You Find 5 Letter Words..." reference sections, replacing
  the current plain `<h2>`/`<h3>` stacking with tab-grouped Q&A.
- **Horizontal/Vertical Tabbed Headings** — a candidate replacement for the current five stacked
  `.sec` reference sections in `index.html`.
- **Information Box** — fits the existing "did you know" style asides already scattered through
  the content (e.g. the memory/brain section).
- **Trust Elements** — could reinforce the existing "no sign-up, no account" trust messaging.

Card components (Full/Mid/No-detail), Reviews, Poll, Founder Box, and Opinion Box are a less
obvious fit for a single-tool utility page unless a future brief specifically calls for
testimonials or a card-based word-list browser. Treat this list as a starting hypothesis, not a
decision — confirm against whatever brief actually arrives before implementing anything.
