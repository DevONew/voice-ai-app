/**
 * 텍스트를 문장 단위로 분리하는 유틸리티
 * 한국어, 영어, 일본어 등 다국어 지원
 */

/**
 * 텍스트를 문장 단위로 분리
 * 마침표, 느낌표, 물음표, 개행 등을 기준으로 분리
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // 정규표현식으로 문장 분리
  // 마침표(.), 느낌표(!), 물음표(?)를 기준으로 분리
  // 개행(\n)도 문장 경계로 처리
  const sentences = text
    .split(/(?<=[.!?。!？\n])\s*/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim())

  // 마지막 문장이 구두점으로 끝나지 않으면 유지
  return sentences
}

/**
 * 문장 리스트가 유효한지 확인
 */
export function isValidSentenceList(sentences: string[]): boolean {
  return Array.isArray(sentences) && sentences.length > 0 && sentences.every((s) => typeof s === 'string')
}

/**
 * 디버그용: 분리된 문장 출력
 */
export function debugSentences(text: string): void {
  const sentences = splitIntoSentences(text)
  console.log(`📝 문장 분리 결과 (총 ${sentences.length}개):`)
  sentences.forEach((sentence, index) => {
    console.log(`  ${index + 1}. "${sentence}"`)
  })
}
