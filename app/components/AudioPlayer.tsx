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
  const audioQueueRef = useRef<Blob[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 오디오 블롭이 들어오면 큐에 추가
  useEffect(() => {
    if (audioBlob) {
      audioQueueRef.current.push(audioBlob)
      console.log(`📝 오디오 큐에 추가 (총 ${audioQueueRef.current.length}개)`)

      // 첫 번째 블롭이면 바로 재생 준비
      if (audioQueueRef.current.length === 1) {
        setCurrentIndex(0)
      }
    }
  }, [audioBlob])

  // 현재 인덱스의 오디오를 재생 준비
  useEffect(() => {
    if (!audioRef.current || currentIndex >= audioQueueRef.current.length) return

    const blob = audioQueueRef.current[currentIndex]
    const url = URL.createObjectURL(blob)
    audioRef.current.src = url
    console.log(`🎵 오디오 src 설정 (${currentIndex + 1}/${audioQueueRef.current.length}): ${url}`)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [currentIndex])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying && currentIndex < audioQueueRef.current.length) {
      console.log(`🎵 오디오 재생 시작 (${currentIndex + 1}/${audioQueueRef.current.length}, ${AUDIO_CONFIG.PLAYBACK_RATE}x 속도)`)
      audioRef.current.playbackRate = AUDIO_CONFIG.PLAYBACK_RATE
      audioRef.current.play().catch((err) => console.error('❌ Play error:', err))
    } else {
      console.log('⏹️ 오디오 일시정지')
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [isPlaying, currentIndex])

  // 오디오 종료 이벤트 (onEnded)
  useEffect(() => {
    if (!audioRef.current) return

    const handleEnd = () => {
      console.log(`✅ 오디오 재생 완료 (${currentIndex + 1}/${audioQueueRef.current.length})`)

      // 다음 오디오가 있으면 재생
      if (currentIndex + 1 < audioQueueRef.current.length) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // 모든 오디오 재생 완료
        console.log('🎉 모든 오디오 재생 완료')
        audioQueueRef.current = []
        setCurrentIndex(0)
        onPlayEnd()
      }
    }

    audioRef.current.addEventListener('ended', handleEnd)
    return () => {
      audioRef.current?.removeEventListener('ended', handleEnd)
    }
  }, [currentIndex, onPlayEnd])

  return <audio ref={audioRef} />
}
