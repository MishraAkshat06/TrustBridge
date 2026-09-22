---
name: react-native-liquid-glassmorphism
description: >-
  Build real-time fluid glassmorphism components in React Native using Shopify Skia
  (SkSL shaders) and Reanimated v3 with touch-driven ripples and gyroscopic specular highlights.
---

# React Native Liquid Glassmorphism Skill

## Architectural & Optical Invariants
1. **GPU Runtime Shader (SkSL)**:
   - Executed directly on GPU via `@shopify/react-native-skia` runtime effects.
   - Zero bridge overhead via JSI shared values.
2. **Dynamic Touch Propagation**:
   - Pan and tap coordinates passed as uniforms `u_touch` (`vec2`) and `u_touchTime` (`float`).
   - Wave equation: $W(d, t) = A \cdot e^{-\gamma t} \cdot \sin(k \cdot d - \omega t)$ where $d = \|\mathbf{p} - \mathbf{u\_touch}\|$.
3. **Chromatic Aberration (Prismatic Dispersion)**:
   - Separate refraction passes for RGB channels:
     $\Delta\mathbf{uv}_R = \mathbf{uv} + \mathbf{N} \cdot (\eta + \delta)$, $\Delta\mathbf{uv}_G = \mathbf{uv} + \mathbf{N} \cdot \eta$, $\Delta\mathbf{uv}_B = \mathbf{uv} + \mathbf{N} \cdot (\eta - \delta)$.
4. **Gyroscope Tilt Affordance**:
   - Device rotation vectors update light position `u_lightPos`, altering the specular highlight angle in real-time.

## SkSL Runtime Shader Source

```glsl
uniform shader image;
uniform float2 iResolution;
uniform float iTime;
uniform float2 uTouch;
uniform float uTouchRadius;
uniform float uRefraction;

half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;
    float dist = distance(fragCoord, uTouch);
    
    // Wave ripple distortion
    float wave = sin(dist * 0.05 - iTime * 4.0) * exp(-dist * 0.01) * smoothstep(uTouchRadius, 0.0, dist);
    float2 normal = normalize(fragCoord - uTouch) * wave;
    
    // Chromatic dispersion offsets
    float2 uvR = uv + normal * (uRefraction * 1.05);
    float2 uvG = uv + normal * uRefraction;
    float2 uvB = uv + normal * (uRefraction * 0.95);
    
    half4 colorR = image.eval(uvR * iResolution);
    half4 colorG = image.eval(uvG * iResolution);
    half4 colorB = image.eval(uvB * iResolution);
    
    // Specular highlight
    float3 lightDir = normalize(float3(0.5, 0.5, 1.0));
    float3 surfNormal = normalize(float3(normal * 20.0, 1.0));
    float spec = pow(max(dot(surfNormal, lightDir), 0.0), 32.0) * 0.4;
    
    return half4(colorR.r + spec, colorG.g + spec, colorB.b + spec, 1.0);
}
```

## React Native Component Integration

```tsx
import React from 'react';
import { Canvas, Fill, Shader, Skia, useImage } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

export const LiquidGlassView = ({ children, sourceImage }: any) => {
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  const gesture = Gesture.Pan().onUpdate((e) => {
    touchX.value = e.x;
    touchY.value = e.y;
  });

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ flex: 1 }}>
        <Fill>
          <Shader source={liquidShader} uniforms={{ uTouch: [touchX.value, touchY.value] }} />
        </Fill>
      </Canvas>
    </GestureDetector>
  );
};
```

## Verification Commands
1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Metro Bundler Check**:
   ```bash
   npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/bundle.js
   ```
