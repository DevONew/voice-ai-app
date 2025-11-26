'use client'

import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AudioPlayer from './components/AudioPlayer'
import ResponseDisplay from './components/ResponseDisplay'
import VoiceButton from './components/VoiceButton'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
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

  const { transcript, volumeLevel, error, isFinalTranscript, startRecording, stopRecording, resetRecorder } = useVoiceRecorder()
  const { handleChatAPI } = useAudioAPI()

  // transcript 업데이트될 때 displayText도 업데이트
  useEffect(() => {
    if (appState === 'listening' && transcript) {
      setDisplayText(transcript)
    }
  }, [transcript, appState, setDisplayText])

  // 최종 결과가 나왔을 때 자동으로 처리 시작
  useEffect(() => {
    if (isFinalTranscript && appState === 'listening' && transcript) {
      console.log('✅ 최종 음성 인식 완료:', transcript)
      setTimeout(async () => {
        await stopRecording()
        setAppState('processing')
      }, 500)
    }
  }, [isFinalTranscript, appState, transcript, stopRecording, setAppState])

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

  const handleProcessing = useCallback(async () => {
    if (!transcript) {
      console.log('⚠️ transcript 없음, idle 상태로 복귀')
      setAppState('idle')
      return
    }

    console.log('📤 사용자 메시지 전송:', transcript)

    try {
      // Chat API 호출
      console.log('🔗 Chat API 호출 중...')
      const aiResponse = await handleChatAPI(transcript, conversationHistory, setConversationHistory)
      setResponseText(aiResponse)
      console.log('✅ AI 응답 수신:', aiResponse)
      console.log('💬 대화 히스토리 업데이트 완료, 총 메시지 수:', conversationHistory.length + 2)

      // TTS API 호출 (임시 주석 처리)
      // console.log('🔗 TTS API 호출 중...')
      // const audioBlob = await handleTTSAPI(aiResponse)
      // console.log('✅ 음성 파일 수신, 크기:', audioBlob.size, 'bytes')
      // setAudioBlob(audioBlob)
      // console.log('🔊 음성 생성 완료, 재생 준비')

      // 응답 상태로 전환
      console.log('🎯 상태 변경: processing → speaking')
      setAppState('speaking')
      // setIsAudioPlaying(true)
      // console.log('▶️ 음성 재생 시작')
    } catch (err) {
      console.error('❌ Processing error:', err)
      setAppState('idle')
    }
  }, [transcript, setAppState, handleChatAPI, conversationHistory, setConversationHistory, setResponseText])

  // processing 상태일 때 API 호출
  useEffect(() => {
    if (appState === 'processing' && transcript) {
      handleProcessing()
    }
  }, [appState, transcript, handleProcessing])

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
                isAnimating={true}
                scale={0.8}
                isListening={false}
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
                isAnimating={true}
                scale={0.8}
                isListening={false}
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
                isAnimating={true}
                scale={0.4}
                isListening={false}
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
