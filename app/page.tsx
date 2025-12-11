'use client'

import { useCallback, useEffect } from 'react'
import AudioPlayer from './components/AudioPlayer'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
import { StateViews } from './components/StateViews'
import { useVoiceRecorderStreaming } from './hooks/useVoiceRecorderStreaming'
import { useAppState } from './hooks/useAppState'
import { useChatHandler } from './hooks/useChatHandler'

export default function Home() {
  const {
    appState,
    responseText,
    errorMessage,
    conversationHistory,
    audioBlob,
    isAudioPlaying,
    currentLanguage,
    setAppState,
    setDisplayText,
    setResponseText,
    setErrorMessage,
    setAudioBlob,
    setIsAudioPlaying,
    setCurrentLanguage,
  } = useAppState()

  // Chat API 및 언어 감지 핸들러
  const { handleFinalTranscript } = useChatHandler({
    conversationHistory,
    onResponseReceived: setResponseText,
    onStateChange: setAppState,
    onLanguageDetected: setCurrentLanguage,
    onError: () => setAppState('idle'),
    onAudioGenerated: setAudioBlob,
    onPlayStart: () => setIsAudioPlaying(true),
  })

  // STT 훅 - onError 콜백을 추가해서 에러 메시지를 화면에 표시
  const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder } = useVoiceRecorderStreaming(
    setAppState,
    undefined,
    handleFinalTranscript,
    currentLanguage,
    (errorMsg: string) => {
      setErrorMessage(errorMsg)
      setAppState('error')
    }
  )

  // transcript 업데이트될 때 displayText도 업데이트
  useEffect(() => {
    if (appState === 'listening' && transcript) {
      setDisplayText(transcript)
    }
  }, [transcript, appState, setDisplayText])

  // speaking 상태일 때 마이크 녹음 중지 (오디오 피드백 방지)
  useEffect(() => {
    if (appState === 'speaking') {
      stopRecording()
    }
  }, [appState, stopRecording])

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
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setErrorMessage('')

      try {
        await startRecording()
      } catch (err) {
        setAppState('idle')
      }
    } else if (appState === 'listening') {
      await stopRecording()
    } else if (appState === 'speaking' || appState === 'processing') {
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setResponseText('')
      setErrorMessage('')

      try {
        await startRecording()
      } catch (err) {
        setAppState('idle')
      }
    } else if (appState === 'error') {
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setResponseText('')
      setErrorMessage('')

      try {
        await startRecording()
      } catch (err) {
        setAppState('idle')
      }
    }
  }, [appState, startRecording, stopRecording, resetRecorder, setAppState, setDisplayText, setResponseText, setErrorMessage])

  const handleAudioPlayEnd = useCallback(() => {
    setIsAudioPlaying(false)
    // 자동 복귀하지 않음 - 사용자가 버튼으로 다음 동작 선택
  }, [setIsAudioPlaying])

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center p-4 overflow-hidden relative">
      <StateViews
        appState={appState}
        transcript={transcript}
        responseText={responseText}
        errorMessage={errorMessage}
        volumeLevel={volumeLevel}
        onButtonClick={handleButtonClick}
      />

      <AudioPlayer
        audioBlob={audioBlob}
        isPlaying={isAudioPlaying}
        onPlayEnd={handleAudioPlayEnd}
      />

      <ErrorDisplay error={error} />

      <PulseIndicator isVisible={appState === 'listening'} volumeLevel={volumeLevel} />
    </div>
  )
}
