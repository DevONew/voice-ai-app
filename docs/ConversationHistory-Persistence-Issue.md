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

---

## 🔍 하이드레이션(Hydration)이란?

### 개념

**하이드레이션(Hydration)** = "물을 주다"는 의미

React가 서버에서 생성한 정적 HTML에 **상호작용 기능(이벤트 리스너, 상태 관리 등)을 추가**하는 과정입니다.

### 흐름

```
1. 서버가 React 컴포넌트 렌더링
   └─ HTML 문자열 생성 및 브라우저로 전송

2. 브라우저가 HTML 받음
   └─ 화면에 표시 (하지만 아직 상호작용 불가)

3. JavaScript 다운로드 및 React 초기화
   └─ 이벤트 리스너, useState, useEffect 등 등록

4. 하이드레이션 완료!
   └─ 상호작용 가능한 페이지
```

### 비유: 케이크 만드는 과정

```
1. 서버가 케이크를 굽는다 (SSR)
   └─ 기본 케이크 완성

2. 브라우저가 구워진 케이크를 받는다
   └─ 화면에 예쁘게 표시 (하지만 아직 못 먹음)

3. React가 케이크에 휘핑크림과 딸기를 얹는다 (Hydration)
   └─ 이벤트 리스너와 기능 추가

4. 완성된 케이크! 🎂
   └─ 먹을 준비 완료 (상호작용 가능)
```

### 하이드레이션 미스매치

**문제**: 서버가 생성한 HTML과 클라이언트의 React가 렌더링한 HTML이 **다를 때 발생**

```typescript
// ❌ 문제가 있는 코드
export default function Page() {
  const [data, setData] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('data')
    setData(saved || '')
  }, [])

  return <div>{data}</div>
}
```

**발생하는 과정:**

```
시간 →

서버 렌더링
├─ useState('') 초기화
├─ useEffect 미실행 (서버에서는 useEffect 안 함)
└─ HTML: <div></div> (빈 상태)

브라우저 HTML 로드
├─ 화면: (비어있음)
└─ JavaScript 다운로드

React 초기화 (Hydration)
├─ useState('') 초기화
├─ 서버 HTML <div></div> vs 클라이언트 HTML <div></div>
└─ 비교: 같음! ✅ 하이드레이션 성공

useEffect 실행 (클라이언트만)
├─ localStorage에서 "저장된 값" 로드
├─ setData("저장된 값")
└─ 재렌더링: <div>저장된 값</div>

문제점!
├─ 초기 렌더링: 빈 상태 (화면 깜빡임)
├─ 0.1초 후: 저장된 값으로 변경
└─ 사용자: "왜 깜빡거려?" 😕
```

### 우리의 해결책

```typescript
// ✅ 해결된 코드
useEffect(() => {
  if (typeof window === 'undefined') return // SSR 환경에서는 실행 안 함

  try {
    const saved = localStorage.getItem('conversationHistory')
    if (saved) {
      const parsed = JSON.parse(saved)
      setConversationHistoryState(parsed)
    }
  } catch (err) {
    console.error('대화 히스토리 로드 실패:', err)
  }
}, [])
```

### 왜 `typeof window === 'undefined'`인가?

```typescript
// 환경별로 window 객체의 존재 여부가 다름

// 서버 환경 (Node.js)
typeof window === 'undefined' // true ✅ (window 없음)

// 클라이언트 환경 (브라우저)
typeof window === 'undefined' // false ✅ (window 있음)
```

### 해결 과정

```
서버 렌더링
├─ useState([]) 초기화
├─ useEffect에서 if (typeof window === 'undefined') return
│  └─ localStorage 접근 안 함 ✅
└─ HTML 생성: conversationHistory = []

클라이언트 Hydration
├─ 하이드레이션: [] == [] ✅ (성공)
├─ useEffect 실행
├─ if (typeof window === 'undefined') return false
│  └─ localStorage 접근 시작 ✅
├─ 저장된 데이터 로드
└─ 재렌더링: 저장된 대화 표시 ✅
```

### 결론

```
문제: 서버와 클라이언트의 렌더링 결과가 다름
해결: typeof window 체크로 환경 감지
결과:
  - 서버: 빈 상태로 렌더링 (안전)
  - 클라이언트: useEffect에서 localStorage 로드
  - 하이드레이션 미스매치 방지 ✅
```

---

## 🐛 추가 문제: 대화 히스토리 계속 초기화되기

### 문제 상황

Eleven Labs STT 사용 시 대화 히스토리가 계속 초기화되는 현상:

```
1차 대화:
- 사용자: "프랑스어 한다고"
- AI: "세팅 완료되었습니다"
→ localStorage: [사용자1, AI1] ✅

2차 대화:
- 사용자: "원어민 선생님 모시겠습니다"
- AI: "어떤 국가의 선생님..."
→ localStorage: [사용자2, AI2]  ❌ (기존 대화 사라짐!)

예상: [사용자1, AI1, 사용자2, AI2]
실제: [사용자2, AI2]
```

### 원인 분석

**handleFinalTranscript의 의존성 배열 문제:**

```typescript
// ❌ 문제 코드
const handleFinalTranscript = useCallback((finalText: string) => {
  handleChatAPI(finalText, conversationHistory, setConversationHistory)
    // ...
}, [conversationHistory, setConversationHistory, handleChatAPI, setAppState])
   ↑
   conversationHistory를 의존성에 포함
```

**문제점:**

```
1. 첫 대화 완료
   └─ conversationHistory = [사용자1, AI1]

2. conversationHistory 변경 감지
   └─ handleFinalTranscript 함수 재생성 (새로운 클로저 생성)

3. 타이밍 이슈 발생
   ├─ STT 결과 받음: "원어민 선생님 모시겠습니다"
   ├─ handleFinalTranscript 호출
   └─ 이때 conversationHistory가 [] (빈 배열)일 수 있음!

4. Chat API 호출
   └─ newHistory = [] + 새로운 대화
   └─ [사용자2, AI2] (기존 대화 누락!)
```

### 해결책

**conversationHistory를 의존성에서 제거:**

```typescript
// ✅ 수정된 코드
const handleFinalTranscript = useCallback((finalText: string) => {
  console.log('📤 백그라운드에서 Chat API 호출:', finalText)
  console.log('📋 현재 conversationHistory:', conversationHistory)

  // conversationHistory는 의존성에 포함하지 않음
  // 대신 함수가 호출되는 순간의 최신 값 사용
  handleChatAPI(finalText, conversationHistory, setConversationHistory)
    .then((aiResponse) => {
      console.log('✅ Chat API 응답 (백그라운드):', aiResponse)
      setResponseText(aiResponse)

      setTimeout(() => {
        console.log('🎯 상태 변경: processing → speaking')
        setAppState('speaking')
      }, 500)
    })
    .catch((err) => {
      console.error('❌ Chat API 에러 (백그라운드):', err)
      setAppState('idle')
    })
}, [setConversationHistory, handleChatAPI, setAppState])
  // ↑ conversationHistory 제거!
```

### 왜 이렇게 작동하는가?

```typescript
// React의 클로저 메커니즘

// ❌ 의존성에 conversationHistory 포함
const callback1 = useCallback(() => {
  // 이 함수가 생성될 때의 conversationHistory를 캡처
  // conversationHistory 변경 → 함수 재생성 → 새로운 클로저
}, [conversationHistory])

// ✅ 의존성에서 제외
const callback2 = useCallback(() => {
  // 이 함수는 한 번만 생성됨
  // 함수가 호출될 때 (실행 시간)의 최신 conversationHistory 사용
  // 이것이 React Hooks의 기본 원칙!
}, [])
```

### 타이밍 흐름

```
시간 →

STT 결과: "원어민 선생님 모시겠습니다"

handleFinalTranscript 호출
├─ 이 시점의 conversationHistory = [사용자1, AI1] ✅
│  (함수 생성 당시의 값이 아니라, 호출 시점의 값)
│
└─ handleChatAPI(finalText, [사용자1, AI1], setConversationHistory)
   ├─ newHistory = [
   │    ...conversationHistory,  // [사용자1, AI1]
   │    { role: 'user', content: '원어민 선생님 모시겠습니다' },
   │    { role: 'assistant', content: 'AI 응답' }
   │  ]
   ├─ newHistory = [사용자1, AI1, 사용자2, AI2] ✅
   └─ setConversationHistory(newHistory)
      └─ localStorage에 저장 ✅
```

### 결론

```
문제: conversationHistory 의존성으로 인한 클로저 타이밍 이슈
해결: 의존성에서 conversationHistory 제거
      함수 호출 시 최신 값 자동으로 사용

결과:
  - 대화 히스토리 계속 누적 ✅
  - localStorage에 모든 대화 저장 ✅
  - 페이지 새로고침 후에도 전체 대화 유지 ✅
```
