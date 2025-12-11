'use client'

import { useState } from 'react'
import VoiceButton from '../../components/VoiceButton'
import StateTextDisplay from '../../components/StateTextDisplay'

const thinkingText = '생각하는 중..'

export default function PublishResponsePage() {
  const [isListening, setIsListening] = useState(false)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 relative">
      {/* 상단 텍스트 */}
      <StateTextDisplay text={thinkingText} />

      {/* 하단 원 */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '40px' }}>
        <VoiceButton
          isAnimating={true}
          scale={0.8}
          isListening={isListening}
          onClick={handleButtonClick}
        />
      </div>
    </div>
  )
}
