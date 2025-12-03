# Voice AI 아키텍처 - 음성 처리 플로우

## 목차
1. [전체 플로우](#전체-플로우)
2. [각 단계별 상세 설명](#각-단계별-상세-설명)
3. [왜 이렇게 설계했나](#왜-이렇게-설계했나)
4. [현재 문제](#현재-문제)

---

## 전체 플로우

```
사용자 말하기
    ↓
오디오 녹음 (STT)
    ↓
음성 → 텍스트 변환
    ↓
Chat API 전송
    ↓
AI 응답 받기
    ↓
텍스트 → 음성 변환 (TTS)
    ↓
음성 재생
```

---

## 각 단계별 상세 설명

### 1단계: 왜 오디오를 녹음하나?

**사용자:** "안녕하세요"라고 말함 🎤

**녹음이 필요한 이유:**
- 사용자가 "텍스트"로 입력한 게 아니라 **"음성"으로 말함**
- 컴퓨터는 음성(파동)을 이해 못함
- 음성을 **디지털 데이터로 변환**해야 함

**녹음 과정:**
```
🎤 실제 소리 (아날로그 파동)
  ↓
마이크에서 전기 신호로 변환
  ↓
컴퓨터에서 디지털화 (0, 1)
  ↓
웹 오디오 API (Web Audio API)로 캡처
  ↓
Blob 형태로 저장
```

---

### 2단계: STT (Speech-to-Text) - 음성을 텍스트로

**코드 위치:** `app/hooks/useVoiceRecorderStreaming.ts`

```typescript
// Web Speech API 사용
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

recognition.onresult = (event) => {
  // 음성 → 텍스트
  const transcript = event.results[0][0].transcript // "안녕하세요"
}
```

**왜 이렇게 하나?**
- 브라우저가 자체 음성 인식 기능 제공 (Web Speech API)
- 서버에 음성 파일 전송 안 해도 됨 (빠름)
- 기기 내에서 처리 (프라이버시)

**지원 언어:**
- 한국어 (ko)
- 영어 (en)
- 일본어 (ja)
- 중국어 (zh)
- 그 외 다수

---

### 3단계: Chat API - 텍스트로 응답 받기

**코드 위치:** `app/api/chat/route.ts`

```typescript
// 1. STT에서 받은 텍스트 전송
입력: "안녕하세요"

// 2. Claude AI 처리
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 500,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: '안녕하세요' }]
})

// 3. AI 응답 받음
출력: "안녕하세요! 무엇을 도와드릴까요?"
```

**왜 텍스트로 처리하나?**
- 음성을 바로 AI에 보낼 수 없음
- 텍스트 기반 AI를 사용해야 함
- 텍스트가 저장/관리하기 쉬움
- 대화 히스토리 유지 가능

**AI 설정:**
- Model: `claude-sonnet-4-20250514`
- Max Tokens: 500 (응답 길이 제한)
- System Prompt: 원어민 선생님 역할 정의

---

### 4단계: TTS (Text-to-Speech) - 텍스트를 음성으로

**코드 위치:** `app/api/tts/route.ts`

```typescript
// 1. AI 응답을 ElevenLabs API로 전송
입력: "안녕하세요! 무엇을 도와드릴까요?"

// 2. ElevenLabs에서 음성 생성
const response = await fetch(
  'https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa',
  {
    method: 'POST',
    body: JSON.stringify({
      text: "안녕하세요! 무엇을 도와드릴까요?",
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    }),
  }
)

// 3. MP3 오디오 Blob 받음
출력: 음성 파일 (MP3)
```

**왜 ElevenLabs를 사용하나?**
- ✅ 자연스러운 음성 (AI 음성이 아님)
- ✅ 다국어 지원 (한글, 영어, 일본어 등)
- ✅ 음성 설정 가능 (stability, 톤, 유사도)
- ✅ 고급 기능 (음성 클로닝, 감정 표현)

**설정 상세:**
- **Voice ID**: `XB0fDUnXU5powFXDhCwa` (Charlotte - 여성 음성)
- **Model**: `eleven_multilingual_v2` (다국어)
- **Stability**: 0.75 (안정성 높음)
- **Similarity Boost**: 0.75 (목소리 일관성)

---

### 5단계: 문장 분절 (Sentence Splitting)

**코드 위치:** `app/hooks/useChatHandler.ts`

AI 응답이 길면 문제가 발생합니다:

```
입력: "안녕하세요! 무엇을 도와드릴까요?"

분절 로직:
1. 마침표/느낌표/물음표로 분리
   → ["안녕하세요!", "무엇을 도와드릴까요?"]

2. 20글자 초과면 추가 분절
   → 쉼표 기준으로 나누기
   → 공백 기준으로 나누기

결과: ["안녕하세요!", "무엇을", "도와드릴까요?"]
```

**왜 분절하나?**
- ElevenLabs: 긴 텍스트 → 음질 저하
- 20글자 이하 → 자연스러운 음성 ✅

**함수 구조:**
```typescript
splitSentences(text)
  ├─ 1단계: 문장 끝(., !, ?)으로 분절
  └─ 2단계: flatMap으로 처리
      ├─ 20글자 이하 → 그대로 반환
      └─ 20글자 초과 → splitLongSentence() 호출
         ├─ 쉼표로 분리
         └─ 공백으로 분리
```

---

### 6단계: 배치 처리 (Batch Processing)

**코드 위치:** `app/hooks/useChatHandler.ts`

ElevenLabs API는 레이트 리미트가 있습니다:

```
문제 상황:
9개 문장을 Promise.all()로 동시에 전송
→ 0.1초 안에 9개 요청 발송
→ ElevenLabs: "너무 많아!" → 429 에러

해결책: 3개씩 배치로 처리
배치 1: 문장 1, 2, 3 → 동시 처리 ✅
배치 2: 문장 4, 5, 6 → 동시 처리 ✅
배치 3: 문장 7, 8, 9 → 동시 처리 ✅
```

**코드:**
```typescript
const BATCH_SIZE = 3

for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
  const batch = sentences.slice(i, i + BATCH_SIZE)
  const batchResults = await Promise.all(
    batch.map(s => handleTTSAPI(s))
  )
  audioBlobs.push(...batchResults)
}
```

**성능:**
- 순차 처리: 3개 문장 × 1초 = 3초
- 배치 처리: ~1초 (병렬)
- **향상도: 3배 빠름** ⚡

---

### 7단계: 오디오 재생

**코드 위치:** `app/components/AudioPlayer.tsx`

```typescript
// 1. MP3 Blob → URL 변환
const url = URL.createObjectURL(audioBlob)

// 2. HTML Audio 요소에 설정
<audio ref={audioRef} src={url} />

// 3. 자동 재생
audioRef.current.play()

// 4. 완료 감지
audioRef.current.addEventListener('ended', () => {
  // 상태 변경 (speaking → idle)
  onPlayEnd()
})
```

---

## 전체 데이터 흐름 (다이어그램)

```
┌─ 사용자 말하기 ─────────────────────────┐
│                                        │
│  🎤 "안녕하세요"                        │
│                                        │
└─────────────┬──────────────────────────┘
              │
              ▼ (Web Speech API)
      ┌──────────────────┐
      │ STT - 음성 인식  │
      │ (브라우저 내장)  │
      └────────┬─────────┘
               │
               ▼
         📝 "안녕하세요"
               │
               ▼ (HTTP POST)
      ┌──────────────────┐
      │  Chat API        │
      │  (Claude AI)     │
      └────────┬─────────┘
               │
               ▼
    📝 "안녕하세요! 무엇을 도와드릴까요?"
               │
               ▼ (분절 + 배치)
      ┌──────────────────────┐
      │  TTS API (배치 1)    │
      │  (ElevenLabs × 3)   │
      └────────┬─────────────┘
               │
               ▼
         🎵 MP3 × 3개
               │
               ▼ (병합)
      ┌──────────────────┐
      │  단일 MP3 파일   │
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │  Audio Player    │
      │  (브라우저)      │
      └────────┬─────────┘
               │
               ▼
         🔊 스피커에서 재생
```

---

## 왜 이렇게 설계했나?

### 문제: 음성을 바로 처리하면 안 되나?

**음성 → 음성 직접 처리:**
```
🎤 음성 → AI → 🔊 음성
  (복잡함, 오류 추적 어려움)
```

**왜 안 되나?**
- ❌ 오류 발생 시 원인 파악 불가
- ❌ 각 단계 검증 불가
- ❌ 대화 기록 못함
- ❌ 디버깅 어려움

**해결책: 텍스트 중간 단계 추가**
```
🎤 음성 → 📝 텍스트 → AI → 📝 텍스트 → 🔊 음성
  (투명함, 오류 추적 쉬움)
```

**장점:**
✅ 각 단계 검증 가능 (콘솔 로그)
✅ 오류 원인 파악 쉬움
✅ 대화 히스토리 저장 가능
✅ 텍스트 기반 수정 가능
✅ 다양한 AI 모델 교체 가능

---

### 상태 관리

```
'idle'
  ↓ (마이크 버튼 클릭)
'listening' (음성 녹음 중)
  ↓ (음성 인식 완료)
'processing' (Chat API 호출 중)
  ↓ (Chat API 응답 + TTS 처리 완료)
'speaking' (음성 재생 중)
  ↓ (재생 완료)
'idle'
```

---

## 현재 문제

### 증상: 지지직거리는 소리

```
Chat API 응답: "안녕하세요! 무엇을 도와드릴까요?"

분절: ["안녕하세요!", "무엇을 도와드릴까요?"]

각각 TTS API로 전송:
  ① "안녕하세요!" → MP3 파일 1
  ② "무엇을 도와드릴까요?" → MP3 파일 2

현재 구현:
  Blob([MP3_1, MP3_2]) ← 단순 이어붙임
  ↓
  MP3 형식 구조 문제 → 경계에서 지지직거림 🔥
```

### 원인 분석

MP3는 "단순 이어붙임"이 불가능합니다:

```
MP3 파일 구조:
┌─────────┬──────────────┬─────────────┐
│ 헤더    │ 프레임       │ 헤더        │
│ (ID3)   │ 데이터       │ (프레임)    │
└─────────┴──────────────┴─────────────┘

MP3_1 + MP3_2:
┌─────────┬──────────────┬──────────────┬──────────────┬─────────────┐
│ 헤더1   │ 프레임 데이터│ 헤더2        │ 프레임 데이터│ 헤더3       │
└─────────┴──────────────┴──────────────┴──────────────┴─────────────┘
                         ↑ 이 경계에서 지지직거림!
```

### 해결 방안

**옵션 1: WAV 변환 후 병합**
```
MP3 → WAV 변환 → 병합 → WAV 재생
(가장 깔끔하지만 파일 크기 증가)
```

**옵션 2: 순차 재생**
```
MP3_1 재생 → MP3_2 재생 → MP3_3 재생
(간단하지만 딜레이 있음)
```

**옵션 3: 전체 텍스트 한번에 처리**
```
분절 X → 전체 텍스트 → 한 번에 TTS
(가장 간단하지만 음질 저하)
```

---

## 파일 구조

```
app/
├── hooks/
│   ├── useVoiceRecorderStreaming.ts  ← STT (음성 인식)
│   ├── useChatHandler.ts              ← Chat API + 문장 분절
│   └── useAudioAPI.ts                 ← API 호출 함수들
├── api/
│   ├── chat/route.ts                  ← Chat API 엔드포인트
│   └── tts/route.ts                   ← TTS API 엔드포인트
├── components/
│   └── AudioPlayer.tsx                ← 오디오 재생
└── page.tsx                           ← 메인 페이지
```

---

## 참고 자료

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [ElevenLabs TTS API](https://elevenlabs.io/docs/api)
- [Claude API](https://anthropic.com/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
