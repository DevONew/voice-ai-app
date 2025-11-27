# 대화 히스토리 지속성 문제 (Conversation History Persistence Issue)

## 문제 설명

사용자가 AI와 대화한 후 페이지를 새로고침하면 대화 히스토리가 초기화되는 현상 발생.

예상 동작: 대화 히스토리가 localStorage에 저장되어 유지되어야 함
실제 동작: 페이지 새로고침 시 대화 히스토리가 초기화됨

---

## 현재 구현 상태

### 1. useAppState.ts의 localStorage 로직

```typescript
// 초기화 시 localStorage에서 로드
useEffect(() => {
  if (typeof window === 'undefined') return // SSR 환경 체크

  try {
    const saved = localStorage.getItem('conversationHistory')
    console.log('📖 localStorage에서 로드:', saved)
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('✅ 대화 히스토리 복원됨:', parsed)
      setConversationHistoryState(parsed)
    }
  } catch (err) {
    console.error('대화 히스토리 로드 실패:', err)
  }
  setIsLoaded(true)
}, [])

// 대화 히스토리 업데이트 시 저장
const setConversationHistory = useCallback((history: ConversationHistory) => {
  console.log('💾 대화 히스토리 업데이트:', history)
  setConversationHistoryState(history)
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('conversationHistory', JSON.stringify(history))
      console.log('✅ localStorage에 저장됨')
    }
  } catch (err) {
    console.error('대화 히스토리 저장 실패:', err)
  }
}, [])
```

### 2. useAudioAPI.ts의 Chat API 호출

```typescript
const handleChatAPI = useCallback(
  async (userMessage: string, conversationHistory: ConversationHistory, setConversationHistory: (history: ConversationHistory) => void) => {
    // ...
    const newHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantMessage },
    ]
    setConversationHistory(newHistory)  // ← 여기서 업데이트
    return assistantMessage
  },
  [] // 의존성 배열
)
```

---

## 가능한 원인들

### 원인 1: 의존성 배열 문제
- `handleChatAPI`가 매번 재생성되면 `useVoiceRecorderStreaming`도 재생성
- 이로 인해 상태가 리셋될 수 있음

### 원인 2: hydration 미스매치
- SSR에서 렌더링한 HTML과 클라이언트에서 렌더링한 HTML이 다름
- Next.js 초기 렌더링 시 localStorage 접근 불가능

### 원인 3: 콜백 타이밍 문제
- Chat API 호출 후 `setConversationHistory` 호출 전에 페이지가 새로고침될 수 있음
- 비동기 처리가 완료되지 않은 상태에서 저장되지 않을 수 있음

### 원인 4: useCallback 의존성 누락
- `setConversationHistory`를 `useCallback`의 의존성에 포함하지 않으면
- 함수가 최신 상태를 반영하지 못할 수 있음

---

## 디버깅 방법

### 1. 브라우저 개발자 도구에서 확인

**F12 → Application → Local Storage**

저장되어야 할 데이터:
```json
{
  "conversationHistory": [
    { "role": "user", "content": "안녕하세요" },
    { "role": "assistant", "content": "안녕하세요, 어떻게 도와드릴까요?" }
  ]
}
```

### 2. 콘솔 로그 확인

**F12 → Console**

다음 로그를 확인:
- `📖 localStorage에서 로드: ...` - 페이지 로드 시
- `💾 대화 히스토리 업데이트: ...` - 새 대화 추가 시
- `✅ localStorage에 저장됨` - 저장 완료 시

### 3. 네트워크 요청 확인

**F12 → Network**

- `/api/chat` 요청이 성공했는지 확인
- Chat API 응답에 올바른 텍스트가 포함되었는지 확인

---

## 현재 상황

### 구현된 기능
- ✅ localStorage 로드 로직 (useEffect)
- ✅ localStorage 저장 로직 (setConversationHistory)
- ✅ SSR 환경 체크 (typeof window !== 'undefined')
- ✅ 디버깅용 console.log 추가

### 문제 상태
- ❌ 페이지 새로고침 후에도 대화 히스토리가 유지되지 않음
- ❌ localStorage에 제대로 저장되고 있는지 확인 필요
- ❌ Chat API 응답 후 setConversationHistory가 제대로 호출되는지 확인 필요

---

## 다음 단계

1. **브라우저 콘솔에서 로그 확인**
   - `💾 대화 히스토리 업데이트:` 로그가 나타나는지 확인
   - `✅ localStorage에 저장됨` 로그가 나타나는지 확인

2. **Application 탭에서 localStorage 확인**
   - conversationHistory 키가 있는지 확인
   - 데이터가 제대로 저장되어 있는지 확인

3. **페이지 새로고침 후 확인**
   - `📖 localStorage에서 로드:` 로그가 나타나는지 확인
   - 로드된 데이터가 화면에 반영되는지 확인

4. **문제가 계속되면:**
   - Chat API 응답이 올바른지 확인
   - `setConversationHistory` 호출이 제대로 되는지 확인
   - 의존성 배열 검토

---

## 코드 위치

- `app/hooks/useAppState.ts`: localStorage 로직 (라인 33-63)
- `app/hooks/useAudioAPI.ts`: Chat API 호출 및 히스토리 업데이트 (라인 29-34)
- `app/page.tsx`: 훅 사용 및 상태 관리 (라인 15-27)

---

## 참고

이 문제는 **상태 지속성(State Persistence)** 관련 이슈로, 다음과 같은 시나리오에서 발생할 수 있습니다:

1. localStorage 저장 전에 페이지 새로고침
2. Chat API 응답 후 상태 업데이트 전에 새로고침
3. useCallback 의존성 배열 누락으로 함수가 계속 재생성
4. Next.js hydration 미스매치

**해결을 위해서는 위의 디버깅 방법을 통해 정확한 원인을 파악해야 합니다.**
