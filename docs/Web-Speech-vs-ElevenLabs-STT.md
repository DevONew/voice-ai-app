# 웹스피치(Web Speech API) vs 일레븐랩스 STT 비교

## 개요

원어민 AI 음성 선생님 앱을 만들면서 Web Speech API에서 Eleven Labs STT로 전환한 이유와 두 방식의 차이점을 정리한 문서입니다.

---

## 1️⃣ Web Speech API

### 특징
- **브라우저 기본 API**: 별도 서버/API 키 필요 없음
- **실시간 인식**: 사용자가 말하는 중 중간 결과 실시간 제공
- **언어 제한**: 한 번에 한 언어만 인식 가능

### 사용 흐름
```
사용자가 말함
  ↓ (실시간)
중간 결과: "안녕..."
  ↓ (계속 실시간)
중간 결과: "안녕하세..."
  ↓ (더 말함)
중간 결과: "안녕하세요"
  ↓ (말 멈춤 감지)
최종 결과: "안녕하세요"
```

### 문제점 ❌
```typescript
// 예: 한국어로 설정했을 때
// → 영어는 인식 안 됨
// → 반대로 영어로 설정하면 한국어는 인식 안 됨

const recognition = new webkitSpeechRecognition()
recognition.lang = 'ko-KR'  // 한국어만 가능
// "hello"라고 말해도 인식 못 함
```

**우리 앱에서의 문제:**
- 목표: 학생의 모국어(한국어) + 학습할 언어(영어 등) 모두 인식
- 현재: 한 번에 하나만 가능
- 불가능한 요구사항 ❌

---

## 2️⃣ Eleven Labs STT

### 특징
- **API 기반**: 서버를 통해 요청 (보안, 비용 관리 가능)
- **요청-응답 방식**: HTTP 호출 후 결과 받음
- **자동 언어 감지**: 여러 언어 자동 인식 가능
- **높은 정확도**: 전문적인 모델 사용

### 사용 흐름
```
사용자가 말함 → 오디오 저장 (서버 부담 X)
  ↓
침묵 감지 (1.5초) → 자동 종료
  ↓
오디오 전송 → STT API 호출 (1회)
  ↓
결과 수신: "안녕하세요"
```

### 장점 ✅
- 자동 언어 감지 (한국어 + 영어 동시 인식)
- 비용 효율적 (필요할 때만 호출)
- 높은 정확도

### 단점 ⚠️
- 실시간 텍스트 업데이트 안 됨 (최종 결과만)
- API 호출 비용 발생
- 약간의 지연 (침묵 감지 대기)

---

## 3️⃣ 아키텍처 비교

### Web Speech API 방식
```
사용자 음성
  ↓
Web Speech API (브라우저 내부)
  ↓ (중간 결과 실시간)
화면 업데이트 (안녕... → 안녕하... → 안녕하세요)
  ↓
최종 결과 감지 → useEffect → Chat API 호출
```

**문제점:**
- useEffect가 너무 빨리 트리거 될 수 있음
- 최종 vs 임시 결과 구분 필요
- 단일 언어 제한

---

### Eleven Labs STT 방식

#### ❌ 처음 시도 (무한루프):
```
오디오 녹음
  ↓
침묵 감지 → STT API 호출
  ↓
STT 결과 수신
  ↓
setAppState('processing') → useEffect 감지
  ↓
useEffect가 Chat API 호출
  ↓
Chat API 응답 → setAppState('processing') 또 호출
  ↓
useEffect 또 트리거 → 무한 반복!!! 💣
```

**근본 원인:**
- 상태 변경과 API 호출이 연쇄적으로 일어남
- useEffect가 반복적으로 트리거됨

---

#### ✅ 최종 해결책 (백그라운드 호출):
```
오디오 녹음 (로컬)
  ↓
침묵 감지 (1.5초)
  ↓
STT API 호출 (HTTP)
  ↓
STT 결과 수신
  ↓
┌─────────────────────────────────────────┐
│ 동시에 2가지 진행 (독립적)               │
├─────────────────────────────────────────┤
│ 1️⃣ 화면 (UI)        2️⃣ 기능 (API)      │
│ ────────────────    ────────────────   │
│ 2초 대기            Chat API 호출     │
│ "생각하는중" 표시   (기다리지 않음)    │
│                    백그라운드 진행    │
│                    응답 완료          │
│ ← 결과 받으면      │
│ "답변" 표시 전환   │
└─────────────────────────────────────────┘
```

**핵심:**
- **Promise 기반**: `.then()` 체이닝으로 비동기 처리
- **콜백 패턴**: `onFinalTranscript` 콜백이 Chat API를 백그라운드에서 호출
- **독립적 진행**: UI 상태 변경과 API 호출이 서로 영향 없음

---

## 4️⃣ 코드 비교

### 콜백 기반 백그라운드 호출 (현재 구현)

```typescript
// page.tsx
const { handleChatAPI } = useAudioAPI()

// STT 결과를 받으면 Chat API를 백그라운드에서 호출
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

// useVoiceRecorderStreaming에 콜백 전달
const { transcript, volumeLevel, error, startRecording, stopRecording, resetRecorder }
  = useVoiceRecorderStreaming(setAppState, undefined, handleFinalTranscript)
```

### useVoiceRecorderStreaming에서 콜백 호출

```typescript
// useVoiceRecorderStreaming.ts
export function useVoiceRecorderStreaming(
  setAppState?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void,
  onTranscriptUpdate?: (transcript: string, interim: string) => void,
  onFinalTranscript?: (transcript: string) => void  // ← 콜백
): UseVoiceRecorderStreamingReturn {
  // ...

  mediaRecorder.onstop = async () => {
    try {
      // STT API 호출
      const result = await response.json()
      const recognizedText = result.text || ''

      console.log('✅ STT 최종 결과:', recognizedText)
      setTranscript(recognizedText)

      // 최종 결과 콜백 (Chat API를 백그라운드에서 호출)
      if (onFinalTranscript) {
        onFinalTranscript(recognizedText)  // ← 콜백 실행
      }

      // 2초 후 화면 전환 (Chat API는 백그라운드에서 진행)
      setTimeout(() => {
        console.log('🎯 상태 변경: listening → processing (자동)')
        if (setAppState) {
          setAppState('processing')
        }
      }, 2000)
    } catch (err) {
      // error handling
    }
  }
}
```

---

## 5️⃣ 사용자 경험 흐름

### Web Speech API
```
1. "말해주세요" 화면
2. 말함 (실시간 텍스트 업데이트)
   - "안녕..."
   - "안녕하세요"
3. 자동 인식 멈춤
4. 즉시 처리 시작
```

**장점:** 빠른 피드백
**단점:** 한국어/영어 동시 인식 불가

---

### Eleven Labs STT (현재)
```
1. "말해주세요" 화면
2. 말함 (텍스트 X, 오디오만 저장)
3. 침묵 감지 → 자동 종료
4. "생각하는중" 화면 표시 (2초)
5. Chat API 백그라운드 처리
6. "답변" 표시
```

**장점:** 한국어/영어 동시 인식 ✅
**단점:** 실시간 텍스트 없음 ⚠️

---

## 6️⃣ 침묵 감지 (VAD - Voice Activity Detection)

### 설정값
```typescript
const SILENCE_THRESHOLD = 15    // 음량 임계값 (0-100)
const SILENCE_DURATION = 1500   // 침묵 시간 (ms)
```

### 동작
```
음성 감지 (음량 > 15)
  ↓
타이머 리셋 (1.5초 다시 시작)
  ↓
음성 없음 (음량 < 15)
  ↓
타이머 진행 중... (1.5초 대기)
  ↓
1.5초 지남 → 녹음 자동 종료 ⏹️
```

**장점:**
- 사용자가 버튼 안 눌러도 자동 종료
- 비용 효율적 (필요한 만큼만 전송)

---

## 7️⃣ 정리

| 구분 | Web Speech API | Eleven Labs STT |
|------|---|---|
| **언어 지원** | 단일 언어 ❌ | 다중 언어 ✅ |
| **실시간 텍스트** | 있음 ✅ | 없음 ❌ |
| **비용** | 무료 ✅ | 유료 ⚠️ |
| **정확도** | 중간 | 높음 ✅ |
| **우리 앱 적합성** | 불가능 ❌ | 최적 ✅ |

---

## 결론

**Eleven Labs STT 선택 이유:**
1. ✅ 한국어 + 영어 동시 인식 (원어민 선생님 요구사항)
2. ✅ 높은 정확도
3. ✅ 비용 효율적 (침묵 감지로 필요할 때만 호출)
4. ✅ 백그라운드 처리로 무한루프 방지
5. ✅ 사용자 입장에선 충분히 빠른 응답

실시간 텍스트 업데이트는 나중에 WebSocket Streaming 추가로 구현 가능하지만, 현재 HTTP + 침묵 감지 방식이 요구사항을 충분히 만족합니다.
