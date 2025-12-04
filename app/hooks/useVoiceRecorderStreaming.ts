'use client'

import { useCallback, useRef, useState } from 'react'
import { AUDIO_CONFIG } from '@/app/constants/audio'
import { getAudioContext } from '@/app/utils/audio-context'

interface UseVoiceRecorderStreamingReturn {
  isRecording: boolean
  transcript: string
  interimTranscript: string
  volumeLevel: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  resetRecorder: () => void
}

export function useVoiceRecorderStreaming(
  setAppState?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void,
  onTranscriptUpdate?: (transcript: string, interim: string) => void,
  onFinalTranscript?: (transcript: string) => void,
  currentLanguage?: string
): UseVoiceRecorderStreamingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVolumeRef = useRef<number>(0)


  const updateVolume = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedVolume = Math.min(100, (average / 255) * 100)

    setVolumeLevel(normalizedVolume)
    lastVolumeRef.current = normalizedVolume

    animationFrameRef.current = requestAnimationFrame(updateVolume)
  }, [])

  // 음성 활동 감지로 자동 종료
  const setupSilenceDetection = useCallback(
    (mediaRecorder: MediaRecorder) => {
      const checkSilence = () => {
        if (lastVolumeRef.current < AUDIO_CONFIG.SILENCE_THRESHOLD) {
          console.log('🔇 침묵 감지 - 녹음 자동 종료')
          mediaRecorder.stop()
        } else {
          // 음성이 있으면 타이머 리셋
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }
          silenceTimeoutRef.current = setTimeout(checkSilence, AUDIO_CONFIG.SILENCE_DURATION)
        }
      }

      silenceTimeoutRef.current = setTimeout(checkSilence, AUDIO_CONFIG.SILENCE_DURATION)
    },
    []
  )

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      setVolumeLevel(0)
      audioChunksRef.current = []

      // 마이크 접근
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 오디오 볼륨 추적 (싱글톤 인스턴스 사용)
      const audioContext = getAudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder

      // 오디오 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // 녹음 중지 시 STT 호출
      mediaRecorder.onstop = async () => {
        try {
          // 음성 활동 감지 타이머 정리
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          console.log('🎙️ 녹음 완료, 오디오 크기:', audioBlob.size, 'bytes')

          // 최종 STT API 호출
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          if (currentLanguage) {
            formData.append('currentLanguage', currentLanguage)
          }

          console.log('📤 Eleven Labs STT API 호출 중...')
          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'STT 처리 실패')
          }

          const result = await response.json()
          const recognizedText = result.text || ''

          console.log('✅ STT 최종 결과:', recognizedText)
          setTranscript(recognizedText)
          setInterimTranscript('')

          // 2초 동안 listening 상태에서 STT 결과 표시
          setTimeout(() => {
            console.log('🎯 상태 변경: listening → processing (자동)')
            if (setAppState) {
              setAppState('processing')
            }

            // 2초 후에 Chat API를 백그라운드에서 호출
            if (onFinalTranscript) {
              onFinalTranscript(recognizedText)
            }
          }, 2000)

          setTimeout(() => {
            setIsRecording(false)
          }, 500)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'STT 처리 실패'
          console.error('❌ STT 에러:', message)
          setError(message)
          setIsRecording(false)
        }
      }

      // 녹음 시작
      mediaRecorder.start()
      setIsRecording(true)
      updateVolume()
      setupSilenceDetection(mediaRecorder)

      console.log('🎤 음성 녹음 시작 (음성 활동 감지 활성화)')
    } catch (err) {
      const message = err instanceof Error ? err.message : '마이크 접근 실패'
      console.error('❌ 녹음 시작 에러:', message)
      setError(message)
      setIsRecording(false)
    }
  }, [updateVolume, setupSilenceDetection, setAppState, onTranscriptUpdate])

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // 음성 활동 감지 타이머 정리
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }

      // 스트림 정지
      streamRef.current?.getTracks().forEach((track) => track.stop())

      // 애니메이션 프레임 정지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // 싱글톤 AudioContext이므로 닫지 않음 (다른 곳에서도 사용될 수 있음)

      setVolumeLevel(0)
      console.log('⏹️ 음성 녹음 중지 (수동)')
    }
  }, [isRecording])

  const resetRecorder = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setVolumeLevel(0)
    setError(null)
    audioChunksRef.current = []
  }, [])

  return {
    isRecording,
    transcript,
    interimTranscript,
    volumeLevel,
    error,
    startRecording,
    stopRecording,
    resetRecorder,
  }
}
