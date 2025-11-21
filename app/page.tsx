'use client'

import { useState } from 'react'

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')
  const [statusText, setStatusText] = useState('탭하여 시작')
  const [scale, setScale] = useState(1)
  const [animationActive, setAnimationActive] = useState(false)

  // Mock 애니메이션 시작
  const startMockAnimation = () => {
    let animationId: NodeJS.Timeout
    const animate = () => {
      const randomScale = 0.9 + Math.random() * 0.3 // 0.9 ~ 1.2
      setScale(randomScale)
      animationId = setTimeout(animate, 500)
    }
    animate()

    // 3-4초 후 애니메이션 중지
    setTimeout(() => {
      setAnimationActive(false)
      setScale(1)
      clearTimeout(animationId)
    }, 3500)
  }

  // 버튼 클릭 핸들러
  const handleButtonClick = () => {
    console.log('작동중입니다.')

    if (isListening) {
      // 이미 진행 중이면 중지
      setIsListening(false)
      setStatusText('탭하여 시작')
      setTranscriptText('')
      setAnimationActive(false)
      setScale(1)
      return
    }

    // 새로 시작
    setIsListening(true)
    setStatusText('듣는 중...')
    setTranscriptText('')
    setAnimationActive(true)

    // 2초 후 더미 텍스트 표시
    setTimeout(() => {
      setTranscriptText('안녕하세요, 테스트 음성입니다')
      startMockAnimation()
    }, 2000)

    // 5초 후 자동 중지
    setTimeout(() => {
      setIsListening(false)
      setStatusText('탭하여 시작')
      setTranscriptText('')
      setAnimationActive(false)
      setScale(1)
    }, 5000)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 상단 상태 텍스트 */}
      <div className="flex-1 flex items-end justify-center mb-12">
        <p
          className={`text-center transition-all duration-300 ${
            isListening ? 'text-lg font-black text-black animate-fadeIn' : 'text-base font-bold text-gray-600'
          }`}
        >
          {statusText}
        </p>
      </div>

      {/* 중앙 마이크 버튼 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* 메인 버튼 */}
          <button
            onClick={handleButtonClick}
            className="relative rounded-full shadow-2xl focus:outline-none z-10 active:scale-95 cursor-pointer border-0"
            style={{
              width: '200px',
              height: '200px',
              background: isListening
                ? 'radial-gradient(circle, #000000 0%, #999999 100%)'
                : '#000000',
              transform: `scale(${animationActive ? scale : 1})`,
              transition: animationActive ? 'transform 0.4s ease-in-out' : 'transform 0.2s ease-in-out, background 0.3s ease-in-out',
              border: 'none',
              outline: 'none',
            }}
            aria-label="마이크 버튼"
            type="button"
          />
        </div>
      </div>

      {/* 하단 텍스트 표시 영역 */}
      <div className="flex-1 flex items-start justify-center pt-4 px-4">
        {transcriptText && (
          <div className="w-full max-w-xs animate-fadeIn">
            <p className="text-center text-lg text-black leading-relaxed break-words font-medium">
              {transcriptText}
            </p>
          </div>
        )}
      </div>

      {/* 매우 하단 상태 인디케이터 (optional) */}
      {isListening && (
        <div className="pb-6">
          <div className="flex gap-1 justify-center">
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
    </div>
  )
}
