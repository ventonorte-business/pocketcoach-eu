'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function PushOptIn() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (!supported) return

    // Register service worker first
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Request notification permission
    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted') {
      // Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      // TODO: Send subscription to backend to store for later push
      console.log('Push subscription:', JSON.stringify(subscription))
    }
  }

  if (!supported || permission === 'denied') return null
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Bell size={14} />
        <span>Notifications on</span>
      </div>
    )
  }

  return (
    <button
      onClick={requestPermission}
      className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 transition-colors px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50"
    >
      <BellOff size={14} />
      <span>Enable reminders</span>
    </button>
  )
}

// Helper: convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
