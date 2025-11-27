# STT Implementation Errors & Solutions

## Overview
이 문서는 Eleven Labs STT를 Next.js에 연동하면서 발생한 에러들과 해결 방법을 기록합니다.

---

## Error 1: 422 - Missing model_id Parameter

### Error Message
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "model_id"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

### Root Cause
ElevenLabs STT API는 FormData에 `model_id` 파라미터가 필수입니다.

### Solution
FormData에 model_id를 추가합니다:

```typescript
const sttFormData = new FormData();
sttFormData.append('file', audioFile);
sttFormData.append('model_id', 'scribe_v2'); // ← 필수 추가
```

### Available Models
- `scribe_v1`
- `scribe_v1_experimental`
- `scribe_v2` (최신, 권장)

---

## Error 2: 400 - Invalid File Parameter Name

### Error Message
```json
{
  "detail": {
    "status": "invalid_parameters",
    "message": "Must provide either file or cloud_storage_url parameter."
  }
}
```

### Root Cause
FormData의 파라미터 이름이 `audio`였는데, ElevenLabs API는 `file` 이름을 요구합니다.

### Solution
파라미터 이름을 `file`로 변경합니다:

```typescript
// ❌ 잘못된 코드
sttFormData.append('audio', audioFile);

// ✅ 올바른 코드
sttFormData.append('file', audioFile);
```

---

## Error 3: 400 - Invalid Model ID

### Error Message
```json
{
  "detail": {
    "status": "invalid_model_id",
    "message": "'eleven_multilingual_sts_v2' is not a valid model_id. Only 'scribe_v1', 'scribe_v1_experimental', 'scribe_v2' are currently available."
  }
}
```

### Root Cause
문서에 있는 모델명이 실제 API에 없었습니다.

### Solution
올바른 모델 이름을 사용합니다:

```typescript
// ❌ 존재하지 않는 모델
sttFormData.append('model_id', 'eleven_multilingual_sts_v2');

// ✅ 올바른 모델
sttFormData.append('model_id', 'scribe_v2');
```

---

## Error 4: State Synchronization Issue (isFinalTranscript)

### Problem
`useVoiceRecorder`에서 `isFinalTranscript`를 true로 설정했지만, page.tsx의 `useEffect`가 이를 감지하여 자동으로 `processing`으로 전환하지 않았습니다.

### Root Cause Analysis

**1. Web Speech API vs Eleven Labs STT의 차이**
- Web Speech API: 사용자가 말하는 중 → 최종 결과 감지 가능
- Eleven Labs STT: 요청-응답 방식 → 항상 최종 결과만 반환 (임시 결과 없음)

**2. React Closure 문제**
- `useEffect`의 dependency가 제대로 작동하지 않음
- `setAppState`가 변경될 때마다 모든 hooks이 재생성됨

### Solution
`useVoiceRecorder` 훅에 `setAppState`를 파라미터로 전달하고, STT 결과를 받자마자 직접 상태를 변경합니다:

**Step 1: useVoiceRecorder 수정**
```typescript
export function useVoiceRecorder(
  setAppState?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void
): UseVoiceRecorderReturn {
  // ...

  mediaRecorder.onstop = async () => {
    try {
      // STT API 호출
      const result = await response.json();
      const recognizedText = result.text || '';

      setTranscript(recognizedText);
      setIsFinalTranscript(true);

      // 직접 상태 변경 (자동으로 processing으로 전환)
      if (setAppState) {
        console.log('🎯 상태 변경: listening → processing (자동)')
        setAppState('processing');
      }

      setTimeout(() => {
        setIsRecording(false);
      }, 500);
    } catch (err) {
      // error handling
    }
  }
}
```

**Step 2: page.tsx에서 setAppState 전달**
```typescript
const { setAppState, ... } = useAppState();
const { ..., startRecording, stopRecording, resetRecorder } = useVoiceRecorder(setAppState);
```

**Step 3: 기존 useEffect는 주석 처리 (나중에 실시간 받아쓰기에서 활용)**
```typescript
// 최종 결과가 나왔을 때 자동으로 처리 시작 (주석 처리 - 실시간 받아쓰기 기능 추가 후 활용)
// useEffect(() => {
//   if (isFinalTranscript && appState === 'listening' && transcript) {
//     console.log('✅ 최종 음성 인식 완료:', transcript)
//     console.log('🎯 상태 변경: listening → processing (자동)')
//     resetRecorder()
//     setAppState('processing')
//   }
// }, [isFinalTranscript, appState, transcript, setAppState, resetRecorder])
```

### Key Points
- ✅ 훅의 closure 문제 해결
- ✅ 상태 변경이 즉시 반영됨
- ✅ 나중에 실시간 받아쓰기 기능 추가 가능

---

## Error 5: Infinite Loop - Chat API Called Repeatedly

### Problem
STT 결과를 받자마자 `setAppState('processing')`을 호출하면, 동시에 `handleProcessing` 함수도 실행되어 무한 루프 발생.

```
STT 결과 받음
  ↓
useVoiceRecorderStreaming에서 setAppState('processing') 호출
  ↓
useEffect가 processing 상태 감지
  ↓
handleProcessing() 실행 → Chat API 호출
  ↓
Chat API 응답 후 다시 setAppState('processing') 호출
  ↓
무한 반복...
```

### Root Cause
1. STT 결과와 화면 표시를 **동기적으로** 처리
2. `processing` 상태의 `useEffect`가 매번 Chat API 호출
3. 상태 업데이트가 `useEffect`를 다시 트리거

### Solution
Chat API를 **Promise/비동기로 백그라운드 호출**, 화면은 별도 타이밍으로 전환:

**Step 1: useVoiceRecorderStreaming에 콜백 추가**
```typescript
export function useVoiceRecorderStreaming(
  setAppState?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void,
  onTranscriptUpdate?: (transcript: string, interim: string) => void,
  onFinalTranscript?: (transcript: string) => void  // ← 추가
): UseVoiceRecorderStreamingReturn
```

**Step 2: STT 결과 받으면 콜백으로 Chat API 백그라운드 호출**
```typescript
// STT 최종 결과를 받으면 Chat API를 백그라운드에서 호출
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

**Step 3: processing 상태의 useEffect 주석 처리**
```typescript
// processing 상태일 때 API 호출 (주석 처리 - Chat API는 백그라운드에서 호출됨)
// useEffect(() => {
//   if (appState === 'processing' && transcript) {
//     handleProcessing()
//   }
// }, [appState, transcript, handleProcessing])
```

### Key Points
- ✅ STT 결과와 Chat API 호출을 분리
- ✅ 화면 전환과 API 호출을 비동기로 처리
- ✅ `useEffect`의 불필요한 중복 호출 제거
- ✅ 무한 루프 방지

**동작 흐름:**
```
말함 → STT 결과 받음 (1초 내)
  ↓ (백그라운드: Chat API 호출)
2초 표시 (사용자가 읽음)
  ↓ (동시에 Chat API 진행 중)
Chat 응답 나옴
  ↓
speaking 상태로 전환 (결과 표시)
```

---

## Error 6: WebSocket Implementation Attempt

### What We Tried
Eleven Labs Streaming STT를 구현하려고 WebSocket을 시도했습니다.

### Why It Didn't Work
Next.js의 API Routes는 기본적으로 WebSocket을 지원하지 않습니다.

### Why We Decided Against It
1. **비용 문제**: WebSocket 서버를 별도로 띄워야 함 (Express, Fastify 등)
2. **서버 부담**: 음성 스트림을 계속 받으면서 실시간 STT 처리 = 높은 비용
3. **과도한 설계**: 침묵 감지만으로도 충분함

### Final Decision
**HTTP + 침묵 감지 방식으로 최적화**:
- 🎤 말함 → 오디오 버퍼에 저장 (서버 부담 X)
- 침묵 감지 → STT 한 번 호출 (비용 효율적)
- 결과 → 2초 표시 + Chat API 백그라운드
- ✅ 간단하고 비용 효율적

---

## Summary

| Error | Cause | Solution |
|-------|-------|----------|
| 422 | Missing model_id | Add `model_id` to FormData |
| 400 | Wrong parameter name | Change `audio` to `file` |
| 400 | Invalid model name | Use `scribe_v2` instead |
| State Sync | Closure issue | Pass `setAppState` to hook |
| Infinite Loop | useEffect 중복 호출 | Promise 기반 백그라운드 호출 |
| WebSocket | Next.js 미지원 | HTTP + 침묵 감지 사용 |

---

## Testing Checklist

- [x] STT API 422 에러 해결
- [x] STT API 400 에러 (파라미터) 해결
- [x] STT API 400 에러 (모델) 해결
- [x] 자동 상태 전환 구현
- [x] 무한 루프 문제 해결 (백그라운드 호출)
- [x] WebSocket 시도 및 대안 결정
- [ ] 실시간 받아쓰기 기능 (나중에 고려)
- [ ] 다중 언어 지원 테스트 (TODO)

---

## References

- [ElevenLabs STT API Docs](https://elevenlabs.io/docs/capabilities/speech-to-text)
- [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference/speech-to-text)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
