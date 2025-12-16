// app/utils/usage-limit.ts

const MAX_FREE_USES = 5;
const STORAGE_KEY = 'voice_app_usage_count';
const AUTH_KEY = 'voice_app_authenticated';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'mypassword123';

/**
 * 사용자 인증 상태 확인
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

/**
 * 비밀번호 검증
 */
export function verifyPassword(password: string): boolean {
  const isValid = password === OWNER_PASSWORD;
  if (isValid && typeof window !== 'undefined') {
    sessionStorage.setItem(AUTH_KEY, 'true');
  }
  return isValid;
}

/**
 * 인증 해제
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_KEY);
}

/**
 * 사용 제한 확인
 */
export function checkUsageLimit(): { allowed: boolean; remaining: number; isAuthenticated: boolean } {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: MAX_FREE_USES, isAuthenticated: false };
  }
  
  // 인증된 사용자는 무제한
  const authenticated = isAuthenticated();
  if (authenticated) {
    return { allowed: true, remaining: 999, isAuthenticated: true };
  }

  // 미인증 사용자는 제한 확인
  const usageData = localStorage.getItem(STORAGE_KEY);
  const currentCount = usageData ? parseInt(usageData, 10) : 0;
  const remaining = MAX_FREE_USES - currentCount;
  
  return {
    allowed: currentCount < MAX_FREE_USES,
    remaining: Math.max(0, remaining),
    isAuthenticated: false,
  };
}

/**
 * 사용 횟수 증가
 */
export function incrementUsage(): void {
  if (typeof window === 'undefined') return;
  
  // 인증된 사용자는 카운트 안 함
  if (isAuthenticated()) return;

  const usageData = localStorage.getItem(STORAGE_KEY);
  const currentCount = usageData ? parseInt(usageData, 10) : 0;
  localStorage.setItem(STORAGE_KEY, (currentCount + 1).toString());
  
  console.log(`📊 사용 횟수: ${currentCount + 1}/${MAX_FREE_USES}`);
}

/**
 * 사용 횟수 리셋 (개발/테스트용)
 */
export function resetUsage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  console.log('🔄 사용 횟수 리셋됨');
}

/**
 * 현재 사용 횟수 조회
 */
export function getCurrentUsage(): number {
  if (typeof window === 'undefined') return 0;
  if (isAuthenticated()) return 0;
  
  const usageData = localStorage.getItem(STORAGE_KEY);
  return usageData ? parseInt(usageData, 10) : 0;
}
