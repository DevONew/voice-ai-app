'use client'

import { useState } from 'react'
import VoiceButton from '../../../components/VoiceButton'

export default function PublishListeningLoudPage() {
  const [isListening, setIsListening] = useState(true)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4">
      <div className="flex flex-col items-center gap-[35px]">
        {/* 듣는중 문구 */}
        <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">듣는중</p>

        {/* 원 - 최대 크기 */}
        <VoiceButton
          isAnimating={true}
          scale={1.1}
          isListening={isListening}
          onClick={handleButtonClick}
        />
      </div>
    </div>
  )
}
