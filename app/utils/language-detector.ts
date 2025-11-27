// 언어 코드 매핑
export const LANGUAGE_MAP: { [key: string]: string } = {
  '프랑스': 'fr',
  '프랑스어': 'fr',
  'france': 'fr',
  'french': 'fr',
  '일본': 'ja',
  '일본어': 'ja',
  'japan': 'ja',
  'japanese': 'ja',
  '스페인': 'es',
  '스페인어': 'es',
  'spain': 'es',
  'spanish': 'es',
  '독일': 'de',
  '독일어': 'de',
  'germany': 'de',
  'german': 'de',
  '이탈리아': 'it',
  '이탈리아어': 'it',
  'italy': 'it',
  'italian': 'it',
  '중국': 'zh',
  '중국어': 'zh',
  '중문': 'zh',
  'china': 'zh',
  'chinese': 'zh',
  '베트남': 'vi',
  '베트남어': 'vi',
  'vietnam': 'vi',
  'vietnamese': 'vi',
  '태국': 'th',
  '태국어': 'th',
  'thailand': 'th',
  'thai': 'th',
}

/**
 * 사용자 입력에서 언어 감지
 * @param text - 사용자 입력 텍스트
 * @returns 감지된 언어 코드 또는 undefined
 */
export function detectLanguage(text: string): string | undefined {
  const lowerText = text.toLowerCase()

  for (const [key, code] of Object.entries(LANGUAGE_MAP)) {
    if (lowerText.includes(key)) {
      return code
    }
  }

  return undefined
}
