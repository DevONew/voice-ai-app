'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
}

export default function ChatMessage({ role, content, isTyping = false }: ChatMessageProps) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs bg-gray-200 rounded-lg px-4 py-2">
          <p className="text-sm sm:text-base text-gray-800 break-words">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs">
        <p className="text-sm sm:text-base text-black leading-relaxed break-words">
          {content}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>
    </div>
  )
}
