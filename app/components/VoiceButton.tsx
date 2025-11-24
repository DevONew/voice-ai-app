'use client'

import { ReactNode } from 'react'

interface VoiceButtonProps {
  isAnimating: boolean
  scale: number
  isListening: boolean
  isBottom?: boolean
  onClick: () => void
  children?: ReactNode
}

export default function VoiceButton({
  isAnimating,
  scale,
  isListening,
  isBottom = false,
  onClick,
  children,
}: VoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-full shadow-2xl focus:outline-none z-10 active:scale-95 cursor-pointer border-0"
      style={{
        width: isBottom ? '80px' : '200px',
        height: isBottom ? '80px' : '200px',
        background: isListening ? 'radial-gradient(circle, #000000 0%, #999999 100%)' : '#000000',
        transform: `scale(${isAnimating ? scale : 1})`,
        transition: isAnimating ? 'transform 0.1s ease-out' : 'transform 0.2s ease-in-out, background 0.3s ease-in-out',
        border: 'none',
        outline: 'none',
      }}
      aria-label="마이크 버튼"
      type="button"
    >
      {children}
    </button>
  )
}
