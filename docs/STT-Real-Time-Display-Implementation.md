# STT 결과 실시간 표시 구현 가이드

## 개요

이 문서는 Eleven Labs STT를 사용하면서 사용자가 말한 내용을 실시간으로 확인하는 기능을 구현하는 과정과 설계 결정을 정리합니다.

사용자 경험 측면에서 "자신이 뭐라고 말했는지 확인"이 중요한 요구사항이었고, 이를 비용 효율적이면서도 사용하기 좋게 구현한 방법을 소개합니다.

---

## 1️⃣ 초기 문제점

### 사용자 요구사항
- ✅ 한국어 + 다른 언어 동시 인식 필요
- ✅ 말한 내용을 화면에서 확인하고 싶음
- ❌ 웹소켓은 사용하고 싶지 않음 (복잡하고 비용 많이 듦)

### 기술적 제약
- **Web Speech API**: 한국어 + 영어 동시 인식 불가능 (한 번에 한 언어만)
- **Eleven Labs STT**: 침묵 감지 후 최종 결과만 반환 (실시간 중간 결과 없음)
- **HTTP Streaming**: 중간 결과마다 API 호출 → 비용 증가
- **WebSocket**: 별도 서버 필요 (복잡성 증가)

---

## 2️⃣ 초기 구현 (문제 있음)

```typescript
// useVoiceRecorderStreaming.ts 초기 구현
mediaRecorder.onstop = async () => {
  const recognizedText = result.text || ''

  setTranscript(recognizedText)      // ✅ STT 결과 저장

  // 최종 결과 콜백 (Chat API를 백그라운드에서 호출)
  if (onFinalTranscript) {
    onFinalTranscript(recognizedText) // ← 즉시 호출
  }

  // 2초 후 화면 전환
  setTimeout(() => {
    setAppState('processing')         // ← 2초 후 상태 전환
  }, 2000)
}
```

**문제점:**
```
STT 결과 받음 ("안녕하세요")
  ↓
즉시 Chat API 호출 (백그라운드)
  ↓
2초 후 processing으로 전환
  ↓
결과: listening 상태에서 "안녕하세요"를 2초간 못 봄!
```

**사용자 경험:**
- 음성 인식 완료 → 즉시 "생각하는 중" 화면
- 자신이 뭐라고 말했는지 확인 불가능 ❌

---

## 3️⃣ 개선된 구현 (현재 방식)

```typescript
// useVoiceRecorderStreaming.ts 개선 후
mediaRecorder.onstop = async () => {
  const recognizedText = result.text || ''

  setTranscript(recognizedText)      // ✅ STT 결과 저장
  setInterimTranscript('')

  // 2초 동안 listening 상태에서 STT 결과 표시
  setTimeout(() => {
    console.log('🎯 상태 변경: listening → processing (자동)')
    if (setAppState) {
      setAppState('processing')      // ← 2초 후에 상태 전환
    }

    // 2초 후에 Chat API를 백그라운드에서 호출
    if (onFinalTranscript) {
      onFinalTranscript(recognizedText) // ← 2초 후 호출
    }
  }, 2000)
}
```

**개선 사항:**
```
STT 결과 받음 ("안녕하세요")
  ↓
listening 상태에서 2초간 "안녕하세요" 표시 ← 사용자 확인 시간
  ↓ (2초 후)
Chat API 호출 (백그라운드) + processing 상태로 전환
  ↓
Chat API 응답 받으면 speaking 상태로 전환
```

**사용자 경험:**
- 음성 인식 완료 → 2초간 "안녕하세요" 확인 ✅
- 자신이 뭐라고 말했는지 명확하게 확인 가능 ✅
- 그 후 AI 응답을 기다리는 "생각하는 중" 화면 ✅

---

## 4️⃣ 전체 플로우

### 상태 다이어그램

```
idle
  ↓ (사용자가 마이크 버튼 클릭)
listening (음성 녹음)
  ↓ (1.5초 침묵 감지 → STT API 호출)
listening (STT 최종 결과 표시) ← "안녕하세요" 화면에 표시
  ↓ (2초 대기)
processing (Chat API 호출 진행) ← "생각하는 중.." 표시
  ↓ (Chat API 응답)
speaking (AI 답변 표시) ← "안녕하세요, 어떻게 도와드릴까요?" 표시
  ↓ (음성 재생 완료)
idle (초기 상태로 복귀)
```

### 타이밍 다이어그램

```
0ms    STT 결과 받음
       ├─ setTranscript("안녕하세요")
       └─ 2초 타이머 시작

0-2000ms  listening 상태 유지 + transcript 표시
          (사용자가 화면에서 "안녕하세요" 확인)

2000ms    타이머 완료
          ├─ setAppState('processing')
          └─ onFinalTranscript() 호출 → Chat API 호출 (백그라운드)

2500ms    Chat API 진행 중...
          (화면: "생각하는 중..")

5000ms    Chat API 응답 완료
          ├─ setResponseText(aiResponse)
          └─ setTimeout 500ms 후 setAppState('speaking')

5500ms    speaking 상태로 전환
          (화면: "안녕하세요, 어떻게 도와드릴까요?")
```

---

## 5️⃣ 핵심 설계 결정

### 왜 2초인가?

```
0-1000ms   STT API 호출 및 응답
1000-2000ms 사용자가 화면에서 결과 읽기 (충분한 시간)
2000ms+    Chat API가 백그라운드에서 진행 중
```

**2초의 역할:**
1. 사용자가 자신의 말을 확인할 시간 제공
2. Chat API 호출을 지연시켜 UI 전환을 자연스럽게
3. 비용 효율성: Eleven Labs STT 1회만 호출

### 무한루프 방지

**원인 분석:**

초기 구현에서 무한루프가 발생했던 이유:
```
STT 결과 받음
  ↓
setAppState('processing') 호출 (즉시)
  ↓
useEffect가 processing 상태 감지
  ↓
Chat API 호출
  ↓
Chat API 응답 → setAppState('processing') 또 호출
  ↓
무한 반복...
```

**현재 구현의 안전성:**

1. **상태 전환이 명확함**
   ```
   listening → processing → speaking
   (역방향 없음)
   ```

2. **콜백은 정확히 1회만 호출**
   ```typescript
   setTimeout(() => {
     onFinalTranscript(recognizedText) // 2초 후 정확히 1회
   }, 2000)
   ```

3. **Chat API 응답이 speaking으로만 전환**
   ```typescript
   .then((aiResponse) => {
     setResponseText(aiResponse)
     setTimeout(() => {
       setAppState('speaking')  // ← processing이 아님
     }, 500)
   })
   ```

4. **의존성 배열 정확함**
   ```typescript
   const handleFinalTranscript = useCallback(
     (finalText: string) => { ... },
     [conversationHistory, setConversationHistory, handleChatAPI, setAppState]
     // ↑ 모든 필요한 의존성 포함
   )
   ```

---

## 6️⃣ 기술적 상세 분석

### React의 의존성 배열 (Dependency Array)

**의존성 배열이란:**

```typescript
const handleFinalTranscript = useCallback(
  (finalText: string) => {
    handleChatAPI(finalText, conversationHistory, setConversationHistory)
  },
  [conversationHistory, setConversationHistory, handleChatAPI, setAppState]
  // ↑ 의존성 배열: 이 값이 변경되면 함수가 새로 생성됨
)
```

**왜 중요한가:**

- **배열 값이 변경** → 함수 새로 생성 → useVoiceRecorderStreaming도 새로 생성
- **배열 값이 같음** → 이전 함수 재사용 → 불필요한 재생성 방지

**현재 코드의 의존성:**

| 의존성 | 필요 여부 | 이유 |
|--------|---------|------|
| `conversationHistory` | ✅ 필수 | Chat API 호출 시 대화 기록 필요 |
| `setConversationHistory` | ✅ 필수 | 대화 기록 업데이트 함수 필요 |
| `handleChatAPI` | ✅ 필수 | Chat API 호출 함수 필요 |
| `setAppState` | ✅ 필수 | speaking 상태 전환에 필요 |

---

## 7️⃣ STT 결과 흐름

### Eleven Labs STT API 호출

```typescript
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  const response = await fetch('/api/stt', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  const recognizedText = result.text || ''

  console.log('✅ STT 최종 결과:', recognizedText)
  setTranscript(recognizedText)
}
```

**특징:**
- 침묵 감지(1.5초) 후 자동 종료
- 오디오 전체를 한 번에 전송
- 최종 결과만 반환 (중간 결과 없음)
- Eleven Labs API 1회 호출 = 비용 효율적 ✅

---

## 8️⃣ Chat API 백그라운드 호출

### Promise 기반 비동기 처리

```typescript
const handleFinalTranscript = useCallback((finalText: string) => {
  console.log('📤 백그라운드에서 Chat API 호출:', finalText)

  // Promise로 호출 (기다리지 않음)
  handleChatAPI(finalText, conversationHistory, setConversationHistory)
    .then((aiResponse) => {
      console.log('✅ Chat API 응답 (백그라운드):', aiResponse)
      setResponseText(aiResponse)

      // Chat 응답이 나오면 speaking으로 전환
      setTimeout(() => {
        console.log('🎯 상태 변경: processing → speaking')
        setAppState('speaking')
      }, 500)
    })
    .catch((err) => {
      console.error('❌ Chat API 에러 (백그라운드):', err)
      setAppState('idle')
    })
}, [conversationHistory, setConversationHistory, handleChatAPI, setAppState])
```

**핵심:**
- `await` 사용 안 함 (기다리지 않음)
- `.then()` 체이닝으로 응답 처리
- UI와 API 호출이 독립적으로 진행
- 응답 완료까지 사용자가 "생각하는 중" 화면을 봄

---

## 9️⃣ 사용자 경험 개선 전후 비교

### 이전 (문제 있음)

```
사용자: "안녕하세요" 말함
  ↓
STT 처리 중... (화면: "듣는 중")
  ↓
STT 결과: "안녕하세요" ← 화면에 표시되지만 즉시 사라짐
  ↓
Chat API 호출 (백그라운드)
  ↓
화면: "생각하는 중.." (2초 대기)
  ↓
사용자: "내가 뭐라고 말했지?" 💭
```

**문제:**
- 자신이 말한 내용을 확인할 시간 없음
- 음성 인식이 제대로 되었는지 알 수 없음

### 현재 (개선됨)

```
사용자: "안녕하세요" 말함
  ↓
STT 처리 중... (화면: "듣는 중")
  ↓
STT 결과: "안녕하세요"
  ↓
화면: "안녕하세요" (2초간 표시) ← 명확하게 확인 가능 ✅
  ↓
Chat API 호출 (백그라운드 시작)
  ↓
화면: "생각하는 중.."
  ↓
사용자: "내 음성이 제대로 인식되었구나" 👍
```

**개선 사항:**
- 음성 인식 결과를 명확하게 확인
- 틀린 경우 다시 말할 기회 인식
- 신뢰도 증가

---

## 🔟 구현 체크리스트

- [x] Eleven Labs STT API 통합
- [x] 침묵 감지(VAD) 구현
- [x] STT 결과를 listening 상태에서 표시
- [x] 2초 대기 로직 구현
- [x] Chat API 백그라운드 호출
- [x] 상태 전환 로직 (listening → processing → speaking)
- [x] 무한루프 방지
- [x] 의존성 배열 정확성 검증

---

## 1️⃣1️⃣ 결론

**최종 설계의 장점:**

| 측면 | 장점 |
|------|------|
| **사용자 경험** | STT 결과를 명확하게 확인 가능 ✅ |
| **비용 효율성** | Eleven Labs API 1회만 호출 ✅ |
| **다중 언어** | 한국어 + 영어 동시 인식 ✅ |
| **복잡도** | WebSocket 없이 구현 (간단) ✅ |
| **안정성** | 무한루프 위험 없음 ✅ |

**설계 결정 요약:**
1. Eleven Labs STT로 최종 결과만 받기 (비용 절감)
2. 2초 동안 listening 상태 유지해서 사용자가 확인 가능하게
3. Chat API는 2초 후 백그라운드에서 호출 (UI와 분리)
4. Promise 기반 비동기 처리로 무한루프 방지

---

## 참고 자료

- [Eleven Labs STT API 문서](https://elevenlabs.io/docs/api-reference/speech-to-text)
- [React useCallback Hook](https://react.dev/reference/react/useCallback)
- [Promise와 async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
