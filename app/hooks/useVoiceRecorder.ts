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

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio Context 설정
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })

        // STT API 호출
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'audio.webm')

          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('STT 처리 실패')
          }

          const data = await response.json()
          console.log('🎤 STT 결과:', data.text)
          setTranscript(data.text || '')
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'STT 오류 발생'
          console.error('❌ STT 에러:', errorMsg)
          setError(errorMsg)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      updateVolume()
    } catch (err) {
      const message = err instanceof Error ? err.message : '마이크 접근 실패'
      setError(message)
      setIsRecording(false)
    }
  }, [updateVolume])

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // 스트림 정지
      streamRef.current?.getTracks().forEach((track) => track.stop())

      // 애니메이션 프레임 정지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // 오디오 컨텍스트 정리
      if (audioContextRef.current) {
        await audioContextRef.current.close()
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
