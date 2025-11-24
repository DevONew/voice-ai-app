'use client'

interface ResponseDisplayProps {
  text: string
  isVisible: boolean
}

export default function ResponseDisplay({ text, isVisible }: ResponseDisplayProps) {
  if (!isVisible) return null

  return (
    <div className="w-full max-w-xs animate-fadeIn">
      <p className="text-center text-lg text-black leading-relaxed break-words font-bold">{text}</p>
    </div>
  )
}
