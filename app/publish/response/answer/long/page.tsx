'use client'

import { useState } from 'react'
import VoiceButton from '../../../../components/VoiceButton'
import StateTextDisplay from '../../../../components/StateTextDisplay'
import { LONG_PAGE_TEXT } from '../../../../constants/longPageTexts'

const VOICE_BUTTON_SCALE = 0.4
const VOICE_BUTTON_BOTTOM_POSITION = '40px'

export default function PublishResponseAnswerLongPage() {
  const [isListening, setIsListening] = useState(false)

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 relative">
      {/* 상단 텍스트 */}
      <StateTextDisplay text={LONG_PAGE_TEXT} />

      {/* 하단 원 */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: VOICE_BUTTON_BOTTOM_POSITION }}>
        <VoiceButton
          isAnimating={true}
          scale={VOICE_BUTTON_SCALE}
          isListening={isListening}
          onClick={() => setIsListening(!isListening)}
        />
      </div>
    </div>
  )
}
