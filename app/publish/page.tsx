'use client'

import { useState } from 'react'
import VoiceButton from '../components/VoiceButton'

export default function PublishPage() {
  const [isListening, setIsListening] = useState(false)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4">
      <div className="flex flex-col items-center gap-[35px]">
        {/* 탭하여 시작 문구 */}
        <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">탭하여 시작</p>

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
