'use client'

import { useEffect, useState } from 'react'

interface ResponseDisplayProps {
  text: string
  isVisible: boolean
}

export default function ResponseDisplay({ text, isVisible }: ResponseDisplayProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText('')
      return
    }

    setIsAnimating(true)
    setDisplayedText(text)
  }, [text, isVisible])

  if (!isVisible) return null

  return (
    <div className={`w-full px-4 ${isAnimating ? 'animate-slideUp' : ''}`}>
      <p className="text-center text-xl sm:text-xl md:text-2xl text-black leading-relaxed break-words font-black whitespace-normal">
        {displayedText}
      </p>
    </div>
  )
}
