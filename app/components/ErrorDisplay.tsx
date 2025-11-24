'use client'

interface ErrorDisplayProps {
  error: string | null
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
      {error}
    </div>
  )
}
