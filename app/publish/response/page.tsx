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
    <div className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4">
      <div className="flex flex-col items-center gap-[35px]">
        {/* 생각하는 중 문구 */}
        <StateTextDisplay text={thinkingText} />

        {/* VoiceButton */}
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
