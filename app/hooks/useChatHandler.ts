'use client'

import { useCallback, useRef, useEffect } from 'react'
import { ConversationHistory } from '../types'
import { useAudioAPI } from './useAudioAPI'
import { detectLanguage } from '../utils/language-detector'
import { AUDIO_CONFIG } from '@/app/constants/audio'

interface UseChatHandlerProps {
  conversationHistory: ConversationHistory
  onResponseReceived: (response: string) => void
  onStateChange: (state: 'processing' | 'speaking') => void
  onLanguageDetected: (language: string) => void
  onError: () => void
  onAudioGenerated: (audioBlob: Blob) => void
  onPlayStart: () => void
}

/**
 * Chat API 호출, 언어 감지, TTS 처리를 담당하는 커스텀 훅
 */
export function useChatHandler({
  conversationHistory,
  onResponseReceived,
  onStateChange,
  onLanguageDetected,
  onError,
  onAudioGenerated,
  onPlayStart,
}: UseChatHandlerProps) {
  const { handleChatAPI, handleTTSAPI } = useAudioAPI()
  const conversationHistoryRef = useRef(conversationHistory)

  // conversationHistory 변경될 때마다 ref 업데이트
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory
  }, [conversationHistory])


  const handleFinalTranscript = useCallback(
    (finalText: string) => {
      console.log('📤 백그라운드에서 Chat API 호출:', finalText)
      console.log('📋 현재 conversationHistory:', conversationHistoryRef.current)

      // 사용자 입력에서 언어 감지
      const detectedLanguage = detectLanguage(finalText)
      if (detectedLanguage) {
        console.log(`🌐 언어 감지: ${finalText} → ${detectedLanguage}`)
        onLanguageDetected(detectedLanguage)
      }

      // Promise로 호출 (기다리지 않음)
      handleChatAPI(finalText, conversationHistoryRef.current, (newHistory) => {
        // conversationHistory 즉시 업데이트 (ref에 먼저 저장)
        conversationHistoryRef.current = newHistory
      })
        .then(async (aiResponse) => {
          console.log('✅ Chat API 응답 (백그라운드):', aiResponse)
          onResponseReceived(aiResponse)

          // 전체 텍스트를 1번 TTS 처리 (API 비용 절감)
          try {
            console.log('🎵 TTS 처리 시작 (전체 텍스트)')

            const audioBlob = await handleTTSAPI(aiResponse)
            console.log('✅ TTS 처리 완료')

            // TTS 완료 후 재생 시작
            setTimeout(() => {
              console.log('🎯 상태 변경: processing → speaking')
              onStateChange('speaking')
              onAudioGenerated(audioBlob)
              onPlayStart()
            }, AUDIO_CONFIG.TTS_DELAY)
          } catch (ttsErr) {
            console.error('❌ TTS 에러:', ttsErr)
            onError()
          }
        })
        .catch((err) => {
          console.error('❌ Chat API 에러 (백그라운드):', err)
          onError()
        })
    },
    [handleChatAPI, handleTTSAPI, onResponseReceived, onStateChange, onLanguageDetected, onError, onAudioGenerated, onPlayStart]
  )

  return { handleFinalTranscript }
}
