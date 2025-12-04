/**
 * UI 관련 상수
 */

export const UI_CONFIG = {
  // 텍스트 애니메이션
  TYPEWRITER_SPEED: 30, // 타이핑 애니메이션 간격 (ms)

  // 음량 표시 (PulseIndicator)
  VOLUME_THRESHOLDS: [15, 30, 45, 60, 75] as const, // 음량 단계별 임계값
  VOLUME_SIZE_CLASSES: ['w-1 h-1', 'w-2 h-2', 'w-3 h-3', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6'] as const,
} as const
