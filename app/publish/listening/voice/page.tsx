'use client'

import { useState } from 'react'
import VoiceButton from '../../../components/VoiceButton'

export default function PublishListeningVoicePage() {
  const [isListening, setIsListening] = useState(true)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4">
      <div className="flex flex-col items-center gap-[35px]">
        {/* 인식된 음성 텍스트 */}
        <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">아아 테스트</p>

        {/* 원 */}
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
