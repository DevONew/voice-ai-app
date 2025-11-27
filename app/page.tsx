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
    conversationHistory,
    audioBlob,
    isAudioPlaying,
    currentLanguage,
    setAppState,
    setDisplayText,
    setResponseText,
    setConversationHistory,
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
  })

  // STT 훅
  const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder } = useVoiceRecorderStreaming(setAppState, undefined, handleFinalTranscript, currentLanguage)

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
      <StateViews
        appState={appState}
        transcript={transcript}
        responseText={responseText}
        volumeLevel={volumeLevel}
        onButtonClick={handleButtonClick}
      />

      <AudioPlayer
        audioBlob={audioBlob}
        isPlaying={isAudioPlaying}
        onPlayEnd={handleAudioPlayEnd}
      />

      <ErrorDisplay error={error} />

      <PulseIndicator isVisible={appState === 'listening'} />
    </div>
  )
}
