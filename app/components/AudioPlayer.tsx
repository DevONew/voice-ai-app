'use client'

import { useEffect, useRef, useState } from 'react'
import { AUDIO_CONFIG } from '@/app/constants/audio'
import { isIOSSafari } from '@/app/utils/platform-detect'

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
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // iOS Safari용 초기 사용자 인터랙션 감지
  useEffect(() => {
    // iOS Safari가 아니면 스킵
    if (!isIOSSafari()) {
      setHasUserInteracted(true) // 다른 플랫폼은 인터랙션 체크 안 함
      return
    }

    const handleInteraction = () => {
      if (!hasUserInteracted) {
        console.log('✅ 사용자 인터랙션 감지 - 오디오 재생 준비 (iOS Safari)')
        setHasUserInteracted(true)

        // iOS에서 AudioContext 활성화
        if (audioRef.current) {
          audioRef.current.load()

          // 무음 재생으로 iOS 오디오 시스템 활성화
          const silentPlay = audioRef.current.play()
          if (silentPlay) {
            silentPlay.then(() => {
              audioRef.current?.pause()
              audioRef.current!.currentTime = 0
              console.log('🔊 iOS 오디오 시스템 활성화 완료')
            }).catch(() => {
              // 무시 - 정상적인 동작
            })
          }
        }
      }
    }

    // 첫 터치/클릭 감지
    document.addEventListener('touchstart', handleInteraction, { once: true })
    document.addEventListener('click', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('click', handleInteraction)
    }
  }, [hasUserInteracted])

  useEffect(() => {
    if (!audioRef.current || !audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    
    console.log(`🎵 오디오 src 설정: ${url.substring(0, 50)}...`)
    console.log(`📊 Blob 정보: type=${audioBlob.type}, size=${audioBlob.size} bytes`)

    // iOS를 위한 오디오 준비
    const handleCanPlay = () => {
      console.log('✅ 오디오 준비 완료 (canplay)')
      setIsAudioReady(true)
    }

    const handleLoadedMetadata = () => {
      console.log('✅ 오디오 메타데이터 로드 완료')
    }

    const handleError = (e: Event) => {
      console.error('❌ 오디오 로드 에러:', e)
      const audio = e.target as HTMLAudioElement
      console.error('에러 코드:', audio.error?.code, '메시지:', audio.error?.message)
    }

    const audio = audioRef.current
    audio.src = url
    
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)
    
    // iOS에서 중요: 명시적으로 load 호출
    audio.load()

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
      URL.revokeObjectURL(url)
      setIsAudioReady(false)
    }
  }, [audioBlob])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioReady) return

    if (isPlaying && audioBlob) {
      console.log(`🎵 오디오 재생 시작 (${AUDIO_CONFIG.PLAYBACK_RATE}x 속도)`)

      audio.playbackRate = AUDIO_CONFIG.PLAYBACK_RATE

      // 플랫폼별 재생 처리
      const attemptPlay = async () => {
        try {
          // 재생 전 volume 및 muted 확인
          audio.volume = 1.0
          audio.muted = false

          // 이전 재생 위치 초기화
          audio.currentTime = 0

          // iOS Safari에서만 딜레이 적용
          if (isIOSSafari()) {
            console.log('🔍 오디오 상태 (iOS Safari):', {
              readyState: audio.readyState,
              paused: audio.paused,
              ended: audio.ended,
              volume: audio.volume,
              muted: audio.muted,
            })
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          const playPromise = audio.play()

          if (playPromise !== undefined) {
            await playPromise
            console.log('✅ 오디오 재생 성공')
          }
        } catch (err) {
          const error = err as DOMException
          console.error('❌ Play error:', {
            name: error.name,
            message: error.message,
          })

          // iOS Safari에서만 자동재생 정책 처리
          if (isIOSSafari() && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            console.log('🔄 iOS 자동재생 차단됨 - 사용자 제스처 필요')
            console.log('💡 해결방법: 버튼을 다시 클릭하면 재생됩니다')

            // 사용자 인터랙션 플래그 리셋
            setHasUserInteracted(false)
          } else {
            // 다른 에러는 재시도
            console.log('🔄 재시도 중...')
            setTimeout(() => {
              if (audio && !audio.paused) return // 이미 재생 중이면 스킵

              audio.play().catch((retryErr) => {
                console.error('❌ Retry play error:', retryErr)
              })
            }, 200)
          }
        }
      }

      attemptPlay()
    } else if (!isPlaying && audio) {
      console.log('⏹️ 오디오 일시정지')
      audio.pause()
      audio.currentTime = 0
    }
  }, [isPlaying, audioBlob, isAudioReady])

  // 오디오 종료 이벤트
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnd = () => {
      console.log('✅ 오디오 재생 완료')
      onPlayEnd()
    }

    const handlePause = () => {
      console.log('⏸️ 오디오 일시정지됨')
    }

    const handlePlay = () => {
      console.log('▶️ 오디오 재생 시작됨')
    }

    audio.addEventListener('ended', handleEnd)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    
    return () => {
      audio.removeEventListener('ended', handleEnd)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
    }
  }, [onPlayEnd])

  return (
    <audio
      ref={audioRef}
      playsInline
      preload="auto"
      controls={false}
      autoPlay={false}
      muted={false}
      style={{ display: 'none' }}
    />
  )
}
