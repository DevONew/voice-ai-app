'use client'

import { useCallback, useEffect } from 'react'
import AudioPlayer from './components/AudioPlayer'
import ResponseDisplay from './components/ResponseDisplay'
import StatusText from './components/StatusText'
import VoiceButton from './components/VoiceButton'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
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
      setAppState('listening')
      resetRecorder()
      setDisplayText('')

      try {
        await startRecording()
      } catch (err) {
        console.error('Recording error:', err)
        setAppState('idle')
      }
    } else if (appState === 'listening') {
      await stopRecording()
      handleProcessing()
    }
  }, [appState, startRecording, stopRecording, resetRecorder, setAppState, setDisplayText])

  const handleProcessing = useCallback(async () => {
    if (!transcript) {
      setAppState('idle')
      return
    }

    setAppState('processing')

    try {
      // Chat API 호출 (현재는 비활성화)
      // const aiResponse = await handleChatAPI(transcript, conversationHistory, setConversationHistory)
      // setResponseText(aiResponse)

      // TTS API 호출 (현재는 비활성화)
      // const audio = await handleTTSAPI(aiResponse)
      // setAudioBlob(audio)

      // 음성 재생 시작 (현재는 비활성화)
      // setAppState('speaking')
      // setIsAudioPlaying(true)

      // STT만 사용 중이므로 다시 idle로
      setAppState('idle')
    } catch (err) {
      console.error('Processing error:', err)
      setAppState('idle')
    }
  }, [transcript, setAppState])

  const handleAudioPlayEnd = useCallback(() => {
    setIsAudioPlaying(false)
    setAppState('idle')
    setResponseText('')
    setDisplayText('')
    setAudioBlob(null)
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
        className="flex-1 flex items-center justify-center transition-all duration-500"
        style={{
          transform: appState === 'speaking' ? 'translateY(80px)' : 'translateY(0)',
        }}
      >
        <div className="relative">
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
