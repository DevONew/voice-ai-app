/**
 * 오디오 및 음성 인식 관련 상수
 */

export const AUDIO_CONFIG = {
  // STT (음성 인식) 설정
  SILENCE_THRESHOLD: 15, // 침묵 판단 음량 임계값 (0-100)
  SILENCE_DURATION: 1500, // 침묵 지속 시간 (ms)
  FFT_SIZE: 256, // 오디오 분석 해상도 (2^n)

  // TTS (음성 재생) 설정
  PLAYBACK_RATE: 1.2, // 재생 속도 배율
  TTS_DELAY: 200, // TTS 완료 후 재생 시작 지연 (ms)

  // 언어 감지 설정
  LANGUAGE_DETECTION_TIMEOUT: 2000, // 언어 감지 표시 시간 (ms)
} as const
