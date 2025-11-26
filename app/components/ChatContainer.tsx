'use client'

import ChatMessage from './ChatMessage'

interface ChatContainerProps {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  isVisible: boolean
}

export default function ChatContainer({ messages, isVisible }: ChatContainerProps) {
  if (!isVisible || messages.length === 0) return null

  return (
    <div className="absolute inset-0 bg-white flex flex-col p-4 overflow-hidden animate-fadeIn">
      {/* 상단: 메시지 영역 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
      </div>

      {/* 하단: 추가 정보 */}
      <div className="text-center text-xs sm:text-sm text-gray-500">
        AI 응답 중...
      </div>
    </div>
  )
}
