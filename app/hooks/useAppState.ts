'use client'

import { useCallback, useState } from 'react'

type AppState = 'idle' | 'listening' | 'processing' | 'speaking'

interface UseAppStateReturn {
  appState: AppState
  displayText: string
  responseText: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  audioBlob: Blob | null
  isAudioPlaying: boolean
  setAppState: (state: AppState) => void
  setDisplayText: (text: string) => void
  setResponseText: (text: string) => void
  setConversationHistory: (history: Array<{ role: 'user' | 'assistant'; content: string }>) => void
  setAudioBlob: (blob: Blob | null) => void
  setIsAudioPlaying: (playing: boolean) => void
  getStatusText: (appState: AppState, displayText: string, responseText: string) => string
}

export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppState>('idle')
  const [displayText, setDisplayText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  const getStatusText = useCallback((state: AppState, displayTxt: string, responseTxt: string): string => {
    switch (state) {
      case 'idle':
        return '탭하여 시작'
      case 'listening':
        return displayTxt ? '' : '듣는 중...'
      case 'processing':
        return '생각하는 중...'
      case 'speaking':
        return responseTxt
      default:
        return '탭하여 시작'
    }
  }, [])

  return {
    appState,
    displayText,
    responseText,
    conversationHistory,
    audioBlob,
    isAudioPlaying,
    setAppState,
    setDisplayText,
    setResponseText,
    setConversationHistory,
    setAudioBlob,
    setIsAudioPlaying,
    getStatusText,
  }
}
