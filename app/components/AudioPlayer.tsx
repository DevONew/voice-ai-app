'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import VoiceButton from './VoiceButton'

interface AudioPlayerProps {
  audioBlob: Blob | null
  isPlaying: boolean
  onPlayStart: () => void
  onPlayEnd: () => void
  onVolumeChange: (volume: number) => void
}

export default function AudioPlayer({
  audioBlob,
  isPlaying,
  onPlayStart,
  onPlayEnd,
  onVolumeChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [scale, setScale] = useState(1)

  const setupAudioAnalyser = useCallback(() => {
    if (!audioRef.current) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const source = (audioContext as any).createMediaElementAudioSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(audioContext.destination)
  }, [])

  const updateVolume = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedVolume = Math.min(100, (average / 255) * 100)

    // 볼륨 기반 스케일 계산 (85% ~ 115%)
    const newScale = 0.85 + (normalizedVolume / 100) * 0.3
    setScale(newScale)
    onVolumeChange(normalizedVolume)

    requestAnimationFrame(updateVolume)
  }, [isPlaying, onVolumeChange])

  useEffect(() => {
    if (!audioRef.current || !audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    audioRef.current.src = url

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      setupAudioAnalyser()
      audioRef.current.play().catch((err) => console.error('Play error:', err))
      updateVolume()
    } else {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setScale(1)
    }
  }, [isPlaying, setupAudioAnalyser, updateVolume])

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    onPlayEnd()
  }

  if (!audioBlob || !isPlaying) return null

  return (
    <>
      <audio ref={audioRef} onEnded={onPlayEnd} />

      {/* 하단 작은 원 버튼 */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-500">
        <VoiceButton
          isAnimating={true}
          scale={scale}
          isListening={true}
          isBottom={true}
          onClick={handleStop}
        />
      </div>
    </>
  )
}
