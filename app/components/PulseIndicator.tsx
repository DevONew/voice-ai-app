'use client'

import { UI_CONFIG } from '@/app/constants/ui'

interface PulseIndicatorProps {
  isVisible: boolean
  volumeLevel?: number
}

export default function PulseIndicator({ isVisible, volumeLevel = 0 }: PulseIndicatorProps) {
  if (!isVisible) return null

  // 음량에 따라 원 크기 결정 (0-100 → w-1 to w-6)
  const getSize = (volume: number) => {
    const thresholds = UI_CONFIG.VOLUME_THRESHOLDS
    const sizes = UI_CONFIG.VOLUME_SIZE_CLASSES

    for (let i = 0; i < thresholds.length; i++) {
      if (volume < thresholds[i]) return sizes[i]
    }
    return sizes[sizes.length - 1]
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
