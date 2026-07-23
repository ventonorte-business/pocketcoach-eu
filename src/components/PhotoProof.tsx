'use client'

import { Camera, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface PhotoProofProps {
  /** Called with the public URL once the photo has been uploaded to Supabase. */
  onUploaded: (publicUrl: string) => void
  /** Called when the user clears/removes the attached photo. */
  onCleared?: () => void
  /** User ID — used to namespace the storage path. */
  userId: string
  /** Habit ID — included in the storage path for per-habit organization. */
  habitId: string
}

/**
 * Optional photo proof capture for habit completion.
 *
 * Backed by:
 *  - <input type="file" accept="image/*" capture="environment"> (rear camera on mobile)
 *  - Supabase Storage bucket "proofs" (see 20260722400001_photo_proofs.sql)
 *  - public.completions.proof_url column
 *
 * The component is intentionally controlled-light: parent just receives the
 * uploaded URL so the completion insert can store it in proof_url.
 */
export function PhotoProof({ onUploaded, onCleared, userId, habitId }: PhotoProofProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      // Local preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Lazy-import the browser client so this component remains isomorphic-testable
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${userId}/${habitId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // Bucket is private — use a signed URL valid for 1 year.
      const { data: signedData, error: signedError } = await supabase.storage
        .from('proofs')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365)

      if (signedError || !signedData?.signedUrl) throw signedError ?? new Error('No signed URL')

      onUploaded(signedData.signedUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    onCleared?.()
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden file input — capture="environment" requests rear camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          // Reset so selecting the same file again still triggers change
          e.target.value = ''
        }}
      />

      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Habit proof preview"
            className="w-24 h-24 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove proof photo"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          aria-label="Attach photo proof"
        >
          <Camera size={16} />
          {uploading ? 'Uploading…' : 'Add photo proof'}
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
