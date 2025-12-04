/**
 * Audio Context 싱글톤 관리
 * 전역 AudioContext 인스턴스를 하나만 유지하여
 * 메모리 누수를 방지하고 배터리 소비를 최소화
 */

let audioContextInstance: AudioContext | null = null

/**
 * 전역 AudioContext 인스턴스 가져오기
 * 처음 호출 시 생성, 이후는 동일한 인스턴스 반환
 */
export function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    // 브라우저 호환성: webkit 접두사 지원
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    audioContextInstance = new AudioContextClass() as AudioContext
    console.log('🎵 AudioContext 싱글톤 생성됨')
  }

  return audioContextInstance
}

/**
 * AudioContext 상태 확인
 */
export function getAudioContextState(): string {
  if (!audioContextInstance) {
    return 'not-created'
  }
  return audioContextInstance.state
}

/**
 * AudioContext 리소스 정리 (필요시)
 * 앱 종료 시 호출 가능하지만, 일반적으로 필요 없음
 */
export async function closeAudioContext(): Promise<void> {
  if (audioContextInstance) {
    await audioContextInstance.close()
    audioContextInstance = null
    console.log('🔌 AudioContext 닫힘')
  }
}
