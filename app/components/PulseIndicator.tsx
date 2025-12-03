'use client'

interface PulseIndicatorProps {
  isVisible: boolean
  volumeLevel?: number
}

export default function PulseIndicator({ isVisible, volumeLevel = 0 }: PulseIndicatorProps) {
  if (!isVisible) return null

  // 음량에 따라 원 크기 결정 (0-100 → w-1 to w-6)
  const getSize = (volume: number) => {
    if (volume < 15) return 'w-1 h-1'
    if (volume < 30) return 'w-2 h-2'
    if (volume < 45) return 'w-3 h-3'
    if (volume < 60) return 'w-4 h-4'
    if (volume < 75) return 'w-5 h-5'
    return 'w-6 h-6'
  }

  const sizeClass = getSize(volumeLevel)

  return (
    <div className="pb-6">
      <div className="flex gap-1 justify-center">
        <div className={`${sizeClass} rounded-full bg-gray-400 animate-pulse transition-all duration-100`} />
        <div className={`${sizeClass} rounded-full bg-gray-400 animate-pulse transition-all duration-100`} style={{ animationDelay: '0.1s' }} />
        <div className={`${sizeClass} rounded-full bg-gray-400 animate-pulse transition-all duration-100`} style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  )
}
