'use client'

import { useCallback, useEffect } from 'react'
import AudioPlayer from './components/AudioPlayer'
import ResponseDisplay from './components/ResponseDisplay'
import StatusText from './components/StatusText'
import VoiceButton from './components/VoiceButton'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
import ChatContainer from './components/ChatContainer'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import { useAppState } from './hooks/useAppState'
import { useAudioAPI } from './hooks/useAudioAPI'

export default function Home() {
  const {
    appState,
    displayText,
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
    getStatusText,
  } = useAppState()

  const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder } = useVoiceRecorder()
  const { handleChatAPI, handleTTSAPI } = useAudioAPI()

  // transcript 업데이트될 때 displayText도 업데이트
  useEffect(() => {
    if (appState === 'listening' && transcript) {
      setDisplayText(transcript)
      console.log('📝 음성 인식:', transcript)
    }
  }, [transcript, appState, setDisplayText])

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
      console.log('🎯 상태 변경: listening → processing')
      await stopRecording()
      console.log('⏹️ 음성 인식 중지')
      handleProcessing()
    }
  }, [appState, startRecording, stopRecording, resetRecorder, setAppState, setDisplayText])

  const handleProcessing = useCallback(async () => {
    if (!transcript) {
      console.log('⚠️ transcript 없음, idle 상태로 복귀')
      setAppState('idle')
      return
    }

    console.log('🎯 상태 변경: listening → processing')
    console.log('📤 사용자 메시지 전송:', transcript)
    setAppState('processing')

    try {
      // Chat API 호출
      console.log('🔗 Chat API 호출 중...')
      const aiResponse = await handleChatAPI(transcript, conversationHistory, setConversationHistory)
      setResponseText(aiResponse)
      console.log('✅ AI 응답 수신:', aiResponse)
      console.log('💬 대화 히스토리 업데이트 완료, 총 메시지 수:', conversationHistory.length + 2)

      // TTS API 호출
      console.log('🔗 TTS API 호출 중...')
      const audioBlob = await handleTTSAPI(aiResponse)
      console.log('✅ 음성 파일 수신, 크기:', audioBlob.size, 'bytes')
      setAudioBlob(audioBlob)
      console.log('🔊 음성 생성 완료, 재생 준비')

      // 응답 상태로 전환
      console.log('🎯 상태 변경: processing → speaking')
      setAppState('speaking')
      setIsAudioPlaying(true)
      console.log('▶️ 음성 재생 시작')
    } catch (err) {
      console.error('❌ Processing error:', err)
      setAppState('idle')
    }
  }, [transcript, setAppState, handleChatAPI, handleTTSAPI, conversationHistory, setConversationHistory, setResponseText, setAudioBlob, setIsAudioPlaying])

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
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 상단 상태 텍스트 또는 받아쓰기 텍스트 */}
      <div
        className="flex-1 flex items-end justify-center overflow-y-auto max-h-[40vh] pb-4"
        style={{
          marginBottom: appState === 'listening' && displayText ? '8px' : '24px',
        }}
      >
        {appState === 'listening' && displayText ? (
          <ResponseDisplay text={displayText} isVisible={true} />
        ) : (
          <StatusText text={getStatusText(appState, displayText, responseText)} isActive={appState !== 'idle'} />
        )}
      </div>

      {/* 중앙 마이크 버튼 */}
      <div
        className="flex-1 flex items-center justify-center transition-all duration-500 relative"
        style={{
          transform: appState === 'speaking' ? 'translateY(80px)' : 'translateY(0)',
        }}
      >
        {/* 채팅 컨테이너 */}
        <ChatContainer
          messages={conversationHistory}
          isVisible={appState === 'speaking'}
          isTyping={appState === 'speaking'}
        />

        {/* 마이크 버튼 */}
        <div className="relative z-10">
          <VoiceButton
            isAnimating={appState === 'listening'}
            scale={appState === 'listening' ? 0.8 + (volumeLevel / 100) * 0.5 : 1}
            isListening={appState === 'listening'}
            onClick={handleButtonClick}
          />
        </div>
      </div>

      {/* 하단 텍스트 표시 영역 */}
      <div className="flex-1 flex items-start justify-center pt-4 px-4">
        {appState === 'processing' && displayText && (
          <ResponseDisplay text={displayText} isVisible={true} />
        )}
        {appState === 'speaking' && responseText && (
          <ResponseDisplay text={responseText} isVisible={true} />
        )}
      </div>

      {/* 음성 재생 컴포넌트 */}
      <AudioPlayer
        audioBlob={audioBlob}
        isPlaying={isAudioPlaying}
        onPlayStart={() => {}}
        onPlayEnd={handleAudioPlayEnd}
        onVolumeChange={() => {}}
      />

      {/* 에러 메시지 표시 */}
      <ErrorDisplay error={error} />

      {/* 매우 하단 상태 인디케이터 */}
      <PulseIndicator isVisible={appState === 'listening'} />
    </div>
  )
}
