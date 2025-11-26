'use client'

import { useState } from 'react'
import VoiceButton from '../../../../components/VoiceButton'
import PublishTextDisplay from '../../../../components/PublishTextDisplay'

const longText = `이탈리아 여행 가시면 반드시 알아야 할 문장 딱 3개만 소개해드릴게요.

'Quanto costa?' - 얼마예요?
'Dov'è il bagno?' - 화장실이 어디예요?
'Un caffè, per favore' - 커피 한 잔 주세요.

이 세 개만 알아도 정말 유용할 거예요!`

export default function PublishResponseAnswerLongPage() {
  const [isListening, setIsListening] = useState(false)

  const handleButtonClick = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 relative">
      {/* 상단 텍스트 */}
      <PublishTextDisplay text={longText} />

      {/* 하단 원 */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '40px' }}>
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
