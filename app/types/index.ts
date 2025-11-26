/**
 * 채팅 관련 타입 정의
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type ConversationHistory = ChatMessage[]
