---
name: liquid-glass-react
description: >-
  Deliver zero-dependency and WebGL-accelerated liquid glass React components
  with SVG displacement filters, responsive physics hooks, and WCAG accessibility conformance.
---

# Liquid Glass React Skill

## Architectural & Optical Invariants
1. **Zero-Dependency SVG Filter Mode**:
   - Uses native `<feDisplacementMap>` + `<feGaussianBlur>` embedded directly in SVG DOM.
   - Requires 0KB external libraries; executes directly on Chromium / Gecko / WebKit hardware composition layers.
2. **Physics-Driven Mouse Spring Reaction**:
   - Mouse hover updates liquid deformation vector using second-order spring dynamics:
     $F = -k \cdot x - c \cdot v$.
3. **WCAG 2.2 AA Conformance Rules**:
   - Contrast ratio $\ge 4.5:1$ for normal text, $\ge 3.0:1$ for large headings.
   - When `@media (prefers-reduced-motion: reduce)` matches:
     - Disables dynamic displacement animation.
     - Freezes refraction to static baseline blur (`16px`).
     - Eliminates gyroscopic/cursor tilt tracking.
4. **Encapsulated React Hook API**:
   - `useLiquidGlass(options)` returns computed style object, SVG filter JSX, and mouse interaction listeners.

## React Hook & Component Implementation

```tsx
import React, { FC, ReactNode, useState, useCallback } from 'react';

interface LiquidGlassProps {
  children: ReactNode;
  distortionScale?: number;
  blur?: number;
  className?: string;
}

export const LiquidGlass: FC<LiquidGlassProps> = ({
  children,
  distortionScale = 20,
  blur = 16,
  className = '',
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/20 p-8 ${className}`}
      style={{
        backdropFilter: `blur(${blur}px) saturate(160%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
        background: `radial-gradient(circle at ${coords.x}% ${coords.y}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 70%)`,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)',
      }}
    >
      {/* Dynamic Specular Edge */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/30 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
```

## Verification Commands
1. **TypeScript Build & Check**:
   ```bash
   npm run build
   ```
2. **Accessibility & Axe Scan**:
   ```bash
   npx axe-core-cli http://localhost:3000
   ```
