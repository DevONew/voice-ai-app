'use client'

import { useState } from 'react'
import PulseIndicator from '../../components/PulseIndicator'

export default function PulseIndicatorTestPage() {
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-8 gap-8">
      <h1 className="text-3xl font-bold">PulseIndicator 테스트</h1>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="text-lg font-semibold mb-2 block">
            음량 레벨: {volumeLevel}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={volumeLevel}
            onChange={(e) => setVolumeLevel(Number(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="visibility"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="visibility" className="text-lg">
            표시
          </label>
        </div>
      </div>

      <div className="border-2 border-gray-300 rounded-lg p-8 bg-gray-50">
        <PulseIndicator isVisible={isVisible} volumeLevel={volumeLevel} />
      </div>

      <div className="text-sm text-gray-500 mt-4">
        💡 슬라이더를 움직여서 원의 크기 변화를 확인하세요
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
        <p className="font-semibold mb-2">크기 기준:</p>
        <div className="space-y-1 text-gray-700">
          <p>0-15: w-1</p>
          <p>15-30: w-2</p>
          <p>30-45: w-3</p>
          <p>45-60: w-4</p>
          <p>60-75: w-5</p>
          <p>75-100: w-6</p>
        </div>
      </div>
    </div>
  )
}
