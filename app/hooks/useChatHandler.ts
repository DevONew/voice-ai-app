'use client'

import { useCallback, useRef, useEffect } from 'react'
import { ConversationHistory } from '../types'
import { useAudioAPI } from './useAudioAPI'
import { detectLanguage } from '../utils/language-detector'
import { splitIntoSentences } from '../utils/sentence-splitter'
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

          // 문장 단위로 TTS 처리 (스트리밍 방식)
          try {
            console.log('🎵 문장 단위 TTS 스트리밍 시작')

            const sentences = splitIntoSentences(aiResponse)
            console.log(`📝 분리된 문장 수: ${sentences.length}`)

            if (sentences.length === 0) {
              console.warn('⚠️ 분리된 문장이 없음')
              return
            }

            // 모든 문장의 TTS를 병렬로 요청 (음성 큐 생성)
            const audioQueue: Blob[] = []

            // 첫 번째 문장부터 순차적으로 처리
            for (let i = 0; i < sentences.length; i++) {
              const sentence = sentences[i]
              console.log(`🎵 TTS 변환 중 (${i + 1}/${sentences.length}): "${sentence.substring(0, 30)}..."`)

              try {
                const audioBlob = await handleTTSAPI(sentence)
                audioQueue.push(audioBlob)
                console.log(`✅ TTS 완료 (${i + 1}/${sentences.length})`)

                // 첫 번째 음성을 받으면 즉시 재생 시작
                if (i === 0) {
                  setTimeout(() => {
                    console.log('🎯 상태 변경: processing → speaking')
                    onStateChange('speaking')
                    onAudioGenerated(audioBlob)
                    onPlayStart()
                  }, AUDIO_CONFIG.TTS_DELAY)
                }
              } catch (ttsErr) {
                console.error(`❌ TTS 에러 (문장 ${i + 1}):`, ttsErr)
              }
            }

            // 모든 오디오 큐가 준비되면 컴포넌트에 알림
            if (audioQueue.length > 1) {
              // 나머지 음성들도 onAudioGenerated로 순차 전달
              // (첫 번째는 이미 전달됨)
              for (let i = 1; i < audioQueue.length; i++) {
                onAudioGenerated(audioQueue[i])
              }
            }
          } catch (ttsErr) {
            console.error('❌ TTS 스트리밍 에러:', ttsErr)
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
