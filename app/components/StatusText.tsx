'use client'

interface StatusTextProps {
  text: string
  isActive: boolean
}

export default function StatusText({ text, isActive }: StatusTextProps) {
  return (
    <p
      className={`text-center transition-all duration-300 ${
        isActive ? 'text-lg font-black text-black animate-fadeIn' : 'text-base font-bold text-gray-600'
      }`}
    >
      {text}
    </p>
  )
}
