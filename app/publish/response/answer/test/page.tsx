'use client'

import { useState, useRef } from 'react'

const testText = `줄글 하나 쓰고 테스트입니다. Bonjour, comment allez-vous? Je m'appelle Anna. 你好, Hello. 원어민 선생님`

export default function TestPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleTTSClick = async () => {
    setIsPlaying(true)
    try {
      console.log('🎵 TTS 요청 시작')
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      })

      if (!response.ok) {
        throw new Error('TTS 실패')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.src = url
        await audioRef.current.play()
        console.log('✅ 음성 재생 시작')
      }
    } catch (err) {
      console.error('❌ TTS 에러:', err)
      alert('음성 재생 중 오류가 발생했습니다')
    } finally {
      setIsPlaying(false)
    }
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-4 gap-8">
      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={audioRef} />

      {/* 제목 */}
      <h1 className="text-3xl font-bold text-gray-800">테스트</h1>

      {/* 텍스트 */}
      <p className="text-lg text-gray-600 text-center max-w-2xl">
        줄글 하나 쓰고 테스트입니다. Bonjour, comment allez-vous? Je m'appelle Anna. 你好, Hello. 원어민 선생님
      </p>

      {/* TTS 버튼 */}
      <button
        onClick={handleTTSClick}
        disabled={isPlaying}
        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPlaying ? '🎵 재생 중...' : '🔊 음성으로 읽어주기'}
      </button>
    </div>
  )
}
