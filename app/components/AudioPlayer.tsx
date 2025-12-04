'use client'

import { useEffect, useRef } from 'react'
import { AUDIO_CONFIG } from '@/app/constants/audio'

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

  useEffect(() => {
    if (!audioRef.current || !audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    audioRef.current.src = url
    console.log(`🎵 오디오 src 설정: ${url}`)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying && audioBlob) {
      console.log(`🎵 오디오 재생 시작 (${AUDIO_CONFIG.PLAYBACK_RATE}x 속도)`)
      audioRef.current.playbackRate = AUDIO_CONFIG.PLAYBACK_RATE
      audioRef.current.play().catch((err) => console.error('❌ Play error:', err))
    } else {
      console.log('⏹️ 오디오 일시정지')
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [isPlaying, audioBlob])

  // 오디오 종료 이벤트
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

  return <audio ref={audioRef} />
}
