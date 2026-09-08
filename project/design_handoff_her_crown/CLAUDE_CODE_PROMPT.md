# Paste this into Claude Code

I have a design handoff package for a product called **Her Crown** — a directory where Black women find hairstylists and rate them. Unzip it at the repo root (or point me at where you put it) and read `design_handoff_her_crown/README.md` first, all the way through, before writing any code.

The package contains:

- `README.md` — the full spec: both screens, exact type/color/spacing values, filter and gate logic, state shape, and design-system rules.
- `Her Crown Stylists.dc.html` — the stylist directory prototype.
- `Her Crown Review.dc.html` — the six-step write-a-review prototype.
- `_ds/broadsheet-.../styles.css` — the design system's only stylesheet; every color, font, space and radius is a CSS variable in it.
- `_ds/broadsheet-.../readme.md` — the design system's own guide (read this too).
- `support.js` — the prototype runtime only. Not part of the design, do not port it.

## What I want built

Both screens, at high fidelity:

1. **Stylist directory** — search and filter stylists by service, chair type (travels to you / salon) and location; a "Picked for you" recommendation strip derived from the active filters; ranked result rows with score, verified-review count, price range and a review pull quote.
2. **Write-a-review flow** — six steps: pick the stylist, verify the visit by uploading a receipt, star rating, service + price paid, photos, then three guided written prompts. Plus a confirmation screen.

## How to approach it

The `.dc.html` files are **design references, not code to copy**. Each one has a template plus a small logic class — read the logic class as a specification of state and behavior, then rebuild the UI natively in this codebase using its existing framework, component primitives, routing and conventions. If there's no app scaffolding yet, ask me before choosing a stack.

Before you start, tell me:

- Which existing components you'll reuse versus build new.
- How you'll wire the design system's tokens (`styles.css`) into the codebase's styling approach — I want the variables as the source of truth, not hard-coded hex values.
- Your file/route plan.

Then implement.

## Rules

- **Copy is final.** Every headline, prompt, placeholder, gate note and rating label in the spec ships verbatim. Don't rewrite or "improve" the voice.
- **Design system is binding.** Broadsheet: Source Serif 4 throughout, paper-white ground, near-black ink, cyan for interactive elements, magenta as a rare second spot. No sans-serif for UI chrome. No boxes or rules to structure the page — hierarchy comes from the serif scale and whitespace. Don't invent colors or spacing values.
- **Read tokens, don't retype them.** Pull from `styles.css` variables.
- **Fluid, not fixed.** The grids use `auto-fit` / `minmax` and everything reflows; no fixed widths or `nowrap` on prose.
- **Real interactive elements.** The prototypes use `role="button"` on divs for clickable cards and chips — use real `<button>` elements, keep keyboard access, and keep the design system's `:focus-visible` ring.
- **Gates matter.** Each review step only advances when its condition passes, and the gate note says what's missing. The conditions are listed in the spec; implement them exactly.

## Backend

The prototypes fake three things — flag them and stub them cleanly rather than pretending they work:

- **Receipt verification.** A boolean in the prototype. In production: a real file upload, stored privately, queued for human review; the review publishes with a verified badge only after approval.
- **Photo upload.** Slot indices in the prototype; real file refs in production.
- **Filtering, sorting and "Newest".** Client-side over six hard-coded stylists. In production these move server-side with pagination, and "Newest" sorts by a real created-at field instead of standing in with review count.

Also: from the directory, "Rate her" should preselect that stylist and skip step 1 of the review flow.

Ask me anything that's ambiguous before building it the wrong way.
