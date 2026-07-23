/**
 * Browser Geolocation helpers for location-based habit reminders.
 * Red Team R3 gap: "geofenced reminders" — Productive has it behind Pro.
 *
 * We intentionally avoid storing raw lat/lng on the server for every fix;
 * the watchPosition loop runs client-side and only emits a "you arrived"
 * event when the user crosses into a habit's reminder_location radius.
 */

export interface GeoPoint {
  lat: number
  lng: number
}

export interface ReminderLocation {
  lat: number
  lng: number
  radius_meters: number
  label: string
}

/** Haversine distance between two points, in meters. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000 // Earth radius (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** True if `pos` falls inside the circular geofence defined by `loc`. */
export function isInsideGeofence(pos: GeoPoint, loc: ReminderLocation): boolean {
  return haversineMeters(pos, { lat: loc.lat, lng: loc.lng }) <= loc.radius_meters
}

export function isGeolocationSupported(): boolean {
  return typeof window !== 'undefined' && 'geolocation' in navigator
}

/**
 * Request the user's current position. Wraps navigator.geolocation.getCurrentPosition
 * in a promise so callers can `await` it.
 */
export function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported in this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Geolocation failed')),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

/**
 * Watch the user's position and fire `onArrive(loc)` the first time they
 * enter each `loc`'s geofence during this watch session.
 *
 * Returns a `stop()` function the caller MUST invoke to release the watcher.
 */
export function watchGeofences(
  locs: ReminderLocation[],
  onArrive: (loc: ReminderLocation) => void,
): () => void {
  if (!isGeolocationSupported() || locs.length === 0) return () => undefined

  const fired = new Set<string>()

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const here: GeoPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      for (const loc of locs) {
        const key = `${loc.lat},${loc.lng},${loc.radius_meters}`
        if (fired.has(key)) continue
        if (isInsideGeofence(here, loc)) {
          fired.add(key)
          onArrive(loc)
        }
      }
    },
    () => {
      /* swallow — caller can read Geolocation state separately */
    },
    { enableHighAccuracy: false, timeout: 30_000, maximumAge: 60_000 },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
