/**
 * TTS 응답 캐싱 유틸리티
 * 동일한 텍스트에 대한 TTS 결과를 메모리에 캐시하여
 * 불필요한 API 호출을 줄임
 */

interface CacheEntry {
  blob: Blob
  timestamp: number
}

// 최대 캐시 크기 (50개 응답)
const MAX_CACHE_SIZE = 50

// 캐시 저장소
const ttsCache = new Map<string, CacheEntry>()

/**
 * 텍스트를 간단한 해시로 변환
 * SHA 없이 빠른 문자열 해시 사용
 */
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * 캐시에서 TTS 결과 조회
 */
export function getTTSFromCache(text: string): Blob | null {
  const hash = hashText(text)
  const entry = ttsCache.get(hash)

  if (entry) {
    console.log(`✅ TTS 캐시 히트: ${text.substring(0, 30)}...`)
    // 타임스탬프 업데이트 (LRU 제거 시 고려)
    entry.timestamp = Date.now()
    return entry.blob
  }

  return null
}

/**
 * TTS 결과를 캐시에 저장
 */
export function setTTSToCache(text: string, audioBlob: Blob): void {
  // 캐시 크기 제한 확인
  if (ttsCache.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목 제거 (LRU)
    const oldestKey = Array.from(ttsCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
    ttsCache.delete(oldestKey)
    console.log('🗑️ 오래된 TTS 캐시 제거')
  }

  const hash = hashText(text)
  ttsCache.set(hash, {
    blob: audioBlob,
    timestamp: Date.now(),
  })
  console.log(`💾 TTS 캐시 저장: ${text.substring(0, 30)}... (전체: ${ttsCache.size}/${MAX_CACHE_SIZE})`)
}

/**
 * 캐시 초기화 (개발용)
 */
export function clearTTSCache(): void {
  ttsCache.clear()
  console.log('🧹 TTS 캐시 초기화됨')
}

/**
 * 캐시 상태 확인 (개발용)
 */
export function getTTSCacheStats(): { size: number; maxSize: number } {
  return {
    size: ttsCache.size,
    maxSize: MAX_CACHE_SIZE,
  }
}
