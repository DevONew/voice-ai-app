'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [isAudioReady, setIsAudioReady] = useState(false)

  useEffect(() => {
    if (!audioRef.current || !audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    audioRef.current.src = url

    // iOS를 위한 오디오 준비
    const handleCanPlay = () => {
      console.log('✅ 오디오 준비 완료')
      setIsAudioReady(true)
    }

    audioRef.current.addEventListener('canplay', handleCanPlay)
    audioRef.current.load() // iOS에서 중요: 명시적으로 load 호출
    console.log(`🎵 오디오 src 설정: ${url}`)

    return () => {
      audioRef.current?.removeEventListener('canplay', handleCanPlay)
      URL.revokeObjectURL(url)
      setIsAudioReady(false)
    }
  }, [audioBlob])

  useEffect(() => {
    if (!audioRef.current || !isAudioReady) return

    if (isPlaying && audioBlob) {
      console.log(`🎵 오디오 재생 시작 (${AUDIO_CONFIG.PLAYBACK_RATE}x 속도)`)

      const audio = audioRef.current
      audio.playbackRate = AUDIO_CONFIG.PLAYBACK_RATE

      // iOS Safari를 위한 강화된 재생 처리
      const attemptPlay = async () => {
        try {
          // 재생 전 volume 확인 (iOS에서 중요)
          audio.volume = 1.0

          await audio.play()
          console.log('✅ 오디오 재생 성공')
        } catch (err) {
          console.error('❌ Play error:', err)

          // iOS 자동재생 정책 우회 시도
          // 사용자 제스처가 있을 때만 재생 가능
          console.log('🔄 iOS 자동재생 차단됨 - 재시도 중...')

          // 짧은 딜레이 후 재시도
          setTimeout(() => {
            if (audio) {
              audio.play().catch((retryErr) => {
                console.error('❌ Retry play error:', retryErr)
                console.log('💡 사용자가 화면을 터치한 후 재생 시도')
              })
            }
          }, 100)
        }
      }

      attemptPlay()
    } else {
      console.log('⏹️ 오디오 일시정지')
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [isPlaying, audioBlob, isAudioReady])

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
