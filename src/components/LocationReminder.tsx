'use client'

import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getCurrentPosition,
  isGeolocationSupported,
  type ReminderLocation,
} from '@/lib/integrations/geolocation'

interface LocationReminderProps {
  /** Current value (null if not configured). */
  value: ReminderLocation | null
  /** Called with the new reminder-location or null to clear it. */
  onChange: (loc: ReminderLocation | null) => void
}

const DEFAULT_RADIUS_METERS = 150

/**
 * Inline configurator for the geofence attached to a single habit.
 *
 * Flow:
 *   1. user taps "Set reminder location"
 *   2. browser prompts for geolocation permission
 *   3. current lat/lng captured → editable label + radius (default 150m)
 *   4. onSave() emits the final ReminderLocation to the parent (which stores
 *      it in habits.reminder_location via Supabase update)
 *
 * The actual triggering of reminders happens in geolocation.ts →
 * watchGeofences() — this component only manages configuration.
 */
export function LocationReminder({ value, onChange }: LocationReminderProps) {
  const supported = isGeolocationSupported()
  const [label, setLabel] = useState(value?.label ?? '')
  const [radius, setRadius] = useState(value?.radius_meters ?? DEFAULT_RADIUS_METERS)
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // sync local state if parent passes in a fresh value (e.g. server load)
  useEffect(() => {
    if (value) {
      setLabel(value.label)
      setRadius(value.radius_meters)
      setPoint({ lat: value.lat, lng: value.lng })
    }
  }, [value])

  async function captureCurrent() {
    setError(null)
    setBusy(true)
    try {
      const pos = await getCurrentPosition()
      setPoint(pos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
    } finally {
      setBusy(false)
    }
  }

  function save() {
    if (!point) {
      setError('Capture a location first')
      return
    }
    if (!label.trim()) {
      setError('Add a short label (e.g. "Home", "Gym")')
      return
    }
    if (radius < 50 || radius > 5000) {
      setError('Radius must be between 50 and 5000 meters')
      return
    }
    onChange({ lat: point.lat, lng: point.lng, radius_meters: radius, label: label.trim() })
  }

  function clear() {
    setPoint(null)
    setLabel('')
    setRadius(DEFAULT_RADIUS_METERS)
    setError(null)
    onChange(null)
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-500">
        Location reminders need a browser with the Geolocation API.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin size={16} />
          Location reminder
        </span>
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove location reminder"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {point ? (
        <p className="text-xs text-gray-500">
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)} • {radius} m
        </p>
      ) : (
        <button
          type="button"
          onClick={captureCurrent}
          disabled={busy}
          className="self-start text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {busy ? 'Locating…' : 'Use current location'}
        </button>
      )}

      {point && (
        <>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            Label
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Home, Gym, Office…"
              maxLength={40}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-gray-600">
            Radius (m): {radius}
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <button
            type="button"
            onClick={save}
            className="self-start text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Save reminder
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
