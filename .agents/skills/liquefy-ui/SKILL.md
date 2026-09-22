---
name: liquefy-ui
description: >-
  Implement physical liquid glassmorphism UI components in React and Tailwind CSS
  using SVG displacement filters, CSS backdrop-filter fallbacks, Snell refraction,
  and dynamic specular edge sheen.
---

# Liquefy UI Skill

## Architectural & Optical Invariants
1. **Physical Snell Refraction Approximation**:
   - Liquid distortion follows Snell's Law ($n_1 \sin\theta_1 = n_2 \sin\theta_2$).
   - Standard glass refractive index $\eta = 1.52$; fluid boundary index $\eta = 1.33$.
   - UV displacement vector $\Delta\mathbf{uv} = \mathbf{N}_{xy} \cdot \left(1 - \frac{1}{\eta}\right) \cdot d_{\text{depth}}$.
2. **Dual-Layer Glass Composition**:
   - Layer 1 (Backdrop Refraction): `backdrop-filter: blur(20px) saturate(180%) contrast(90%)`.
   - Layer 2 (Specular Highlight & Bevel): Multi-stop linear gradient simulating ambient light reflection:
     `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.15) 100%)`.
3. **SVG Displacement Turbulence**:
   - Chained `<feTurbulence>` with `<feDisplacementMap>` to simulate fluid surface tension and micro-ripples.
   - Base frequency: `0.015 - 0.035` for viscous liquid, scale: `10 - 25`.
4. **Accessibility & Contrast Floor**:
   - Minimum 4.5:1 text contrast ratio against underlying blurred content.
   - Auto-downgrade to high-contrast solid frosted backdrop on `@media (prefers-reduced-motion: reduce)` or `@media (forced-colors: active)`.

## Component Reference Implementation

```tsx
import React, { FC, ReactNode } from 'react';

interface LiquidGlassCardProps {
  children: ReactNode;
  blur?: number; // default: 20
  refraction?: number; // default: 15
  className?: string;
}

export const LiquidGlassCard: FC<LiquidGlassCardProps> = ({
  children,
  blur = 20,
  refraction = 15,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/20 p-6 ${className}`}>
      {/* SVG Displacement Filter for Fluid Refraction */}
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-30" aria-hidden="true">
        <filter id="liquid-refraction">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={refraction} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Optical Backdrop & Specular Sheen */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 backdrop-blur-xl transition-all duration-300"
        style={{
          backdropFilter: `blur(${blur}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 20px 40px -15px rgba(0, 0, 0, 0.3)',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
```

## Verification Commands
1. **Lint & Type Check**:
   ```bash
   npm run lint
   tsc --noEmit
   ```
2. **Contrast & A11y Audit**:
   ```bash
   npx axe-core-cli http://localhost:5173 --rules color-contrast
   ```
