'use client'

import { useCallback } from 'react'
import { ConversationHistory } from '../types'

interface UseAudioAPIReturn {
  handleChatAPI: (userMessage: string, conversationHistory: ConversationHistory, setConversationHistory: (history: ConversationHistory) => void) => Promise<string>
  handleTTSAPI: (text: string) => Promise<Blob>
}

export function useAudioAPI(): UseAudioAPIReturn {
  const handleChatAPI = useCallback(
    async (userMessage: string, conversationHistory: ConversationHistory, setConversationHistory: (history: ConversationHistory) => void) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory,
          }),
        })

        if (!response.ok) throw new Error('Chat API 실패')

        const data = await response.json()
        const assistantMessage = data.response

        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: userMessage },
          { role: 'assistant' as const, content: assistantMessage },
        ]
        setConversationHistory(newHistory)

        return assistantMessage
      } catch (err) {
        console.error('Chat error:', err)
        throw err
      }
    },
    [] // setConversationHistory는 파라미터로 받으므로 의존성 배열에 포함 안 함
  )

  const handleTTSAPI = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('TTS API 실패')

      const audioData = await response.blob()
      return audioData
    } catch (err) {
      console.error('TTS error:', err)
      throw err
    }
  }, [])

  return {
    handleChatAPI,
    handleTTSAPI,
  }
}
