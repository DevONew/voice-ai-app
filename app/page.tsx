'use client'

import { useCallback, useRef, useState } from 'react'
import AudioPlayer from './components/AudioPlayer'
import ResponseDisplay from './components/ResponseDisplay'
import StatusText from './components/StatusText'
import VoiceButton from './components/VoiceButton'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'

type AppState = 'idle' | 'listening' | 'processing' | 'speaking'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [responseText, setResponseText] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [displayText, setDisplayText] = useState('')

  const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder } = useVoiceRecorder()

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getStatusText = () => {
    switch (appState) {
      case 'idle':
        return '탭하여 시작'
      case 'listening':
        return transcript || '듣는 중...'
      case 'processing':
        return '생각하는 중...'
      case 'speaking':
        return responseText
      default:
        return '탭하여 시작'
    }
  }

  const handleChatAPI = useCallback(
    async (userMessage: string) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory,
          }),
        })

        if (!response.ok) throw new Error('Chat API 실패')

        const data = await response.json()
        const assistantMessage = data.response

        // 대화 히스토리 업데이트
        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: userMessage },
          { role: 'assistant' as const, content: assistantMessage },
        ]
        setConversationHistory(newHistory)

        return assistantMessage
      } catch (err) {
        console.error('Chat error:', err)
        throw err
      }
    },
    [conversationHistory]
  )

  const handleTTSAPI = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('TTS API 실패')

      const audioData = await response.blob()
      return audioData
    } catch (err) {
      console.error('TTS error:', err)
      throw err
    }
  }, [])

  const handleButtonClick = useCallback(async () => {
    if (appState === 'idle') {
      // 음성 인식 시작
      setAppState('listening')
      resetRecorder()
      setDisplayText('')

      try {
        await startRecording()

        // 10초 후 자동 중지
        recordingTimeoutRef.current = setTimeout(async () => {
          await stopRecording()
          handleProcessing()
        }, 10000)
      } catch (err) {
        console.error('Recording error:', err)
        setAppState('idle')
      }
    } else if (appState === 'listening') {
      // 녹음 중지
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
      await stopRecording()
      handleProcessing()
    }
  }, [appState, startRecording, stopRecording, resetRecorder])

  const handleProcessing = useCallback(async () => {
    if (!transcript) {
      setAppState('idle')
      return
    }

    setAppState('processing')
    setDisplayText(transcript)

    try {
      // Chat API 호출
      const aiResponse = await handleChatAPI(transcript)
      setResponseText(aiResponse)

      // TTS API 호출
      const audio = await handleTTSAPI(aiResponse)
      setAudioBlob(audio)

      // 음성 재생 시작
      setAppState('speaking')
      setIsAudioPlaying(true)
    } catch (err) {
      console.error('Processing error:', err)
      setAppState('idle')
    }
  }, [transcript, handleChatAPI, handleTTSAPI])

  const handleAudioPlayEnd = useCallback(() => {
    setIsAudioPlaying(false)
    setAppState('idle')
    setResponseText('')
    setDisplayText('')
    setAudioBlob(null)
  }, [])

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 상단 상태 텍스트 */}
      <div className="flex-1 flex items-end justify-center mb-12">
        <StatusText text={getStatusText()} isActive={appState !== 'idle'} />
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
            scale={appState === 'listening' ? 0.85 + (volumeLevel / 100) * 0.3 : 1}
            isListening={appState === 'listening'}
            onClick={handleButtonClick}
          />
        </div>
      </div>

      {/* 하단 텍스트 표시 영역 */}
      <div className="flex-1 flex items-start justify-center pt-4 px-4">
        {appState === 'listening' && displayText && (
          <ResponseDisplay text={displayText} isVisible={true} />
        )}
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
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* 매우 하단 상태 인디케이터 */}
      {appState === 'listening' && (
        <div className="pb-6">
          <div className="flex gap-1 justify-center">
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
    </div>
  )
}
