---
name: liquid-glass-android-qwea0
description: >-
  Implement real-time dual-pass liquid glassmorphic rendering on Android with downsampled
  RenderNode caching, sensor-driven dynamic highlights, and backwards-compatible fallbacks.
---

# Liquid Glass Android (QWEA0) Skill

## Architectural & Optical Invariants
1. **Dual-Pass Rendering Architecture**:
   - Pass 1: Background canvas captured into a 2x-4x downsampled offscreen `RenderNode` / `HardwareBuffer`.
   - Pass 2: Downsampled buffer processed via Gaussian blur cascade and AGSL refraction distortion shader before blitting to screen.
2. **Device Sensor Driven Highlights**:
   - Listens to `SensorManager.SENSOR_TYPE_ROTATION_VECTOR`.
   - Pitch & Roll smoothed with low-pass filter ($\alpha = 0.15$):
     $\mathbf{v}_{\text{light}} = \alpha \cdot \mathbf{v}_{\text{sensor}} + (1 - \alpha) \cdot \mathbf{v}_{\text{prev}}$.
3. **Multi-API Level Graceful Degradation**:
   - API 33+ (Android 13+): Native AGSL `RenderEffect.createRuntimeShaderEffect()`.
   - API 31-32 (Android 12): `RenderEffect.createBlurEffect()` + PorterDuff highlight overlay.
   - API < 31: FastBlur RenderScript replacement with static acrylic fallback.
4. **Thermal & Frame Rate Throttling**:
   - When device enters thermal throttling (`PowerManager.THERMAL_STATUS_SEVERE`), downsample ratio drops to 0.25x and dynamic refraction drops to 30 FPS cap.

## Dual-Pass View Controller (Kotlin)

```kotlin
class LiquidGlassView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : FrameLayout(context, attrs), SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    private var lightX = 0f
    private var lightY = 0f

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        rotationSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI) }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        sensorManager.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ROTATION_VECTOR) {
            val rotationMatrix = FloatArray(9)
            SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
            // Low-pass filtered tilt
            lightX = lightX * 0.85f + rotationMatrix[1] * 0.15f
            lightY = lightY * 0.85f + rotationMatrix[2] * 0.15f
            invalidate()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
```

## Verification Commands
1. **Lint Check**:
   ```bash
   ./gradlew lint
   ```
2. **Android Benchmark Suite (FPS and GPU profile)**:
   ```bash
   ./gradlew benchmark:connectedCheck
   ```
