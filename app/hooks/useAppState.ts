'use client'

import { useCallback, useState, useEffect } from 'react'
import { ConversationHistory } from '../types'

type AppState = 'idle' | 'listening' | 'processing' | 'speaking'

interface UseAppStateReturn {
  appState: AppState
  displayText: string
  responseText: string
  conversationHistory: ConversationHistory
  audioBlob: Blob | null
  isAudioPlaying: boolean
  setAppState: (state: AppState) => void
  setDisplayText: (text: string) => void
  setResponseText: (text: string) => void
  setConversationHistory: (history: ConversationHistory) => void
  setAudioBlob: (blob: Blob | null) => void
  setIsAudioPlaying: (playing: boolean) => void
  getStatusText: (appState: AppState, displayText: string, responseText: string) => string
}

export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppState>('idle')
  const [displayText, setDisplayText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [conversationHistory, setConversationHistoryState] = useState<ConversationHistory>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // localStorage에서 대화 히스토리 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('conversationHistory')
      if (saved) {
        const parsed = JSON.parse(saved)
        setConversationHistoryState(parsed)
      }
    } catch (err) {
      console.error('대화 히스토리 로드 실패:', err)
    }
    setIsLoaded(true)
  }, [])

  // 대화 히스토리가 변경될 때마다 localStorage에 저장
  const setConversationHistory = useCallback((history: ConversationHistory) => {
    setConversationHistoryState(history)
    try {
      localStorage.setItem('conversationHistory', JSON.stringify(history))
    } catch (err) {
      console.error('대화 히스토리 저장 실패:', err)
    }
  }, [])

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
