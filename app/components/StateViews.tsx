'use client'

import { motion, AnimatePresence } from 'framer-motion'
import VoiceButton from './VoiceButton'
import ResponseDisplay from './ResponseDisplay'

interface StateViewsProps {
  appState: 'idle' | 'listening' | 'processing' | 'speaking'
  transcript: string
  responseText: string
  volumeLevel: number
  onButtonClick: () => void | Promise<void>
}

/**
 * 앱 상태별 UI 렌더링 컴포넌트
 */
export function StateViews({
  appState,
  transcript,
  responseText,
  volumeLevel,
  onButtonClick,
}: StateViewsProps) {
  return (
    <AnimatePresence mode="wait">
      {/* idle 상태: 퍼블리싱 페이지처럼 표시 */}
      {appState === 'idle' && (
        <div
          key="idle"
          className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4"
        >
          <div className="flex flex-col items-center gap-[35px]">
            <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">탭하여 시작</p>
            <VoiceButton
              isAnimating={false}
              isListening={false}
              size={200}
              onClick={onButtonClick}
            />
          </div>
        </div>
      )}

      {/* listening 상태: 음성 인식 중 */}
      {appState === 'listening' && (
        <div
          key="listening"
          className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4"
        >
          <div className="flex flex-col items-center gap-[35px]">
            <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">
              {transcript || '듣는중'}
            </p>
            <VoiceButton
              isAnimating={true}
              scale={Math.min(0.8 + (volumeLevel / 100) * 0.3, 1.1)}
              isListening={true}
              size={200}
              onClick={onButtonClick}
            />
          </div>
        </div>
      )}

      {/* processing 상태: 생각하는 중 */}
      {appState === 'processing' && (
        <motion.div
          key="processing"
          className="w-full h-screen bg-white flex items-center justify-center px-[20px] py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-[35px]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-500">생각하는 중..</p>
            <VoiceButton
              isAnimating={false}
              isListening={false}
              size={200}
              onClick={onButtonClick}
            />
          </motion.div>
        </motion.div>
      )}

      {/* speaking 상태: 답변 표시 */}
      {appState === 'speaking' && responseText && (
        <motion.div
          key="speaking"
          className="w-full h-screen bg-white flex flex-col items-center justify-center p-4 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-full px-[20px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ResponseDisplay text={responseText} isVisible={true} />
          </motion.div>
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ bottom: '40px' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <VoiceButton
              isAnimating={false}
              isListening={false}
              size={80}
              onClick={onButtonClick}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
