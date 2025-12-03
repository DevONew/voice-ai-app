'use client'

import { useState, useRef } from 'react'
import PulseIndicator from '../../components/PulseIndicator'
import VoiceButton from '../../components/VoiceButton'

export default function PulseIndicatorTestPage() {
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // AudioContext 설정
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // 음량 분석 시작
      const updateVolume = () => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedVolume = Math.min(100, (average / 255) * 100)

        setVolumeLevel(normalizedVolume)
        animationFrameRef.current = requestAnimationFrame(updateVolume)
      }

      updateVolume()
      setIsRecording(true)
    } catch (err) {
      setError('마이크 접근 실패')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setVolumeLevel(0)
    setIsRecording(false)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-8 gap-8">
      <h1 className="text-3xl font-bold">PulseIndicator 음성 테스트</h1>

      <div className="w-full max-w-md space-y-4">
        <div>
          <p className="text-lg font-semibold mb-2">음량 레벨: {volumeLevel.toFixed(1)}</p>
          <div className="w-full h-2 bg-gray-300 rounded-lg overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${volumeLevel}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isRecording ? '녹음 중...' : '마이크 시작'}
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-400"
          >
            중지
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="border-2 border-gray-300 rounded-lg p-8 bg-gray-50 min-h-48 flex items-center justify-center">
        {isRecording ? (
          <VoiceButton
            isAnimating={true}
            scale={0.6 + (volumeLevel / 100) * 0.8}
            isListening={isRecording}
            onClick={() => {}}
            size={150}
          />
        ) : (
          <p className="text-gray-500">마이크를 시작하세요</p>
        )}
      </div>

      <div className="text-sm text-gray-500">
        💡 마이크를 시작하고 말해보세요. 음성 크기에 따라 원이 커졌다 작아집니다.
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
        <p className="font-semibold mb-2">크기 기준:</p>
        <div className="space-y-1 text-gray-700">
          <p>0-15: 매우 작음</p>
          <p>15-30: 작음</p>
          <p>30-45: 중간</p>
          <p>45-60: 큼</p>
          <p>60-75: 더 큼</p>
          <p>75-100: 매우 큼</p>
        </div>
      </div>
    </div>
  )
}
