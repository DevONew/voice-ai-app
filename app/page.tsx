'use client'

import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AudioPlayer from './components/AudioPlayer'
import ResponseDisplay from './components/ResponseDisplay'
import VoiceButton from './components/VoiceButton'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
import { useVoiceRecorderStreaming } from './hooks/useVoiceRecorderStreaming'
import { useAppState } from './hooks/useAppState'
import { useAudioAPI } from './hooks/useAudioAPI'

export default function Home() {
  const {
    appState,
    responseText,
    conversationHistory,
    audioBlob,
    isAudioPlaying,
    setAppState,
    setDisplayText,
    setResponseText,
    setConversationHistory,
    setAudioBlob,
    setIsAudioPlaying,
  } = useAppState()

  const { handleChatAPI } = useAudioAPI()

  // STT 최종 결과를 받으면 Chat API를 백그라운드에서 호출
  const handleFinalTranscript = useCallback((finalText: string) => {
    console.log('📤 백그라운드에서 Chat API 호출:', finalText)

    // Promise로 호출 (기다리지 않음)
    handleChatAPI(finalText, conversationHistory, setConversationHistory)
      .then((aiResponse) => {
        console.log('✅ Chat API 응답 (백그라운드):', aiResponse)
        setResponseText(aiResponse)

        // Chat 응답이 나오면 speaking으로 전환
        setTimeout(() => {
          console.log('🎯 상태 변경: processing → speaking')
          setAppState('speaking')
        }, 500)
      })
      .catch((err) => {
        console.error('❌ Chat API 에러 (백그라운드):', err)
        setAppState('idle')
      })
  }, [conversationHistory, setConversationHistory, handleChatAPI, setAppState])

  const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder } = useVoiceRecorderStreaming(setAppState, undefined, handleFinalTranscript)

  // transcript 업데이트될 때 displayText도 업데이트
  useEffect(() => {
    if (appState === 'listening' && transcript) {
      setDisplayText(transcript)
    }
  }, [transcript, appState, setDisplayText])

  // 최종 결과가 나왔을 때 자동으로 처리 시작 (주석 처리 - 실시간 받아쓰기 기능 추가 후 활용)
  // useEffect(() => {
  //   if (isFinalTranscript && appState === 'listening' && transcript) {
  //     console.log('✅ 최종 음성 인식 완료:', transcript)
  //     console.log('🎯 상태 변경: listening → processing (자동)')
  //     resetRecorder()
  //     setAppState('processing')
  //   }
  // }, [isFinalTranscript, appState, transcript, setAppState, resetRecorder])

  const handleButtonClick = useCallback(async () => {
    if (appState === 'idle') {
      console.log('🎯 상태 변경: idle → listening')
      setAppState('listening')
      resetRecorder()
      setDisplayText('')

      try {
        await startRecording()
        console.log('🎤 음성 인식 시작')
      } catch (err) {
        console.error('❌ Recording error:', err)
        setAppState('idle')
      }
    } else if (appState === 'listening') {
      console.log('🎯 상태 변경: listening → processing (수동 중지)')
      await stopRecording()
      console.log('⏹️ 음성 인식 중지')
    } else if (appState === 'speaking' || appState === 'processing') {
      console.log('🎯 상태 변경: speaking/processing → listening')
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setResponseText('')

      try {
        await startRecording()
        console.log('🎤 음성 인식 시작')
      } catch (err) {
        console.error('❌ Recording error:', err)
        setAppState('idle')
      }
    }
  }, [appState, startRecording, stopRecording, resetRecorder, setAppState, setDisplayText, setResponseText])

  const handleAudioPlayEnd = useCallback(() => {
    console.log('⏹️ 음성 재생 완료')
    setIsAudioPlaying(false)

    // 2초 대기 후 자동 복귀
    console.log('⏳ 2초 대기 중...')
    setTimeout(() => {
      console.log('🎯 상태 변경: speaking → idle')
      setAppState('idle')
      setResponseText('')
      setDisplayText('')
      setAudioBlob(null)
      console.log('✅ 초기 상태로 복귀 완료')
    }, 2000)
  }, [setIsAudioPlaying, setAppState, setResponseText, setDisplayText, setAudioBlob])

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 overflow-hidden relative">
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
                onClick={handleButtonClick}
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
                onClick={handleButtonClick}
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
                onClick={handleButtonClick}
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
                onClick={handleButtonClick}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 음성 재생 컴포넌트 */}
      <AudioPlayer
        audioBlob={audioBlob}
        isPlaying={isAudioPlaying}
        onPlayEnd={handleAudioPlayEnd}
      />

      {/* 에러 메시지 표시 */}
      <ErrorDisplay error={error} />

      {/* 매우 하단 상태 인디케이터 */}
      <PulseIndicator isVisible={appState === 'listening'} />
    </div>
  )
}
