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
  const size = isBottom ? 80 : 200
  const radius = size / 2

  return (
    <button
      onClick={onClick}
      className="focus:outline-none z-10 cursor-pointer border-0 bg-transparent p-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `scale(${isAnimating ? scale : 1})`,
        transition: isAnimating ? 'transform 0.1s ease-out' : 'transform 0.2s ease-in-out',
        border: 'none',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="마이크 버튼"
      type="button"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          <radialGradient id="buttonGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="70%" stopColor="#333333" />
            <stop offset="100%" stopColor="#666666" />
          </radialGradient>
        </defs>
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill={isListening ? 'url(#buttonGradient)' : '#000000'}
          style={{
            transition: 'fill 0.3s ease-in-out',
          }}
        />
      </svg>
      {children}
    </button>
  )
}
