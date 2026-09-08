# Handoff: Her Crown — stylist directory + review flow

## Overview
Her Crown is a directory where Black women find hairstylists and rate them. Two screens are designed:

1. **Stylist directory** (`Her Crown Stylists.dc.html`) — search and filter stylists by service, location and chair type; recommendations are derived from the active filters.
2. **Write-a-review flow** (`Her Crown Review.dc.html`) — a six-step flow: pick the stylist, verify the visit with a receipt, star rating, service, photos, guided written review, then a confirmation.

Product rules that drive the design: only people who can prove a visit can review (receipt upload, human-checked, verified badge on publish), and the written review is collected through three guided prompts rather than a blank box, to push toward constructive specifics.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy. The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component library and routing. If no environment exists yet, choose an appropriate framework and implement the designs there.

Each `.dc.html` file contains a template plus a small logic class (state + derived values). Read the logic class as a specification of state and behavior, not as code to lift.

## Fidelity
**High fidelity.** Final colors, typography, spacing, copy and interaction states. The design system is fixed (see Design Tokens) — recreate the UI to match, using the codebase's own primitives where they exist.

## Design system
Both screens consume the **Broadsheet** design system: newsprint-inspired, all Source Serif 4, paper-white ground, near-black ink, cyan as the interactive accent and magenta as a rare second spot color. Structural rules of the system to preserve:

- No boxes or dividers to structure the page; hierarchy comes from the serif scale and whitespace. Rules appear only as the masthead's thick/thin pair and as hairline separators between list rows.
- `.card` is used only for genuinely discrete items (the recommendation cards), never for layout.
- Everything is set in the serif — no sans-serif for UI chrome.
- Left-aligned, asymmetric: headings flush left, whitespace at the right.
- Never both accents inside the same small component.

`styles.css` in this bundle is the system's only stylesheet and carries every token as a CSS variable. `_ds_bundle.js` carries the print-separation filter defs (unused on these two screens; needed if photographic imagery is added later).

---

## Screen 1 — Stylist directory

**Purpose:** a client states what she needs and where she is, and gets a ranked list of stylists with verified-review counts.

**Layout:** single column, `max-width: 940px`, centered, page padding `30px 20px 40px`. Vertical rhythm entirely from the spacing scale; sections separated by `40px` (`--space-8`).

Top to bottom:

1. **Masthead** — flex row, `space-between`, baseline aligned, wraps. Left: "Her Crown" (heading font, 600, 30px, `letter-spacing: -0.015em`, non-breaking space between words). Right: a row of two 11px uppercase items, `letter-spacing: 0.12em`, `--color-neutral-700`; the second ("Rate a stylist") links to the review flow. Below: `3px solid` ink rule, then `1px solid` ink rule `3px` under it.
2. **Hero** — h1 at 46px/1.05, weight 600, `letter-spacing: -0.02em`, `max-width: 20ch`, `text-wrap: pretty`: "Find hands you can trust." Sub-paragraph 17px/1.55, `max-width: 58ch`, `--color-neutral-800`.
3. **Filter head** — `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`, gap `20px`. Left: `.field` + `.input` text field, label "Where you are", placeholder "Neighborhood or ZIP", default value "Atlanta, GA". Right: `.field` + `.seg` segmented control, label "Chair", options **Either / Travels to you / Salon or studio** (native radios, default Either).
4. **Service chips** — 11px uppercase kicker "What you need", then a wrapping flex row, gap `10px`. Each chip: `8px 14px`, 15px, `radius 2px`, `1px` border. Unselected: transparent fill, `--color-divider` border, ink text. Selected: `--color-accent-100` fill, `--color-accent` border, `--color-accent-800` text. Chips: Knotless braids, Boho braids, Locs / retwist, Silk press, Natural cut, Color, Wash-and-go, Wig install, Kid-friendly. Default selected: **Knotless braids**.
5. **"Picked for you"** — h2 26px, weight 600, plus a 13px `--color-neutral-700` reason line reading `<selected services, lowercased, comma-joined> · <where>`. Below, `repeat(auto-fit, minmax(250px, 1fr))` grid of up to 3 `.card`s, gap `15px`: `.card-kicker` (why it matched — "Travels to you" or "Near <neighborhood>"), `.card-title` 21px, `.card-body` specialty, then a row with the score (heading font, 19px, tabular numerals) and a `.tag.tag-accent` reading "<n> verified". Hidden when there are no results.
6. **Results head** — h2 26px reading `<n> stylist(s) in <where>` (or "No matches"), and on the right a sort control: 11px uppercase "Sort" label plus three text options — Highest rated / Most reviewed / Newest. Active option takes the spot color and `text-decoration: underline`; inactive is `--color-neutral-700`.
7. **Result rows** — `display: grid`, gap `30px` between rows. Each row: `grid-template-columns: minmax(0, 1fr) auto`, gap `20px 30px`, `align-items: start`, `padding-top: 20px`, `border-top: 1px solid var(--color-divider)`.
   - Left column: 11px uppercase area line (`--color-neutral-700`); name in heading font 27px/1.15 weight 600; specialty 16px/1.5, `max-width: 52ch`; a pull quote from a review — 15px/1.6 italic, `max-width: 56ch`, `padding-left: 15px`, `border-left: 2px solid var(--color-accent-2)`; then a wrapping row of `.tag.tag-outline` attributes, gap `10px`.
   - Right column: right-aligned grid, gap `6px` — score in heading font 34px tabular; "<n> verified reviews" 12px `--color-neutral-700`; price range 12px `--color-neutral-700`; a `.btn.btn-secondary` "Rate her" linking to the review flow, `margin-top: 10px`, `white-space: nowrap`.
8. **Empty state** — shown when filters match nothing: 24px heading "Nobody yet for that mix.", 16px/1.55 explanation, `.btn.btn-ghost` "Clear filters" which resets services and chair.
9. **Footer note** — 13px/1.6 `--color-neutral-700`, `max-width: 60ch`, above a `1px --color-divider` rule: scores average verified visits only, a stylist can reply once, nobody can pay for placement.

**Filtering logic:** a stylist matches when (chair is Either OR stylist's chair equals selection) AND (no services selected OR the stylist offers at least one selected service). Sorting: `score` descending, `verified` descending, or `verified` ascending for "Newest" (stand-in for a real created-at field — use the real field in production). Recommendations are the first three sorted matches.

**Seed data** (six stylists, in `Her Crown Stylists.dc.html`'s logic class): name, area, chair (`travels` | `salon`), score, verified count, price range, specialty sentence, service list, three attribute tags, one review pull quote. Copy is final and can ship as demo data.

## Screen 2 — Write-a-review flow

**Purpose:** collect a verified, constructive review in six steps.

**Layout:** single column, `max-width: 800px`, same page padding and masthead treatment as the directory (masthead right side reads "Rate your stylist · Atlanta, GA").

**Step rail** — directly under the masthead rules, `margin-top: 15px`: a wrapping flex row, gap `5px 20px`, of six items, each a baseline-aligned pair of a tabular two-digit number and an 11px uppercase label: 01 Stylist, 02 Verify, 03 Rating, 04 Service, 05 Photos, 06 Write-up. Current step takes the spot color (magenta by default), completed steps full ink, upcoming steps `--color-neutral-500`.

**Step body** — one visible at a time, `margin-top: 40px`. Steps 2–6 open with an 11px uppercase kicker ("Step two · proof of chair" etc.); step 1 opens straight on its h1.

1. **Pick the stylist** — h1 44px/1.08 "Who had their hands in your hair?", 17px sub-paragraph, then a `display: grid; gap: 15px` list of `.card`s. Each card: `grid-template-columns: 1fr auto`, gap `20px`, `cursor: pointer`, `role="button"`, `tabIndex=0`; left side `.card-kicker` area, `.card-title` 21px name, `.card-body` specialty; right side score in heading font 22px and a `.tag.tag-accent` "<n> verified". Selected card's border becomes `--color-accent`. Clicking a card selects it and advances to step 2.
2. **Verify the visit** — h1 40px/1.1 "Show us the receipt." Drop target: `padding: 40px 20px`, centered, `1.5px dashed var(--color-neutral-400)`, `radius 2px`, `--color-neutral-100` fill; title 20px heading font, note 14px. Empty state: "Drop your receipt here" / "JPG, PNG or a screenshot. Nothing else on the image is stored." Filled state: "receipt-0824.jpg ✓" / "Date and amount match a booking on Aug 24 — tap to replace". Clicking toggles the state in the prototype; in production this is a file input plus upload. Below, 13px note: receipts are reviewed by a person, review posts with a verified badge once it clears, usually within a day.
3. **Star rating** — h1 "How did you walk out feeling?", then five 48×48px star buttons, 40px glyph, gap `10px`. Filled `--color-accent-2`, empty `--color-neutral-300`; hover previews the fill up to the hovered star, leaving resets to the committed value. Under it a 26px heading-font label with `min-height: 34px` and a 15px/1.55 hint, both driven by the shown value:
   - 1 "Rough day in the chair" / "Say what went wrong plainly. She can only fix what she can hear."
   - 2 "Not what you asked for" / "Was it the style, the timing, or the price? Pick the one that mattered most."
   - 3 "Fine, not memorable" / "The middle scores are the most useful ones. Be specific about the gap."
   - 4 "Solid. You would go back" / "Tell us the one thing that would have made it a five."
   - 5 "Laid. Absolutely laid" / "Now tell everybody why so she gets booked all month."
   - none "Tap a star" / "Five stars means you would hand her your daughter's hair."
4. **Service** — h1 "What did you sit down for?", the same chip set and chip styling as the directory (multi-select, no default), then a `.field` + `.input` at `max-width: 320px`, label "What you paid, all in", placeholder "$220".
5. **Photos** — h1 "Let us see it." Three slots in `repeat(auto-fit, minmax(180px, 1fr))`, gap `15px`, each `aspect-ratio: 4/5`, centered content, `1.5px dashed` border, `radius 2px`. Empty: `--color-neutral-100` fill, `--color-neutral-400` border, 18px heading-font title and 13px note — "Day one / Fresh out of the chair", "Two weeks in / How it held up", "The parts / Close-up of the scalp". Filled: `--color-accent-100` fill, `--color-accent` border, title "Added ✓", note "<slot name> · tap to remove". Optional step.
6. **Write-up** — h1 "Say the useful part." Three prompts in a `gap: 30px` grid, each: 21px/1.3 heading-font question (`max-width: 46ch`), 13px help line, `textarea.input` `rows="3"` with a placeholder:
   - "What did you ask for, and what did you leave with?" / "Reference photo versus real result." / "I brought a photo of medium knotless to the waist…"
   - "How was the process — time, tension, communication?" / "Start time, finish time, how your scalp felt that night." / "Booked for 9, started at 9:20, out by 3…"
   - "One thing another woman should know before booking." / "The detail you wish someone had told you." / "Come with your hair already blown out or it adds an hour…"
   Below, a house-rule note: 14px/1.6, `max-width: 58ch`, `padding-left: 15px`, `border-left: 2px solid var(--color-accent-2)`, italic lead-in "House rule:" — critique the work, the timing and the price, not her body, shop or personal life; venting gets sent back for a rewrite, not deleted.
7. **Confirmation** — kicker "Filed" in `--color-accent-2-700`; h1 46px/1.08 — "Somebody's about to get booked." at 4–5 stars, "Thank you for the honest one." below that; 17px/1.6 paragraph explaining the receipt check and that photos sit at the top of the stylist's page; then a 15px summary list of four label/value rows (labels 90px wide, 12px uppercase `--color-neutral-700`): Stylist, Score ("n out of 5"), Service (services joined, plus price if given), Photos ("n attached" or "None"). Finally a `.btn.btn-secondary` "Write another one" that resets all state to step 1.

**Footer nav** — visible on steps 2–6 only, `margin-top: 40px`, `padding-top: 20px`, `border-top: 1px solid var(--color-divider)`, flex `space-between`. Left: `.btn.btn-ghost` "← Back", disabled on step 2. Right: a 13px gate note in `--color-neutral-700` plus `.btn.btn-primary` reading "Continue", or "File the review" on the last step.

## Interactions & Behavior

**Directory**
- Chips, chair segments and sort options apply instantly; no submit button, no page transition.
- Chip, button, input and tag hover/active/focus states all come from the design system — do not restyle them. Focus is a `2px solid var(--color-accent)` ring at `2px` offset.
- Card and chip click targets also respond to keyboard (they carry `role="button"` and `tabIndex=0`); in production use real `<button>` elements.
- "Rate her" and "Rate a stylist" navigate to the review flow. In production, "Rate her" should preselect that stylist and skip step 1.

**Review flow**
- Steps advance only when the current step's gate passes; the Continue button is disabled otherwise and the gate note says what is missing.
  - Step 1: a stylist is selected (selection itself advances).
  - Step 2: a receipt is attached — note "Receipt needed".
  - Step 3: rating > 0 — note "Pick a score".
  - Step 4: at least one service — note "Pick at least one".
  - Step 5: always passes — note "Optional" or "<n> added".
  - Step 6: combined word count across the prompts ≥ 25 (configurable) — note "<n> more words", then "<n> words".
- Star hover preview resets on mouse leave; hover state also resets on every step change.
- No animation or transition beyond the design system's own hover transitions.
- Both screens are fluid: the filter head, recommendation grid, photo slots and result rows all reflow at narrow widths (`auto-fit` grids, `minmax(0, 1fr)` text column, wrapping meta rows). No fixed widths, no `nowrap` on prose.

## State Management

**Directory:** `where: string`, `chair: 'either' | 'travels' | 'salon'`, `picked: string[]` (services), `sort: 'score' | 'verified' | 'new'`. Everything else is derived per render (matches, sorted list, recommendations, headings). Data comes from a stylist collection; in production, filtering and sorting move server-side with pagination.

**Review flow:** `step: 0–6`, `stylist: index | null`, `receipt: boolean` (a file/upload id in production), `rating: 0–5`, `hover: 0–5` (transient), `services: string[]`, `paid: string`, `photos: number[]` (slot indices; file refs in production), `answers: { a, b, c }`. On submit: create a pending review, queue the receipt for human verification, publish with a verified badge on approval.

**Configurable props exposed on the prototypes** (worth keeping as real config): spot color (magenta or cyan), guided prompts on/off (off collapses step 6 to one box, "Tell us how it went."), and the minimum word count.

## Design Tokens
All values are CSS variables in `styles.css` — read them from there rather than hard-coding.

**Colors**
- Ground `--color-bg` `#f3f2f2`; card/field fill `--color-surface` `#eae9e9`; ink `--color-text` `#201e1d`; `--color-divider` = ink at 16%.
- Accent (cyan, interactive) `--color-accent` `#0088b0`; second spot (magenta) `--color-accent-2` `#d6006c`.
- Neutral ramp 100–900: `#f8f4f4`, `#eae7e7`, `#d7d3d3`, `#bab6b6`, `#9b9797`, `#7d7979`, `#605d5d`, `#444141`, `#2d2b2b`.
- Accent ramp 100–900: `#e9f8ff`, `#cbeeff`, `#99e0ff`, `#62c5ee`, `#38a6cf`, `#1186ac`, `#006786`, `#004961`, `#0a303e`.
- Accent-2 ramp 100–900: `#fff1f4`, `#ffdee6`, `#ffc0d0`, `#ff90b1`, `#ff458e`, `#d82071`, `#aa0b56`, `#790e3d`, `#4b1528`.
- Contrast rule applied throughout: small text (11–15px) uses `--color-neutral-700`/`-800` rather than alpha-muted ink, so it clears 4.5:1 on the ground. Accent at full strength is only for interface chrome and large type; accent-size paragraph text uses `--color-accent-700`.

**Spacing scale** (density 1.25×): `--space-1` 5px, `-2` 10px, `-3` 15px, `-4` 20px, `-6` 30px, `-8` 40px.

**Radius:** `--radius-sm` 1px, `--radius-md` 2px, `--radius-lg` 4px. Everything on these screens uses `--radius-md`.

**Typography:** `--font-heading` and `--font-body` are both `"Source Serif 4", system-ui, sans-serif`; heading weight 600, true italic at body weight for pull quotes and emphasis. Sizes used: 46/44 (page h1), 40 (step h1), 34 (result score), 30 (masthead), 27 (result name), 26 (section h2, rating label), 21 (card title, prompt question), 20 (drop-target title), 17 (lede), 16 (specialty), 15 (chips, quote, summary rows), 14 (drop note, house rule), 13 (helper), 12 (right-column meta), 11 (uppercase kickers, `letter-spacing: 0.12em`). Display headings carry `letter-spacing: -0.02em`; numeric scores use `font-variant-numeric: tabular-nums`.

**Shadows:** `--shadow-sm/md/lg`, used only via `.card` / `.elev-*`.

## Assets
No images, photographs or icon assets are used. If imagery is added later, the design system prints photographs through its process-plate treatment (`.cmyk`) or the halftone dot screen (`.halftone`) — the filter defs ship in `_ds_bundle.js`. Icons, if needed, are Phosphor icons in the duotone weight.

## Files
- `Her Crown Stylists.dc.html` — directory screen (template + logic + seed data).
- `Her Crown Review.dc.html` — six-step review flow (template + logic + copy).
- `_ds/broadsheet-.../styles.css` — the Broadsheet stylesheet: all tokens plus the component layer (`.btn`, `.tag`, `.card`, `.field`, `.input`, `.seg`, `.radio`, `.nav`, `.table`, `.dialog`).
- `_ds/broadsheet-.../_ds_bundle.js` — compiled design-system bundle (print-separation filter defs).
- `_ds/broadsheet-.../readme.md` — the design system's own guide.
- `support.js` — the prototype runtime the `.dc.html` files load. Not part of the design; not needed in production.

To view a prototype, open either `.dc.html` in a browser with the folder structure of this bundle intact — the pages reference `_ds/broadsheet-.../styles.css` and `support.js` relative to themselves.
