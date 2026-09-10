# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Word-game players — people stuck on today's Wordle, a crossword clue, or a Scrabble/Words with
Friends rack, who search queries like "five letter words" or "5 letter words with these letters"
and land here wanting a fast, scannable answer plus a way to actually search their specific
letters.

## Product Purpose

An SEO reference page for the five-letter-word slice of the English language: definitions,
categories (by starting letter, double letters, palindromes), special patterns (no vowels,
double letters), and worked guidance for using them in Wordle and crosswords. Success is a
visitor finding the word or list they need and, where relevant, continuing on to the UnscrambleX
word finder to run their own search.

## Positioning

SEO feeder page for unscramblex.com. Its job is to rank for "five letter words" and related
queries, then hand qualified visitors to the main UnscrambleX word-finder tools
(unscramblex.com and its `/word-scrambler`, `/words-start-with/*` routes, etc.) rather than
replicate the finder itself. Content depth and on-page linking into those tools matter more here
than building new interactive functionality.

## Operating Context

Static content page, no backend. Visitors arrive from search, skim for their specific need
(a definition, a category list, a pattern list, or the finder), and either leave satisfied or
click through to an UnscrambleX tool page. No accounts, no user-generated content, no dynamic
data — everything on the page is fixed reference content.

## Capabilities and Constraints

- Currently a plain `index.html` + `style.css` static site (no build step, no framework),
  matching how the rest of the UnscrambleX site network is deployed.
- No hard constraint to stay static/no-build — open to a framework or build step later if it
  would genuinely help, but nothing on the current brief requires one.
- Visual design must stay consistent with unscramblex.com's existing brand (Poppins, navy/blue
  palette, square-cornered components) — see DESIGN.md once recorded.
- Copy, headings, and HTML structure for the current build are governed by an external SEO brief
  (H1/H2/H3/H4 hierarchy, required anchor text, and target keywords) supplied outside this repo;
  treat existing on-page copy as authoritative unless the user says otherwise.
- The `finder` form on the page currently posts to `https://unscramblex.com/` — it is a link into
  the real tool, not a self-contained search implementation.

## Evidence on Hand

- `images/logo.png` — the UnscrambleX logo mark (navy square, white "_X" mark).
- Live reference: unscramblex.com (Poppins font, primary navy `#0e4076`, accent blue `#4d97c0`,
  square/flat components, pale-blue gradient masthead band). No other case studies, testimonials,
  or traffic data are on hand — do not fabricate stats beyond what's already truthfully on the
  page (e.g. word counts should stay defensible, not invented precision).

## Product Principles

- The brief's copy and heading structure are the source of truth; visual work must never
  paraphrase or restructure it.
- Match the UnscrambleX visual system rather than introduce an unrelated design language —
  consistency across the site network is more valuable here than a unique look for this one page.
- Optimize for scan-and-act: a visitor should find their specific word/list fast, and the path to
  the UnscrambleX finder should stay one click away throughout.
- Keep the page honest — no fabricated statistics, testimonials, or capabilities that the static
  page and linked tools don't actually have.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility (keyboard-operable
controls, sufficient contrast, touch targets on mobile) already implied by a public content page.
