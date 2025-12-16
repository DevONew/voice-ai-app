'use client'

import { useCallback, useEffect, useState } from 'react'
import AudioPlayer from './components/AudioPlayer'
import ErrorDisplay from './components/ErrorDisplay'
import PulseIndicator from './components/PulseIndicator'
import { StateViews } from './components/StateViews'
import PasswordModal from './components/PasswordModal'
import { useVoiceRecorderStreaming } from './hooks/useVoiceRecorderStreaming'
import { useAppState } from './hooks/useAppState'
import { useChatHandler } from './hooks/useChatHandler'
import { isIOSSafari } from './utils/platform-detect'
import { checkUsageLimit, incrementUsage } from './utils/usage-limit'

export default function Home() {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
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
      console.log('🔇 speaking 상태: 마이크 녹음 중지')
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
    // 사용 제한 체크 (idle 상태에서만)
    if (appState === 'idle') {
      const { allowed, remaining } = checkUsageLimit()

      if (!allowed) {
        console.log('🚫 사용 제한 도달 - 모달 표시')
        setShowPasswordModal(true)
        return
      }

      console.log(`✅ 사용 가능 (남은 횟수: ${remaining})`)
      incrementUsage()
    }

    // iOS Safari에서만 오디오 재생을 위한 초기화 (사용자 제스처 필요)
    if (typeof window !== 'undefined' && isIOSSafari()) {
      try {
        // AudioContext 초기화 (있다면)
        if (window.AudioContext || (window as any).webkitAudioContext) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          const audioContext = new AudioContextClass()

          if (audioContext.state === 'suspended') {
            await audioContext.resume()
            console.log('🔊 AudioContext 활성화 (iOS Safari 대응)')
          }

          // iOS에서 무음 재생으로 오디오 시스템 깨우기
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          gainNode.gain.value = 0.001 // 거의 무음
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.001)

          console.log('✅ iOS 오디오 시스템 활성화 완료')
        }
      } catch (err) {
        console.log('⚠️ AudioContext 초기화 실패 (무시 가능):', err)
      }
    }

    if (appState === 'idle') {
      console.log('🎯 상태 변경: idle → listening')
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setErrorMessage('')

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
      setErrorMessage('')

      try {
        await startRecording()
        console.log('🎤 음성 인식 시작')
      } catch (err) {
        console.error('❌ Recording error:', err)
        setAppState('idle')
      }
    } else if (appState === 'error') {
      console.log('🎯 상태 변경: error → listening')
      setAppState('listening')
      resetRecorder()
      setDisplayText('')
      setResponseText('')
      setErrorMessage('')

      try {
        await startRecording()
        console.log('🎤 음성 인식 시작')
      } catch (err) {
        console.error('❌ Recording error:', err)
        setAppState('idle')
      }
    }
  }, [appState, startRecording, stopRecording, resetRecorder, setAppState, setDisplayText, setResponseText, setErrorMessage])

  const handleAudioPlayEnd = useCallback(() => {
    console.log('⏹️ 음성 재생 완료')
    setIsAudioPlaying(false)
    // 자동 복귀하지 않음 - 사용자가 버튼으로 다음 동작 선택
  }, [setIsAudioPlaying])

  const handlePasswordSuccess = useCallback(() => {
    console.log('✅ 비밀번호 인증 성공 - 무제한 사용 가능')
    setShowPasswordModal(false)
  }, [])

  const handlePasswordClose = useCallback(() => {
    console.log('❌ 모달 닫힘 - 더 이상 사용 불가')
    setShowPasswordModal(false)
  }, [])

  return (
    <div 
      className="w-full bg-white flex flex-col items-center overflow-hidden relative"
      style={{
        height: '100dvh', // iOS에서 더 정확한 뷰포트 높이
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', // 하단 Safe Area 고려
        boxSizing: 'border-box',
      }}
    >
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

      <PasswordModal
        isOpen={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        onClose={handlePasswordClose}
      />
    </div>
  )
}
