'use client'

import { useCallback, useRef, useEffect } from 'react'
import { ConversationHistory } from '../types'
import { useAudioAPI } from './useAudioAPI'
import { detectLanguage } from '../utils/language-detector'

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

  // 문장을 구분자로 나누는 함수
  const splitSentences = (text: string): string[] => {
    // 문장 끝을 나타내는 기호로 분리 (마침표, 느낌표, 물음표, 줄바꿈 등)
    const sentences = text
      .split(/([.!?。！？\n]+)/g) // 구분자 포함
      .reduce((result: string[], item: string, index: number, arr: string[]) => {
        if (index % 2 === 0 && item.trim()) {
          // 구분자가 없으면 그냥 추가
          result.push(item.trim())
        } else if (index % 2 === 1 && index > 0 && arr[index - 1].trim()) {
          // 구분자를 이전 문장에 붙임
          if (result.length > 0) {
            result[result.length - 1] += item
          }
        }
        return result
      }, [])
      .filter((s: string) => s.trim().length > 0)

    return sentences.length > 0 ? sentences : [text]
  }

  // 각 문장을 순차적으로 TTS 처리하는 함수
  const processSentencesTTS = async (sentences: string[]) => {
    try {
      // 모든 문장을 동시에 TTS 처리 후 병합
      const audioPromises = sentences.map((sentence) => {
        console.log(`🎵 문장 TTS 처리: "${sentence}"`)
        return handleTTSAPI(sentence)
      })

      const audioBlobs = await Promise.all(audioPromises)

      // Blob 병합
      const mergedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' })
      console.log(`🎵 모든 문장 TTS 처리 완료 (${sentences.length}개 문장)`)

      return mergedBlob
    } catch (err) {
      console.error('❌ 문장 TTS 처리 에러:', err)
      throw err
    }
  }

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
        // conversationHistory 업데이트는 page.tsx에서 처리
      })
        .then(async (aiResponse) => {
          console.log('✅ Chat API 응답 (백그라운드):', aiResponse)
          onResponseReceived(aiResponse)

          // 문장 단위로 TTS 처리
          try {
            const sentences = splitSentences(aiResponse)
            console.log(`🎵 TTS 처리 시작 (${sentences.length}개 문장):`, sentences)

            const audioBlob = await processSentencesTTS(sentences)
            console.log('🎵 TTS 처리 완료')
            onAudioGenerated(audioBlob)

            // TTS 완료 후 재생 시작
            setTimeout(() => {
              console.log('🎯 상태 변경: processing → speaking')
              onStateChange('speaking')
              onPlayStart()
            }, 500)
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
