/**
 * Health/Fitness integration via Web APIs.
 * Red Team R1 gap: "Apple Health / Google Fit integration"
 *
 * Since PWAs can't access Apple HealthKit directly, we use:
 * 1. Pedometer API (step counting via device sensors) — Chrome Android 88+
 * 2. Web Bluetooth for fitness trackers (future)
 * 3. Manual input fallback
 *
 * For native iOS/Android integration, Capacitor Health plugin would be needed.
 */

export interface StepCount {
  steps: number
  date: string
  source: 'sensor' | 'manual'
}

/**
 * Check if Sensor APIs are available for step counting.
 * Uses the generic Sensor API (Accelerometer as proxy).
 */
export function isStepCountingSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Accelerometer' in window || 'LinearAccelerationSensor' in window
}

/**
 * Request permission to use motion sensors.
 * Required on iOS Safari 13+ and some Android browsers.
 */
export async function requestMotionPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // iOS DeviceMotion permission
  if (
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
  ) {
    const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
    return permission === 'granted'
  }

  // Android — no explicit permission needed for Accelerometer
  return true
}

/**
 * Simple step counter using accelerometer threshold detection.
 * This is a basic implementation — for production, consider:
 * - Pedometer.js library
 * - Background sync via Service Worker
 * - Native bridge via Capacitor
 */
export class SimpleStepCounter {
  private steps = 0
  private lastMagnitude = 0
  private threshold = 12 // m/s² — typical step acceleration peak
  private cooldown = false
  private listener: ((steps: number) => void) | null = null
  private handler: ((event: DeviceMotionEvent) => void) | null = null

  start(onStep: (totalSteps: number) => void) {
    this.listener = onStep
    this.handler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return

      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)

      if (magnitude > this.threshold && this.lastMagnitude <= this.threshold && !this.cooldown) {
        this.steps++
        this.cooldown = true
        setTimeout(() => { this.cooldown = false }, 300) // 300ms between steps
        this.listener?.(this.steps)
      }

      this.lastMagnitude = magnitude
    }

    window.addEventListener('devicemotion', this.handler)
  }

  stop(): number {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler)
      this.handler = null
    }
    return this.steps
  }

  getSteps(): number {
    return this.steps
  }

  reset() {
    this.steps = 0
  }
}
