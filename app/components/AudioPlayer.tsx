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
    audioRef.current.load() // iOS에서 중요: 명시적으로 load 호출
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

      // iOS Safari를 위한 재생 처리
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ 오디오 재생 성공')
          })
          .catch((err) => {
            console.error('❌ Play error:', err)
            // iOS에서 자동재생 실패 시 재시도
            if (audioRef.current) {
              audioRef.current.muted = false
              audioRef.current.play().catch((retryErr) => {
                console.error('❌ Retry play error:', retryErr)
              })
            }
          })
      }
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

  return (
    <audio
      ref={audioRef}
      playsInline
      preload="auto"
    />
  )
}
