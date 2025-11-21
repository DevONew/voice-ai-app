export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  isFinal: boolean
}

export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
