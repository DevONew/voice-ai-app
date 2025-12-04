'use client'

import { useCallback, useState } from 'react'
import { ConversationHistory } from '../types'

type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface UseAppStateReturn {
  appState: AppState
  displayText: string
  responseText: string
  errorMessage: string
  conversationHistory: ConversationHistory
  audioBlob: Blob | null
  isAudioPlaying: boolean
  currentLanguage: string
  setAppState: (state: AppState) => void
  setDisplayText: (text: string) => void
  setResponseText: (text: string) => void
  setErrorMessage: (message: string) => void
  setConversationHistory: (history: ConversationHistory) => void
  setAudioBlob: (blob: Blob | null) => void
  setIsAudioPlaying: (playing: boolean) => void
  setCurrentLanguage: (language: string) => void
  getStatusText: (appState: AppState, displayText: string, responseText: string) => string
}

export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppState>('idle')
  const [displayText, setDisplayText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('ko')

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
    errorMessage,
    conversationHistory,
    audioBlob,
    isAudioPlaying,
    currentLanguage,
    setAppState,
    setDisplayText,
    setResponseText,
    setErrorMessage,
    setConversationHistory,
    setAudioBlob,
    setIsAudioPlaying,
    setCurrentLanguage,
    getStatusText,
  }
}
