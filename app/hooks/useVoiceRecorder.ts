'use client'

import { useCallback, useRef, useState } from 'react'

interface UseVoiceRecorderReturn {
  isRecording: boolean
  transcript: string
  volumeLevel: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  resetRecorder: () => void
}

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const updateVolume = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedVolume = Math.min(100, (average / 255) * 100)

    setVolumeLevel(normalizedVolume)
    animationFrameRef.current = requestAnimationFrame(updateVolume)
  }, [])


  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript('')
      setVolumeLevel(0)

      // Web Speech API 초기화
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error('브라우저에서 음성 인식을 지원하지 않습니다')
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // 한국어 설정
      recognition.lang = 'ko-KR'
      recognition.continuous = true
      recognition.interimResults = true

      // 오디오 볼륨 추적을 위한 AudioContext 설정
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // 음성 인식 결과 처리
      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const currentTranscript = finalTranscript || interimTranscript
        setTranscript(currentTranscript)
        console.log('🎤 STT 결과:', currentTranscript, finalTranscript ? '(최종)' : '(임시)')

        // 최종 결과가 나오면 자동으로 종료
        if (finalTranscript) {
          setTimeout(() => {
            recognition.stop()
            setIsRecording(false)
          }, 500)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('❌ 음성 인식 에러:', event.error)
        setError(`음성 인식 실패: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setVolumeLevel(0)
      }

      recognition.start()
      setIsRecording(true)
      updateVolume()
    } catch (err) {
      const message = err instanceof Error ? err.message : '마이크 접근 실패'
      setError(message)
      setIsRecording(false)
    }
  }, [updateVolume, isRecording])

  const stopRecording = useCallback(async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)

      // 스트림 정지
      streamRef.current?.getTracks().forEach((track) => track.stop())

      // 애니메이션 프레임 정지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // 오디오 컨텍스트 정리
      if (audioContextRef.current) {
        await audioContextRef.current.close().catch(() => {})
      }

      setVolumeLevel(0)
    }
  }, [isRecording])

  const resetRecorder = useCallback(() => {
    setTranscript('')
    setVolumeLevel(0)
    setError(null)
  }, [])

  return {
    isRecording,
    transcript,
    volumeLevel,
    error,
    startRecording,
    stopRecording,
    resetRecorder,
  }
}
