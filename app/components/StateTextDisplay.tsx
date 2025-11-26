'use client'

interface StateTextDisplayProps {
  text: string
}

export default function StateTextDisplay({ text }: StateTextDisplayProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-h-[50vh] overflow-y-auto px-[20px]">
        <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500 text-center leading-8 break-words whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  )
}
