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
    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [text, isVisible])

  if (!isVisible) return null

  return (
    <div className={`w-full ${isAnimating ? 'animate-slideUp' : ''}`}>
      <p className="text-center text-xl sm:text-xl md:text-2xl text-black leading-8 break-words font-black whitespace-pre-wrap">
        {displayedText}
      </p>
    </div>
  )
}
