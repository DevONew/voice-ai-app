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

  const MAX_SENTENCE_LENGTH = 20

  // 20글자 초과 문장을 더 작은 부분으로 분절
  const splitLongSentence = (sentence: string): string[] => {
    // 쉼표로 나누기 시도
    const parts = sentence.split(',')
    const result: string[] = []

    parts.forEach((part, idx) => {
      const text = part.trim() + (idx < parts.length - 1 ? ',' : '')
      if (text.length <= MAX_SENTENCE_LENGTH) {
        result.push(text)
      } else {
        // 쉼표도 안되면 공백으로 나누기
        const words = text.split(' ')
        let chunk = ''
        words.forEach((word) => {
          if ((chunk + word).length <= MAX_SENTENCE_LENGTH) {
            chunk += (chunk ? ' ' : '') + word
          } else {
            if (chunk) result.push(chunk)
            chunk = word
          }
        })
        if (chunk) result.push(chunk)
      }
    })

    return result
  }

  // 문장을 구분자로 나누는 함수
  const splitSentences = (text: string): string[] => {
    // 1단계: 문장 끝으로 분절
    const sentences = text
      .split(/([.!?。！？\n]+)/g) // 구분자 포함
      .reduce((result: string[], item: string, index: number, arr: string[]) => {
        if (index % 2 === 0 && item.trim()) {
          result.push(item.trim())
        } else if (index % 2 === 1 && index > 0 && arr[index - 1].trim()) {
          if (result.length > 0) {
            result[result.length - 1] += item
          }
        }
        return result
      }, [])
      .filter((s: string) => s.trim().length > 0)

    // 2단계: 20글자 이상이면 추가 분절
    return sentences.flatMap(sentence =>
      sentence.length <= MAX_SENTENCE_LENGTH ? [sentence] : splitLongSentence(sentence)
    )
  }

  // 각 문장을 3개씩 배치로 나눠서 TTS 처리하는 함수
  const processSentencesTTS = async (sentences: string[]) => {
    try {
      const audioBlobs: Blob[] = []
      const BATCH_SIZE = 3

      // 3개씩 배치로 나눠서 처리
      for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
        const batch = sentences.slice(i, i + BATCH_SIZE)
        console.log(`🎵 배치 처리 (${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sentences.length / BATCH_SIZE)}): ${batch.length}개 문장`)

        // 배치 내의 문장들을 동시에 처리
        const batchPromises = batch.map((sentence) => {
          console.log(`  └─ 문장 TTS 처리: "${sentence}"`)
          return handleTTSAPI(sentence)
        })

        const batchResults = await Promise.all(batchPromises)
        audioBlobs.push(...batchResults)
      }

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
