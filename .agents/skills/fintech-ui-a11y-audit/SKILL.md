---
name: fintech-ui-a11y-audit
description: >-
  Enforce dual-theme styling (Groww Light default / Binance Pro Dark), WCAG 2.2 AA
  color contrast ratios, tabular numerals, 4-state Web3 modals, and accessibility
  focus traps in React components.
---

# FinTech UI/UX & Accessibility Skill

## Design Invariants
1. **Zero Hardcoded Hexes**: All colors MUST read from CSS variables defined in `src/index.css` (`--bg-canvas`, `--bg-surface`, `--accent-brand`, `--text-primary`).
2. **Dual-Theme Fidelity**:
   - **Groww Light**: `#FAF9F6` canvas, `#00D09C` emerald accent, dark labels on brand fill (8.88:1 AAA ratio).
   - **Binance Dark**: `#0B0E11` canvas, `#181A20` surface, `#F0B90B` gold accent.
3. **Typography & Monospace**:
   - Tabular numerals (`font-mono font-variant-numeric: tabular-nums`) mandatory for all ETH balances, wallet addresses, block numbers, and percentages.
4. **WCAG 2.2 Contrast Standards**:
   - Body text: >= 4.5:1 ratio against surface.
   - Interactive controls / UI borders: >= 3.0:1 ratio.
   - Focus rings: `outline: 2px solid var(--focus-ring)` with `outline-offset: 2px`. Never use `box-shadow` or `ring-*` (fails Windows High Contrast).

## Verification Commands
1. **Build Verification**:
   ```bash
   cd frontend && npm run build
   ```
2. **A11y Automated Audit**:
   ```bash
   npx axe-core-cli http://localhost:5173
   ```
