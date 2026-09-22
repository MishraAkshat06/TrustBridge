---
name: trustbridge-ui
description: Design and UI rules for the TrustBridge frontend (React 19 + Vite + Tailwind v4). Use this whenever you touch anything visual under `frontend/` — any page, component, stylesheet, theme, token, colour, spacing, typography, motion, icon or layout change. Also use it when asked to make the UI look better, more modern, more polished or more professional; when told a page looks cheap, amateur, AI-generated, unfinished or "like a scam"; when reviewing, auditing or screenshotting a page; and when adding a new page, card, chart, table, modal or loading/empty/error state. Carries the dual-theme token system, the ornament patterns that make a crowdfunding product read as untrustworthy, financial-data display correctness, and the render-and-verify loop.
---

# TrustBridge UI

## The idea this skill exists to protect

TrustBridge asks strangers to send ETH to a smart contract on the strength of a
web page. That is, by a wide margin, the most fraud-associated thing a website
can ask for. Every visitor arrives with the prior that this is a scam, and the
page has to argue its way out of that prior using nothing but what it shows.

The visual language of fraud is well known to everyone, including your audience,
and it is *decorative*: glassy panels, glowing buttons, gradient washes, floating
shapes, animated shine, big confident numbers with nothing behind them. The
visual language of a bank, an escrow service, or an audit ledger is *plain*:
dense real figures, visible timestamps, precise alignment, restrained colour, and
honest statements about what is and isn't verified.

So the organising principle here is not "make it beautiful" — it's:

> **Credibility is built by subtraction.** Every decorative effect is a
> withdrawal from a trust account you cannot see the balance of.

This is also why the usual advice ("be distinctive, take aesthetic risk") does
not apply cleanly here. TrustBridge's visual identity is *already decided* —
Groww-style mint light mode, Binance-style gold dark mode, tokens in
`frontend/src/index.css`. Your job is disciplined execution inside that system,
not reinvention of it. Inventing a new palette or a new card treatment is a bug,
not a contribution.

---

## Read the source of truth first

| What | Where |
|---|---|
| Design tokens (the real values) | `frontend/src/index.css` — `:root` and `.dark` blocks |
| The binding frontend rules | `docs/skills/rules.md` §6 |
| Full design spec: contrast audit, spacing, motion, Do/Don't | `docs/skills/design.md` |
| What's actually wrong right now | `references/audit-2026-09-21.md` in this skill |

`docs/` is **read-only**. Read it, never write to it.

Read `index.css` before writing any style. It is 374 lines and it is the only
authority on what a token is called.

### Verify the docs against the source

`docs/skills/design.md` and `memory.md` are useful but were written earlier and
have drifted. Known-stale as of 2026-09-21:

- `design.md` §11 item 4 ("add an inline `<head>` theme script") — **already
  done** in `frontend/index.html`.
- `memory.md` trap 10 ("the frontend simulates the chain") — **no longer true**.
  `AppContext.jsx` now uses real `ethers` receipts (`receipt.hash`,
  `receipt.blockNumber`).
- `memory.md` trap 11 ("`api.js` fabricates payloads when the backend is down")
  — **no longer true**. `api.js` returns `null` or throws.

The lesson generalises: when a doc and the source disagree, the source is right.
Confirm before repeating a claim from the docs.

---

## Themes: the rule that must never break

Two themes, both must work, for every component, always.

- **Light** — Groww. Warm off-white canvas, mint accent.
- **Dark** — Binance Pro. Near-black canvas, gold accent.

**Never write a hex literal in a component.** Read from the token:

```jsx
// wrong — breaks in the other theme, and drifts from the palette
<div className="bg-[#FAF9F6] text-[#111827] border-[#E2E8F0]">

// right — switches itself
<div className="bg-[var(--bg-canvas)] text-[var(--text-primary)] border-[var(--border-subtle)]">
```

Use Tailwind's arbitrary-value syntax with `var(...)`. Where the same token is
used a lot, add a named class in `index.css` the way `.bg-card-bg` and
`.text-text-main` already are.

**Never branch on the theme in JavaScript to pick a colour.** `isDarkMode ? '#06080D' : '#FAF9F6'` is the same bug wearing a disguise: it duplicates the
palette into the component, so the two copies drift and the dark value is
invisible to anyone editing the CSS. If a colour needs to differ per theme, that
is a token — put it in both blocks of `index.css`.

**Adding a token means adding it to `:root` *and* `.dark`.** A token in one block
only is an invisible failure in the other theme.

### Token names, by role

Values live in `index.css`; these are the names you reach for.

- Surface: `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-elevated`
- Line: `--border-subtle`, `--border-strong`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Accent: `--accent-brand`, `--accent-brand-hover`, `--accent-brand-subtle`, `--accent-brand-text`
- State: `--color-success`, `--color-danger`, `--color-warning`
- Shell: `--header-bg`, `--sidebar-bg`

**Reserve `--accent-brand` for one primary action per screen.** If everything is
mint, nothing is.

Tailwind v4 is configured CSS-first — there is **no `tailwind.config.js`** and
you should not create one. New tokens are custom properties, not config entries.

---

## Banned ornament, and the reason for each ban

Each row is a pattern that currently exists in this codebase and that reads as
cheap to a visitor. The "instead" column is the point — this is not a list of
things to remove and leave blank.

| Pattern | Why it reads as fraud | Instead |
|---|---|---|
| Floating blurred circles / orbs / rings behind the hero | Universally used by template crypto sites; carries no information | Let the funding figure and the contract address be the hero. If the page needs depth, use a surface colour |
| `animate-pulse` or any infinite idle animation | Motion that nothing triggered reads as "live activity", which is the con | Motion only in response to a user action or a real state change |
| Glow shadows (`shadow-[0_0_20px_rgba(...)]`) on buttons and cards | Neon glow is the single strongest scam marker in fintech | A plain border and a surface change on hover |
| Gradient fills on buttons, and gradient washes on sections | Depth by gradient is decoration; real depth is surface elevation | `--accent-brand` fill, one radius, no glow |
| `backdrop-filter` glass on ordinary cards | Blur is expensive and implies transparency that means nothing | Opaque `--bg-surface`, one elevation step |
| 3D tilt / `translateZ` layers / mouse-tracking spotlight | Suggests the interface is a toy; also breaks on touch and hurts readability | Flat card, clear border, generous padding |
| Conic-gradient "holographic" sheen, `mix-blend-mode: color-dodge` | Reads as a casino or an NFT mint | Delete it |
| Colouring individual words inside a headline | The commonest tell of a generated page; it accents without meaning | One colour for the whole headline. Accent a whole line, or nothing |
| `transition: all` | Animates properties you didn't intend and can thrash layout | Name the properties: `transition-colors`, or explicit `transition-[border-color,box-shadow]` |
| Arbitrary display sizes and `font-extrabold` (`text-[54px]`) | Arbitrary values drift page to page, so no two pages look related | One type ramp, applied everywhere — see `design.md` §5 |
| Pill radius (`rounded-full`) on rectangular controls | "One border-radius on everything" erases hierarchy | Radius named by role: control / surface / overlay |
| A pulsing coloured dot labelled "live" | Claims activity that may not exist | Only if it reflects a real, checked connection state |

**Radius is a hierarchy signal, not a constant.** A control, a card, and an
overlay should not share a radius. `design.md` §5 names them by role.

When you feel the urge to add one of the above, the honest question is: *what
information does this convey?* If the answer is "it makes it look more modern",
that is the tell.

---

## Trust signals: what to do instead

These are the things that actually move the needle, because they are what a
sceptical visitor is scanning for.

**Show real provenance, or show nothing.** Every financial figure should be
traceable to something the visitor can check: a transaction hash that resolves on
Sepolia Etherscan, a block number, a timestamp, a source. If a number cannot be
traced, either label it unmistakably as sample data or remove it. Never render an
invented hash, score, or activity row as though it were observed.

**Never invent data to fill a gap.** An empty state that says "No contributions
yet" is trustworthy. A fabricated contribution list is not, and it is the exact
behaviour the audience is afraid of. When a backend call fails, show the failure.

**Be honest about the AI layer.** Every ML or agentic output carries the
disclaimer: `"This is an AI-generated advisory assessment and not a financial
verdict."` It goes adjacent to the claim it qualifies, at body size or larger —
not as 8px grey footnote type.

**Money never goes through a JS `Number`.** ETH amounts are `BigInt` until the
moment of display. Use `formatEther` / `formatUnits` from ethers v6, then format
with `Intl.NumberFormat`. `Number(x).toFixed(4)` on a wei value silently loses
precision, and on a page about money that is a correctness bug, not a style one.

**Numerals get treated like data.** Right-align them, align on the decimal point,
and put `tabular-nums` on anything that can change in place — otherwise figures
jitter as they update and the page looks unstable. Cap progress percentages at
100.

**Encode gain and loss by more than colour.** Green and red alone exclude
colour-blind readers and are the palette of a trading casino. Pair with a sign, an
arrow, or a label.

**Copy is design material.** Sentence case. No exclamation marks in financial
confirmations — "Confirmed in block 11746166." not "Confirmed in block
11746166!". Name the action in the button and keep that name through the whole
flow: the button that says "Back campaign" produces "Backed". Errors state what
happened and what to do, without apologising or being vague. An empty screen is
an invitation to act, not a mood.

**Every data-bearing view needs four states**, and most currently lack them:
loading, error, empty, and — where relevant — wallet-not-connected. A view that
only renders the happy path looks unfinished the moment anything goes wrong, and
in a demo something always does.

---

## Workflow: audit, render, fix, verify

Do not do this from source alone. A contrast failure, a spacing break, or a
misaligned numeral is invisible in the code and obvious in the render.

### 1. Audit before editing

Read the page and name what is wrong in the vocabulary above. Check it against
`references/audit-2026-09-21.md` for known offenders. Decide the *one* element on
the screen that should carry the emphasis, and make everything else quiet. Write
that decision down before you write code — it is the thing that stops the page
drifting back toward decoration.

### 2. Render it

```bash
cd frontend && npm run dev     # Vite on http://localhost:5173, /api proxied to :5000
```

**There is no router.** `App.jsx` holds `currentView` in state and mounts one
view at a time, so no page has a URL and you cannot navigate by address. To reach
a specific view, either click through the nav, or temporarily change the initial
`currentView` value in `App.jsx` — then revert it. Do not leave that edit in.

Capture each page you touched with the Chrome DevTools tools, in **both themes**
(toggle writes `localStorage['trustbridge_theme']`), and at **375px wide** as well
as desktop. Look at the screenshots before you claim anything works. Zoom in on
the numbers — that is where the mistakes are.

If the backend is not running, say so and treat every ML/AI panel as unavailable
rather than judging its styling around placeholder content.

### 3. Fix in this order

1. Correctness first — money formatting, fabricated data, missing states,
   inaccessible contrast. A beautiful page showing a wrong number is worse than
   an ugly one showing a right one.
2. Then the theme contract — every hardcoded hex replaced with a token, verified
   in both themes.
3. Then typography and spacing — one ramp, one rhythm, applied from the shared
   scale rather than per-page arbitrary values.
4. Then remove ornament — work down the banned table above.
5. Only then, if something still needs emphasis, add it deliberately in one
   place.

### 4. Verify, don't assume

Re-render and re-screenshot both themes. Specifically check:

- Every colour resolves from a token — grep the diff for `#` and `rgba(`.
- Text contrast: 4.5:1 for body, 3:1 for large text and UI boundaries. Note that
  white on the light-mode brand green is currently **2.00:1** and must not be used
  for a label.
- Focus is visible by keyboard on every interactive element, via `outline` — not
  `ring-*`, and not `box-shadow`.
- `prefers-reduced-motion` is respected globally.
- Money values survive a very large and a very small amount.
- Nothing overlaps or clips at 375px.

Then say what you actually verified, and what you did not. Do not describe a page
as fixed because the source looks right.

---

## Scope

`frontend/` only. This skill has nothing to say about the contract, the backend,
the ML models, or the agent layer — for those, read `docs/skills/rules.md`.

Stack is fixed: React 19 + Vite 8, Tailwind v4 (CSS-first, no config file),
`lucide-react` for icons, Ethers.js v6. **Banned:** Next.js, Redux, Web3.js.
Anything outside the approved package list in `rules.md` §1 gets asked about, not
installed.
