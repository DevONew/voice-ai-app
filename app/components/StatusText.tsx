'use client'

interface StatusTextProps {
  text: string
  isActive: boolean
}

export default function StatusText({ text, isActive }: StatusTextProps) {
  return (
    <p
      className={`text-center transition-all duration-300 ${
        isActive ? 'text-lg sm:text-lg md:text-2xl font-black text-black animate-fadeIn' : 'text-base sm:text-base md:text-xl font-black text-gray-600'
      }`}
    >
      {text}
    </p>
  )
}
