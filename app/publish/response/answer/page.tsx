'use client'

import { useState } from 'react'
import VoiceButton from '../../../components/VoiceButton'
import StateTextDisplay from '../../../components/StateTextDisplay'

const answerText = '설정 완료 되었습니다.'

export default function PublishResponseAnswerPage() {
  const [isListening, setIsListening] = useState(false)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 relative">
      {/* 상단 텍스트 */}
      <StateTextDisplay text={answerText} />

      {/* 하단 원 */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '120px' }}>
        <VoiceButton
          isAnimating={true}
          scale={0.4}
          isListening={isListening}
          onClick={handleButtonClick}
        />
      </div>
    </div>
  )
}
