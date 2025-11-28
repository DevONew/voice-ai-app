'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import VoiceButton from './VoiceButton'

interface AudioPlayerProps {
  audioBlob: Blob | null
  isPlaying: boolean
  onPlayEnd: () => void
}

export default function AudioPlayer({
  audioBlob,
  isPlaying,
  onPlayEnd,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [scale, setScale] = useState(1)

  const updateVolume = useCallback(() => {
    if (!audioRef.current || !isPlaying) return

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass() as AudioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      if (audioContext.createMediaElementAudioSource) {
        const source = audioContext.createMediaElementAudioSource(audioRef.current)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedVolume = Math.min(100, (average / 255) * 100)
        const newScale = 0.85 + (normalizedVolume / 100) * 0.3
        setScale(newScale)
      }
    } catch (error) {
      console.error('Analyser error:', error)
    }

    requestAnimationFrame(updateVolume)
  }, [isPlaying])

  useEffect(() => {
    if (!audioRef.current || !audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    audioRef.current.src = url
    console.log('🎵 오디오 src 설정:', url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying && audioBlob) {
      console.log('🎵 오디오 재생 시작')
      audioRef.current.play().catch((err) => console.error('❌ Play error:', err))
      updateVolume()
    } else {
      console.log('⏹️ 오디오 일시정지')
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setScale(1)
    }
  }, [isPlaying, audioBlob, updateVolume])

  // 오디오 종료 이벤트 (onEnded)
  useEffect(() => {
    if (!audioRef.current) return

    const handleEnd = () => {
      console.log('✅ 오디오 재생 완료')
      onPlayEnd()
    }

    audioRef.current.addEventListener('ended', handleEnd)
    return () => {
      audioRef.current?.removeEventListener('ended', handleEnd)
    }
  }, [onPlayEnd])

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    onPlayEnd()
  }

  return (
    <>
      <audio ref={audioRef} />
      {/* VoiceButton은 StateViews에서 관리하므로 여기서는 제거 */}
    </>
  )
}
