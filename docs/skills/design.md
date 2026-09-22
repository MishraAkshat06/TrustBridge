# TrustBridge — UI/UX Design Direction

The design system for the TrustBridge frontend, and the rules that keep it
coherent. Written against the actual implementation in `frontend/src`, not
against an aspiration.

Sources: the project's own
`docs/TrustBridge_Frontend_UIUX_Design_Specification.md` and the token set in
`frontend/src/index.css`; Wathan & Schoger's *Refactoring UI*; Material Design 3
motion tokens; Radix Colors' 12-step scale; shadcn/ui's semantic pairing
convention; Vercel's Web Interface Guidelines; WCAG 2.2. Contrast ratios in §3
were computed from the relative-luminance formula against the real token values —
they are measurements, not estimates.

---

## 1. Aesthetic direction

**"Institutional fintech."** Dense, data-first, calm. The target is the visual
grammar of Binance, Groww, Stripe, and Kickstarter — not a neon Web3 prototype
and not a generic rounded-corner SaaS template.

### Two themes, and the honest reason why

The app ships both:

- **Light — "Groww."** Warm off-white canvas, green accent. This is the default.
  Groww's stated design philosophy is worth adopting wholesale: *reducing
  investing anxiety, semantic tokens over hardcoded colours, favouring clean UI
  over dense trading charts, building confidence via transparent fees and
  charts.* For a crowdfunding app whose users are nervous about losing money,
  that is the right register.
- **Dark — "Binance Pro."** Near-black canvas, gold accent. Denser, more
  instrument-panel.

The justification is not "users prefer dark." It is the pattern Binance itself
uses: **dark for browsing, exploration, and dashboards; light for transactional
surfaces** where the user is committing money. Frame the dark theme this way in
the report and it becomes a defensible design decision rather than a toggle.

One thing to know and state: the research on readability favours dark-text-on-light
for sustained reading. Dark mode's advantage is aesthetic and contextual, not
ergonomic, and its OLED power saving drops from ~43% at full brightness to ~7–8%
at 50%. Do not claim dark mode is "easier on the eyes."

### Anti-AI-template rules

These are the specific tells that make a project look generated. All are banned.

1. **One border-radius on everything.** Radius is a hierarchy signal, not a
   global constant. Name radii by *role*, not by size (see §5).
2. **The "SaaS-card kit"** — content chopped into identical rounded cards, each
   with the same soft grey `rgba(0,0,0,0.1)` shadow. Vary treatment by content
   type.
3. **The big-number-with-small-label hero, by default.** Named explicitly as a
   default treatment. TrustBridge's hero *is* a funding figure, so use it — but
   with a stated reason, not by reflex.
4. **Gradient washes as decoration**, and gradients as the only source of depth.
5. **Tracked-out ALL-CAPS eyebrows on every section.**
6. **`·`-joined meta strings** everywhere.
7. Cream `#F4F1EA` + serif display + terracotta, and near-black + acid-green:
   the two most saturated AI-default palettes. Neither is in use here.
8. **`→` appended to link text.**

Guiding principle: **spend boldness in one place.** Pick one element per screen
to be loud and keep everything else quiet. On a campaign card that element is the
funding progress bar, not the card border, the badge, and the button at once.

---

## 2. Token architecture

Keep the current structure — a flat set of semantic custom properties in
`src/index.css`, defined once in `:root` and overridden in `.dark`. It is the
right size for this project.

A full three-tier system (primitive → semantic → component) is the standard
recommendation and is what shadcn/ui and Radix do, but at this scale it adds
indirection without paying for it. Revisit only if a third theme or a shared
component library appears.

Two rules make the flat set work:

1. **Components read only from custom properties.** Never a raw hex value. A
   hardcoded colour is a component that is broken in one of the two themes.
2. **Every background token has a foreground partner.** shadcn's convention:
   never define `--bg-x` without deciding what text sits on it. The current set
   does this correctly with `--bg-canvas`/`--text-primary` and
   `--accent-brand`/`--accent-brand-text`.

### Tailwind v4 wiring — the gotchas

- There is **no `tailwind.config.js`.** v4 is CSS-first. Dark mode is declared
  with `@custom-variant dark (&:where(.dark, .dark *))` — which the project
  already does correctly in `index.css`.
- **This project does not use `@theme` at all.** Its tokens are plain custom
  properties in `:root` (`index.css` line 8) and `.dark` (line 43), written
  **outside any `@layer`**. That works, because a bare `:root { --x: … }` is
  itself unlayered and unlayered declarations beat every layer — but it means
  the token set is invisible to Tailwind's theme resolution, so utilities like
  `bg-canvas` or `text-primary` do not exist. Components read the variables
  through arbitrary values (`bg-[var(--bg-canvas)]`) or through the project's
  own CSS classes. Know which of the two you are writing before adding a token.
- `@theme` may be declared **once** and **cannot be nested inside a selector.**
  If tokens are ever migrated into it, per-theme overrides go in `.dark { … }` or
  `@layer theme { :root, :host { @variant dark { … } } }`.
- **Unlayered CSS beats every layer.** This is not hypothetical here — it is the
  project's current arrangement. A stray `:root { --color-x: … }` added after the
  existing block silently wins over everything, including a later `@theme`. Edit
  tokens in place, in the two existing blocks, rather than appending new ones.
- Need `:host` in the override block if any component ever ships in a Shadow DOM.

### Flash of Wrong Theme

The theme is applied by a `.dark` class on `<html>`. This project sets it in
React on mount, so the page renders light and then flips dark 100–200ms later.

Verified as built: `index.html` contains **no inline script**, and the toggle
lives in `App.jsx` (`MainLayout`) — `useState` seeded from
`localStorage.getItem('trustbridge_theme')`, written back by a `useEffect` that
toggles the class. Nothing sets the class before React hydrates. The flash is
present, and this is why.

**Fix:** an inline blocking script in `<head>` in `index.html`, before any CSS,
reading the stored preference and setting the class synchronously. The key must
match the one the toggle writes — `trustbridge_theme`.

---

## 3. Contrast audit — measured, with failures

Computed with the WCAG 2.2 relative-luminance formula against the actual token
values in `src/index.css`. Light surfaces are `--bg-canvas` `#FAF9F6`; dark
surfaces are `--bg-canvas` `#0B0E11` and `--bg-surface` `#181A20`.

Thresholds: **4.5:1** normal text (AA) · **7:1** normal text (AAA) · **3:1**
large text, UI components, and meaningful graphics (SC 1.4.11) · **24×24px**
minimum target (SC 2.5.8).

### Light theme — several real failures

| Token | Value | On | Ratio | Verdict |
|---|---|---|---|---|
| `--text-primary` | `#111827` | canvas | **16.96:1** | AAA |
| `--text-secondary` | `#475569` | canvas | **7.23:1** | AAA |
| `--text-muted` | `#64748B` | canvas | **4.55:1** | AA text only, not AAA |
| `--accent-brand` | `#00D09C` | canvas | **1.91:1** | **FAIL** — fill only, never text |
| white on `--accent-brand` | `#FFFFFF` | brand fill | **2.00:1** | **FAIL** — dark label required |
| `--accent-brand-text` | `#00875A` | canvas | **4.35:1** | Marginal fail for body text |
| `--color-success` | `#10B981` | canvas | **2.42:1** | **FAIL** even the 3:1 UI threshold |
| `--color-warning` | `#F59E0B` | canvas | **2.05:1** | **FAIL** even the 3:1 UI threshold |
| `--color-danger` | `#EF4444` | canvas | **3.59:1** | 3:1 only — body text fails |
| `--accent-gold` | `#D97706` | canvas | **3.04:1** | 3:1 only — body text fails |

Three findings that matter:

**White text on the brand green fails.** `#FFFFFF` on `#00D09C` is 2.00:1. Any
primary button using white-on-green is failing. The fix is dark text on the bright
fill: `#111827` on `#00D09C` is **8.88:1**, comfortably AAA. Bright-green-fill
with dark label is also the more contemporary treatment.

**Success and warning fail even the 3:1 non-text threshold.** At 2.42:1 and
2.05:1, a green success chip or an amber warning icon on the light canvas is not
perceivable enough for WCAG 1.4.11, which explicitly covers UI components and
meaningful graphics. This is not a nitpick — it is the more serious of the
findings, because those two colours carry risk semantics in this app.

**Brand green cannot be text on light.** At 1.91:1 it is unusable as a label, a
link, or a figure. Keep it as a fill.

### Recommended light-theme corrections

| Token | From | To | New ratio | Why |
|---|---|---|---|---|
| `--color-success` | `#10B981` | `#059669` | 3.60:1 | Clears 3:1 for UI/graphics |
| `--color-success` (as text) | `#10B981` | `#047857` | 5.24:1 | Clears AA for body text |
| `--color-warning` | `#F59E0B` | `#B45309` | 4.79:1 | Clears AA for body text |
| `--color-danger` | `#EF4444` | `#DC2626` | 4.61:1 | Clears AA for body text |
| `--accent-brand-text` | `#00875A` | `#047857` | 5.24:1 | Clears AA for body text |
| brand fill label | `#FFFFFF` | `#111827` | 8.88:1 | Fixes the button failure |

Decide per surface whether each semantic colour is used as a **fill** (needs 3:1
against its backdrop) or as **text** (needs 4.5:1). Two variants per semantic
family is the normal outcome — Wise ships exactly this pattern with
`positive`/`positive-deep` and `warning`/`warning-deep`/`warning-content`.

### Dark theme — healthy

| Token | Value | On | Ratio | Verdict |
|---|---|---|---|---|
| `--text-primary` | `#EAECEF` | canvas | **16.35:1** | AAA |
| `--text-secondary` | `#848E9C` | canvas | **5.82:1** | AA |
| `--accent-brand` | `#F0B90B` | surface | **9.65:1** | AAA |
| `--color-success` | `#0ECB81` | canvas | **9.10:1** | AAA |
| `--color-danger` | `#F6465D` | canvas | **5.53:1** | AA |

Two things the dark theme gets right and should keep doing:

**The canvas is `#0B0E11`, not `#000000`.** Pure black with near-white text
causes halation — text glows and edges vibrate, worst for users with astigmatism.
`#EAECEF` on `#0B0E11` gives 16.35:1, which is ample without the glow. Revolut
deliberately requires true black; this project should not copy that.

**Success and warning are lighter and less saturated than in light mode**
(`#0ECB81` vs `#10B981`, `#F0B90B` vs `#F59E0B`). That is exactly the
adjustment the guidance calls for: saturated colours become aggressive and
harder to read on dark, so dark-mode accents should be lighter and slightly more
muted, not identical. Keep these two token sets distinct.

One note: in dark mode `--accent-gold` and `--accent-brand` are both `#F0B90B`,
so "gold" is not a distinct role there. That is fine and matches Binance, which
has no secondary brand colour at all — but it means dark mode has exactly one
accent, so its scarcity matters more, not less (see §7).

---

## 4. Spacing

Base unit **4px**. Two scales, deliberately different:

**In-component gaps** — `4 · 8 · 12 · 16 · 20 · 24`

**Layout rhythm** — `32 · 48 · 64 · 96`

Two rules:

- **More space around a group than within it.** Ambiguous internal-vs-external
  spacing is a functional bug, not a taste call — if the gap inside a card looks
  the same as the gap between cards, grouping is destroyed.
- **Never mix a 4px base and an 8px base.** Pick 4px and stay there. Tailwind's
  default `--spacing: 0.25rem` multiplier already gives exactly this; use
  `p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px.

Do not adopt *Refactoring UI*'s non-linear scale (`4 8 12 16 24 32 48 64 96 128
192 …`) wholesale — Tailwind's 4px multiplier covers the realistic range, and
mixing a custom scale into Tailwind classes creates inconsistency for no gain.

---

## 5. Type, radius, elevation

### Type ramp

Tailwind v4's default ramp is sound. Two project-specific rules:

- **All financial values, addresses, hashes, gas figures, and percentages use a
  monospace face** with `font-variant-numeric: tabular-nums`. Non-negotiable —
  proportional digits make numbers jitter horizontally every time a live value
  updates, and misaligned figures are harder to compare down a column.
- **Two weights only in UI text: 400 and 500.** 600/700 reserved for headings.
  Never below 400.

Line height inversely tied to size: body `1.5`, headings `1.15–1.3`. Line length
45–75 characters for prose. Negative letter-spacing on display sizes only —
never on body text. Use `rem`/`px`, never `em` in the scale (`em` compounds
through nesting and produces unpredictable sizes).

Groww's production convention, worth matching for the light theme: Inter
`15px/1.5` body, headings weight 700, `letter-spacing: -0.02em`.

### Radius — name by role, not size

| Token | Value | Applies to |
|---|---|---|
| `--radius-control` | `6px` | Buttons, chips, inputs |
| `--radius-surface` | `12px` | Cards, panels, tables |
| `--radius-overlay` | `16px` | Modals, drawers, popovers |
| `--radius-pill` | `9999px` | Status badges, avatars |

This matches Groww's production set (6/12/20) closely enough to feel native to
the light theme. **Child radius ≤ parent radius**, kept concentric — an
overlay's inner elements step down, they do not stay equal.

### Elevation — the dark-mode problem

Light mode: **two-part layered shadows** (a tight dark layer plus a larger soft
one). One-part and two-part shadows must not be mixed in the same project. Shadow
colour is transparent dark, never an opaque grey — and tinting the shadow toward
the canvas hue reads better than pure black.

```css
--shadow-control: 0 1px 2px rgba(0,0,0,0.05);
--shadow-card:    0 4px 6px rgba(0,0,0,0.10);
--shadow-overlay: 0 20px 25px rgba(0,0,0,0.15);
```

**Dark mode must not use shadows at all.** A shadow is invisible against a
near-black canvas, so cards simply vanish and depth is lost. Use **lightness
steps** instead:

| Level | Token | Value |
|---|---|---|
| Base canvas | `--bg-canvas` | `#0B0E11` |
| Raised card | `--bg-surface` | `#181A20` |
| Elevated / popover | `--bg-surface-elevated` | `#1E2329` |

The project already does this correctly — it uses borders and lightness rather
than shadows, and the spec's "restrained depth: 1px subtle borders and slight
backdrop blur rather than heavy shadows" is the right call. Keep it. As a test,
squint at the screen: if you cannot tell where surfaces begin and end, the steps
are too close.

---

## 6. Motion

The project currently has no motion tokens. Adopt Material 3's, which are the
best-specified numeric set available.

### Durations

```css
--duration-short:  100ms;   /* button press, toggle, colour change */
--duration-medium: 200ms;   /* hover, focus ring, chip state */
--duration-long:   300ms;   /* menu open, dropdown, modal, panel slide */
--duration-slow:   500ms;   /* accordion, drawer, layout change */
```

Rationale in one line: under 150ms reads as a glitch, over 400ms reads as lag,
and no transition at all reads as broken. **Exit is shorter than entry** —
roughly 75% of the enter duration.

### Easing

```css
--ease-standard:    cubic-bezier(0.2, 0, 0, 1);      /* begin and end on screen */
--ease-decelerate:  cubic-bezier(0.05, 0.7, 0.1, 1);  /* entering */
--ease-accelerate:  cubic-bezier(0.3, 0, 0.8, 0.15);  /* leaving */
```

Note: Material 3 replaced the older `cubic-bezier(0.4, 0, 0.2, 1)` standard
curve, which is still the most widely cited. **Pick one generation and document
it** — mixing them produces motion that feels inconsistent without an obvious
cause. This document follows M3.

### Rules

- **Animate `transform` and `opacity` only.** Never animate layout properties.
- **Never `transition: all`.** List the properties. `transition: all` on a
  control also animates the focus ring, which is an accessibility bug.
- **Never animate the focus indicator.**
- Use CSS first, the Web Animations API second, a JS library last.
- Motion must be interruptible and input-driven. Anything that autoplays for
  more than 5 seconds needs pause/stop/hide controls.
- Nothing may flash more than 3 times per second (photosensitive epilepsy).

### Reduced motion — guard globally

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Use `0.01ms`, **not `animation: none`** — `none` prevents `animationend` and
`transitionend` from firing, so cleanup listeners never run and `will-change`
never releases.

The usual failure is guarding only some animations. One published audit found
only 6 of ~86 infinite animations guarded, with ~325 transitions running
unconditionally. Guard the whole document, including any critical inline CSS.
Reduced motion must preserve layout and meaning — a static fallback, not a
broken grid.

---

## 7. Financial data display

This section is where a fintech UI is judged. Getting it wrong makes the app look
amateur in exactly the way that undermines a trust product.

### Money

- **Tabular figures always.** Stripe's rule, verbatim: money cells rendered
  without tabular numerals violate the system.
- **Right-align numbers, align on the decimal point. Left-align labels and prose.
  Never right-align prose.**
- **Keep units out of cells** — put `ETH`/`%` in the header so digits align.
- **Fixed decimals per context.** Never mix `14.5 ETH` and `14.54 ETH` in the
  same view. Two decimals for ETH; two for percentages.
- **Never display raw `formatEther` output.** `39999999999999996 wei` renders as
  `0.039999999999999996 ether`. Round at display, and only at display.
- **Round half-away-from-zero, not truncate** when reducing precision.
- Minor units differ per currency — USD/EUR 2, JPY/KRW 0, BHD/KWD/TND 3. Use
  `Intl.NumberFormat`. Never hardcode separators.

### ethers v6 correctness — this is where real money bugs live

- **JavaScript `Number` cannot hold wei.** It is exact only to 2^53, about
  **0.009 ether**. Never let an amount round-trip through `Number`, `parseFloat`,
  or `Number(value)`.
- **ethers v6 dropped `BigNumber` for native `BigInt`.** Mixing v5 patterns
  (`ethers.utils.*`, `BigNumber` imports) into v6 crashes at runtime when reading
  balances.
- **Convert only at the edges.** Parse once on input with `parseEther`, format
  once on display with `formatEther`. Everything in between stays in wei/BigInt.
- **`parseUnits('1.2.3')` throws** `Value.InvalidDecimalNumberError`. Catch it
  and surface it as form validation, not as a failed transaction.
- **Centralise all formatting in one utility file.** Two files import ethers in
  this project (`context/AppContext.jsx` and the unmounted
  `components/Navbar.jsx`), and both do formatting work by hand. One utility
  file, or rounding drift starts the moment a third caller appears.

### Addresses

- One reusable `AddressRow` component. Truncate to `0x1a2b...3c4d`, monospace,
  muted background, padding. Full value in a `title` tooltip; a `break-all` mode
  for the full form.
- **Copy feedback clears after 2 seconds**, announced through an `sr-only` region
  with `aria-live="polite"` and `aria-atomic="true"`. Separate
  `copyAriaLabel` and `explorerAriaLabel`.
- Give each address an identicon or blockie. One usability study reports
  recognition time dropping from 8.3s to under 0.5s when a hex string is replaced
  by a resolved name — the same principle applies to visual identicons.
- In flex rows, put **`min-w-0`** on the shrinking element or long addresses will
  overflow instead of ellipsising.

### Transaction state

The spec already defines a four-state drawer — signature request, broadcast
pending, block confirmation, reverted with the exact contract revert reason.
**This is the strongest part of the existing design spec. Keep it.**

Additions:

- **Silence is the failure mode.** Every state change needs visible feedback.
- **Disable submit while in flight.** After the first click the button becomes
  "Submitting…" and stays disabled until a final result. One short line explains
  what is happening.
- **A lost response is not an error.** Do not say "Failed, try again" — say the
  status is unknown and offer "Check status." A retry is only safe with the same
  idempotency key, or a retry can double-spend.
- **No optimistic UI for money.** Optimistic updates are only safe for reversible
  actions like starring or saving a draft. For an irreversible transfer, show the
  confirmed state. A pending badge, if used, must not survive a page reload.
- Loading state: show after 150–300ms, minimum visible 300–500ms, to avoid
  flicker on fast responses.

### Funding progress

- **Cap the percentage.** `Math.min(100, Math.round((raised / goal) * 100))`.
  Uncapped, an overfunded campaign renders its bar past the container and breaks
  the layout. Show an "Overfunded" badge instead when `raised > goal`.
- **Dual progress bar** — current total against both the 10 ETH soft goal and the
  20 ETH hard cap. This is a genuinely good idea from the existing spec: it makes
  the two thresholds legible at a glance, which is the central mechanic of the
  product.
- **Use the native `<progress>` element**, not a width-percentage div. A div with
  a width style is invisible to screen readers. Add `aria-valuenow` and
  `aria-valuemax`.
- Colour the bar by proximity: emerald under cap, amber near cap, red at cap.

### Green and red

- **Green/red are text and icon colours only — never card or background fills**,
  and never reused as generic success/error indicators. Both Binance and Coinbase
  state this rule explicitly for trading semantics. TrustBridge has the same
  hazard: campaign funding progress and risk level must not share a palette
  indiscriminately with generic form validation.
- **Never encode gain/loss by colour alone.** Roughly 1 in 12 men have red-green
  colour-vision deficiency. Pair colour with a sign, an arrow, or a shape.
- **Status colour plus shape**, not colour alone — this is the same principle
  behind the stoplight failure the accessibility guidance warns about.

### Risk and disclaimer presentation

- The AI disclaimer must have **at least equal prominence to the claim it
  qualifies**, and must sit **next to** that claim. An 8px grey footnote at the
  bottom of the page does not satisfy this and is the most likely compliance miss
  in the current design.
- State the risk level with a shape or icon plus text, not a coloured dot alone.
- The monospace disclaimer callout already specified is the right treatment —
  keep it, and make sure it is not rendered smaller than body text.
- Delayed or stale data gets a visible badge.

---

## 8. Accessibility

### Focus

```css
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }
```

**`--focus-ring` does not exist yet.** `index.css` defines no such token, so this
snippet fails silently into `outline: 2px solid` — an invalid colour makes the
whole declaration drop and the ring disappears. Add the token to both `:root`
and `.dark` before using it, and choose the value by the 3:1 rule below against
whichever surfaces it lands on.

- Ring: **2–3px, offset from the element, ≥3:1 against adjacent colours.**
- **Do not build focus rings from `box-shadow`.** That includes Tailwind's
  `ring-*` utilities. `box-shadow` is **not rendered in forced-colors mode**, so
  the ring disappears entirely for Windows High Contrast users, and browsers skip
  it on table rows. **Use `outline`.** This is a direct trap for this stack.
- On dense rows and `<tr>`, use `outline-offset: -2px` so the ring insets rather
  than colliding with neighbours.
- **Interactions must increase contrast** — `:hover`, `:active`, and `:focus` all
  need more contrast than the resting state.
- Sticky headers and the chat widget **must not obscure the focused element**
  (SC 2.4.11). This app has both.
- Hover-only interactions fail. Anything revealed on hover needs `:focus-within`
  parity — the existing nav dropdowns and tooltip patterns are the places to check.

### Targets and pointer

- **24×24 CSS px minimum** (SC 2.5.8, AA). **44×44px** on mobile.
- Form fields 40px minimum height.
- **Anything drag-operable needs a single-pointer alternative** (SC 2.5.7).
- Mobile inputs need `font-size: 16px` minimum or iOS zooms on focus.

### Non-obvious checks

- **SC 1.4.11's 3:1 covers meaningful graphics** — chart lines and pie slices
  explicitly. If progress charts are added, their strokes are subject to it.
- **Errors must not be colour-only.** Icon plus text plus `aria-invalid`.
- **Placeholder text is not a label.** It vanishes on typing and is typically
  low-contrast. Every control needs a real `<label>` or `aria-label`.
- **Links are anchors, buttons are buttons.** A `<div onClick>` breaks
  Cmd/Ctrl-click. Use `<button>` for actions, `<a>`/`<Link>` for navigation.
- Async updates — toasts, validation results — need `aria-live="polite"`.
- Icons: `aria-hidden="true"` when decorative, `aria-label` when the icon is the
  only content.
- `overscroll-behavior: contain` in modals and drawers; `touch-action: manipulation`.
- Check contrast at the **lowest-contrast point** of any gradient behind text.

### Forced colors and high contrast

Windows High Contrast **overrides all colours**. In that mode `box-shadow` and
`text-shadow` compute to `none` and `background-image` computes to `none`, so any
depth or state conveyed by a shadow or a background image is lost. Use
`ButtonText`, `ButtonBorder`, `Highlight`, and `LinkText` system keywords, and use
`currentColor` in SVGs. Test with Chrome DevTools → Rendering → Emulate
`forced-colors: active`.

Also support `prefers-contrast: more` — stronger foreground, heavier focus rings,
removed subtle borders.

---

## 9. Layout

### Containers

Content max-width **1200px**. This is where Coinbase, Wise, Stripe, and Revolut
independently converge, and it is right for a data-dense app. Tailwind's
`max-w-7xl` is 80rem (1280px) — use a custom `1200px` container instead.

### Breakpoints

Tailwind defaults: `sm 40rem · md 48rem · lg 64rem · xl 80rem · 2xl 96rem`.
Test at **280px** and **320px** as well as the standard widths — 280px is the
narrowest realistic viewport and where layouts break first.

### Tables

The **ledger and verifier queue** are the two table surfaces.

- Row density: **comfortable 44–52px** default; offer a **compact 28–36px** toggle
  for the verifier queue, which is a pro-density surface.
- 1px hairline rules, not heavy zebra striping.
- Sticky header; freeze the first identifier column on horizontal scroll.
- Titles state the insight; footnotes carry source and refresh time.
- Limit a dashboard to **5–7 primary elements**. One cited example moved from
  three to nine status colours and became measurably slower to read. The
  campaign detail page is dense by design — make sure density is from data, not
  from competing accents.

### Campaign detail — the 60/40 split

The campaign page is the one screen where the money decision is made, so it gets a
purpose-built layout rather than the standard grid. Propose:

**Left column, 60% — campaign and evidence.** Pitch narrative and technical
specifications; the AI decision-support card (success probability, risk tier, and
a disclaimer rendered adjacent to the score per §7, not footnoted); and the
milestone roadmap as an accordion over Tranches 1–4, each row showing deliverables,
submitted evidence, and verification status.

**Right column, 40% — sticky order terminal.** Live contract telemetry (raised,
hard cap, remaining capacity), the contribution input with preset chips
(`+0.5` · `+1.0` · `Max cap`), the automatic excess-refund notice, a primary
Contribute action, and a Request Refund action enabled only in `FAILED` or
`REFUNDABLE`. Sticky, because the amount being committed must stay visible while
the user reads the pitch.

Two constraints on the sticky column:

- It must not obscure the focused element (SC 2.4.11). On a page tall enough to
  scroll, a sticky 40% column can cover the field the user just tabbed into —
  verify keyboard traversal, not just the mouse path. See §8.
- Below `lg`, the terminal moves **above** the narrative, not below. A user on a
  phone wants the amount before the essay.

The dual progress bar in the terminal is specified in §7 — 10 ETH soft goal
marker, 20 ETH hard cap boundary.

This is a proposal. The current `CampaignDetails.jsx` layout has not been checked
against it — confirm what exists before treating any of the above as a diff.

### Campaign cards

Cover 16:9 · category badge top-right · days-left badge bottom-left over the image
· title max 2 lines · summary max 3 lines · funding stats · footer with backer
count and a link. Grid: 3-up desktop, 2-up tablet, 1-up mobile. Overlapping
backer avatars convey community better than a bare count.

---

## 10. Do / Don't

**Do**

- Read every colour from a custom property
- Check every new component in both themes
- Right-align numerics, align on the decimal point
- Use `tabular-nums` on any figure that can change in place
- Use `outline` for focus rings
- Cap progress percentages
- Show the AI disclaimer next to the claim it qualifies
- Reserve the accent for one primary action per screen
- Squint-test the dark theme for surface separation

**Don't**

- Hardcode a hex value in a component
- Use white text on the brand green
- Use light-mode `#10B981` or `#F59E0B` as a UI or graphic colour — they fail
  3:1 and are on the fix list in §3
- Put money through JavaScript `Number`
- Use `transition: all`
- Use `box-shadow` for focus rings
- Use a width-percentage div as a progress bar
- Use green or red as a card or background fill
- Encode gain/loss by colour alone
- Put the disclaimer in 8px grey footnote type
- Use one border-radius everywhere
- Animate layout properties
- Set the theme class in React on mount without an inline `<head>` guard

---

## 11. Change list

Concrete edits to `frontend/src/index.css` and components, in priority order.

1. **Fix light-theme contrast.** Apply the §3 correction table — five token values
   plus the brand-fill label change in item 2 (`--color-success` appears twice in
   the table, once as a fill and once as text, so it is one token with two
   targets). Highest priority: `--color-success` and `--color-warning` fail the
   3:1 non-text threshold, and both carry risk semantics.
2. **Fix the brand button.** White on `#00D09C` is 2.00:1. Switch the label to
   `#111827`.
3. **Add motion tokens.** `--duration-*` and `--ease-*` per §6, plus the global
   reduced-motion guard.
4. **Add an inline `<head>` script to `index.html` for the theme class.** The
   flash is present: the toggle is in `App.jsx` (`MainLayout`) and writes
   `localStorage['trustbridge_theme']`, but nothing applies the class before
   React hydrates.
5. **Add the radius role tokens** (`--radius-control`, `--radius-surface`,
   `--radius-overlay`) and audit for a single global radius in use everywhere.
6. **Audit every component for hardcoded hex values.** Any found breaks one theme.
7. **Move focus rings from `ring-*` to `outline`.**
8. **Add the money and address formatting utility** — one file, BigInt-safe,
   `Intl.NumberFormat`, tabular figures.
9. **Verify the disclaimer's prominence** on the AI risk page — same size as body
   text or larger, positioned adjacent to the claim.
10. **Swap any width-percentage progress bars for `<progress>`** with
    `aria-valuenow` and `aria-valuemax`, and cap the percentage.
