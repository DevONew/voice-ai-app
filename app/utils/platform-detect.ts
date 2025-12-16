/**
 * iOS/Safari 플랫폼 감지 유틸리티
 */

/**
 * iOS 기기(iPhone, iPad, iPod)인지 확인
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua)

  // iOS 13+ iPad는 desktop user agent를 사용하므로 추가 체크
  const isIPadOS = ua.includes('Mac') && 'ontouchend' in document

  return isIOSDevice || isIPadOS
}

/**
 * Safari 브라우저인지 확인 (iOS Safari 포함)
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  const isSafariBrowser = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)

  return isSafariBrowser
}

/**
 * iOS Safari인지 확인 (가장 제한적인 플랫폼)
 */
export const isIOSSafari = (): boolean => {
  return isIOS() && isSafari()
}

/**
 * 모바일 기기인지 확인
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}
