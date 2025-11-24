'use client'

interface PulseIndicatorProps {
  isVisible: boolean
}

export default function PulseIndicator({ isVisible }: PulseIndicatorProps) {
  if (!isVisible) return null

  return (
    <div className="pb-6">
      <div className="flex gap-1 justify-center">
        <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" />
        <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
        <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  )
}
