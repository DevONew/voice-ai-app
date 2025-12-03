'use client'

import { useState, useRef } from 'react'

export default function TTSTestPage() {
  const [text, setText] = useState('안녕하세요!')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleTTS = async () => {
    if (!text.trim()) {
      setError('텍스트를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('📝 TTS 요청:', text)

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const audioBlob = await response.blob()
      console.log('✅ TTS 완료:', audioBlob.size, 'bytes')

      const url = URL.createObjectURL(audioBlob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(`오류: ${message}`)
      console.error('❌ TTS 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">TTS 테스트</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="텍스트를 입력하세요"
        className="w-full max-w-lg h-32 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
      />

      <button
        onClick={handleTTS}
        disabled={isLoading}
        className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? '처리 중...' : '읽어주기'}
      </button>

      <audio
        ref={audioRef}
        controls
        className="w-full max-w-lg"
      />

      {error && (
        <div className="text-red-500 font-semibold">{error}</div>
      )}

      <div className="text-sm text-gray-500 mt-4">
        💡 콘솔(F12)에서 로그를 확인할 수 있습니다.
      </div>
    </div>
  )
}
