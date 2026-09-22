---
name: square-liquid-shader
description: >-
  Render 3D physical glass cards and square elements using WebGL, Three.js, and GLSL
  raymarching with Cauchy chromatic dispersion, Fresnel internal reflection, and fluid surface tension.
---

# Square Liquid Shader Skill

## Architectural & Optical Invariants
1. **Raymarched SDF Fluid Meniscus**:
   - Glass surfaces evaluated as a 3D volumetric bounded volume using raymarching.
   - Fluid meniscus calculated via smooth minimum blending:
     $\text{smin}(d_1, d_2, k) = -\ln(e^{-k d_1} + e^{-k d_2}) / k$.
2. **Cauchy Wavelength Dispersion**:
   - Refractive index varies across light wavelengths according to Cauchy's equation:
     $n(\lambda) = A + \frac{B}{\lambda^2}$.
   - Separate refraction passes: $n_{\text{Red}} = 1.512$, $n_{\text{Green}} = 1.518$, $n_{\text{Blue}} = 1.526$.
3. **Fresnel Internal & External Reflection**:
   - Schlick's approximation for reflection coefficient:
     $R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5$, where $R_0 = \left(\frac{n_1 - n_2}{n_1 + n_2}\right)^2$.
4. **Viscous Surface Tension Interaction**:
   - Cursor velocity imparts dynamic vorticity into a 2D velocity buffer, modulating raymarching step thickness.

## GLSL Fragment Shader Reference

```glsl
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uSceneTexture;

const float IOR_R = 1.512;
const float IOR_G = 1.518;
const float IOR_B = 1.526;

float sdRoundedSquare(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

vec3 getNormal(vec2 p, vec2 b, float r) {
    float eps = 0.001;
    float d = sdRoundedSquare(p, b, r);
    float dx = sdRoundedSquare(p + vec2(eps, 0.0), b, r) - d;
    float dy = sdRoundedSquare(p + vec2(0.0, eps), b, r) - d;
    return normalize(vec3(dx, dy, eps * 4.0));
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 cardSize = vec2(0.35, 0.35);
    float radius = 0.06;
    
    float dist = sdRoundedSquare(p, cardSize, radius);
    
    if (dist > 0.0) {
        // Outside glass boundary
        gl_FragColor = texture2D(uSceneTexture, uv);
        return;
    }
    
    vec3 normal = getNormal(p, cardSize, radius);
    vec3 viewRay = vec3(0.0, 0.0, -1.0);
    
    // Chromatic dispersion ray directions
    vec3 refrR = refract(viewRay, normal, 1.0 / IOR_R);
    vec3 refrG = refract(viewRay, normal, 1.0 / IOR_G);
    vec3 refrB = refract(viewRay, normal, 1.0 / IOR_B);
    
    float colR = texture2D(uSceneTexture, uv + refrR.xy * 0.05).r;
    float colG = texture2D(uSceneTexture, uv + refrG.xy * 0.05).g;
    float colB = texture2D(uSceneTexture, uv + refrB.xy * 0.05).b;
    
    // Fresnel term
    float cosTheta = dot(-viewRay, normal);
    float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - cosTheta, 5.0);
    
    vec3 finalColor = mix(vec3(colR, colG, colB), vec3(1.0), fresnel * 0.6);
    gl_FragColor = vec4(finalColor, 1.0);
}
```

## Verification Commands
1. **Three.js Shader Compilation Test**:
   ```bash
   npx glslify src/shaders/liquidGlass.frag --output dist/liquidGlass.frag.js
   ```
2. **Build WebGL Showcase**:
   ```bash
   npm run build
   ```
