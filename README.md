# Voice AI App

AI 음성 인식 및 응답 시스템 기반의 대화형 애플리케이션입니다. 사용자의 음성을 인식하고, Claude AI로 응답을 생성한 후, 자연스러운 음성으로 재생합니다.

## 🎯 주요 기능

### 음성 인식 (STT)
- **제공자**: ElevenLabs Scribe v2
- **지원 언어**: 한국어, 영어, 일본어, 중국어 등 다국어 지원
- **자동 감지**: 실시간 음량 분석 및 침묵 감지로 자동 종료

### AI 응답 생성
- **모델**: Claude Sonnet 4
- **최대 토큰**: 500개
- **기능**: 대화 히스토리 유지, 연속 대화 지원

### 음성 재생 (TTS)
- **제공자**: ElevenLabs Text-to-Speech
- **음성**: Charlotte (여성 음성)
- **설정**: Stability 0.75, Similarity Boost 0.75
- **속도**: 1.2배 재생으로 더 빠른 응답

## 📦 설치

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 단계

```bash
# 1. 저장소 클론
git clone https://github.com/DevONew/voice-ai-app.git
cd voice-ai-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.development

# .env.development 파일에 다음 값 추가:
# CLAUDE_API_KEY=your-anthropic-api-key
# ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

### API 키 발급

**Claude API 키**:
1. [Anthropic Console](https://console.anthropic.com) 방문
2. API Keys 섹션에서 새 키 생성
3. 키를 `.env.development`에 저장

**ElevenLabs API 키**:
1. [ElevenLabs](https://elevenlabs.io) 가입
2. Dashboard → API Keys에서 키 생성
3. 키를 `.env.development`에 저장

## 🚀 실행

### 개발 서버 시작
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### Storybook (컴포넌트 개발)
```bash
npm run storybook
```
`http://localhost:6006`에서 컴포넌트 확인

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 빌드된 앱 실행
npm start
```

## 🏗️ 아키텍처

### 데이터 흐름

```
🎤 사용자 말하기
    ↓
📝 STT (음성 → 텍스트) - ElevenLabs
    ↓
💬 Chat API - Claude AI
    ↓
🔊 TTS (텍스트 → 음성) - ElevenLabs
    ↓
🎵 오디오 재생
```

### 디렉토리 구조

```
app/
├── api/                    # API 라우트
│   ├── chat/route.ts      # Claude Chat API
│   ├── stt/route.ts       # Speech-to-Text
│   └── tts/route.ts       # Text-to-Speech
├── components/            # React 컴포넌트 (12개)
│   ├── VoiceButton.tsx    # 마이크 버튼
│   ├── PulseIndicator.tsx # 음량 표시
│   ├── AudioPlayer.tsx    # 오디오 재생
│   ├── StateViews.tsx     # 상태별 UI
│   └── ...
├── hooks/                 # 커스텀 훅
│   ├── useVoiceRecorderStreaming.ts  # STT 처리
│   ├── useChatHandler.ts              # Chat API 및 TTS
│   ├── useAppState.ts                 # 앱 상태 관리
│   └── useAudioAPI.ts                 # API 래퍼
├── constants/             # 상수 관리
│   ├── audio.ts          # 오디오 설정
│   └── ui.ts             # UI 설정
├── types/                # TypeScript 타입
├── utils/                # 유틸리티 함수
├── config/               # 설정 파일
├── page.tsx              # 메인 페이지
└── layout.tsx            # 루트 레이아웃

stories/                  # Storybook 스토리
docs/                     # 문서
```

## 📊 상태 관리

### 앱 상태 (App State)

```
idle        → 초기 상태 (대기)
  ↓
listening   → 음성 인식 중
  ↓
processing  → Chat API 호출 중
  ↓
speaking    → 음성 재생 중
  ↓
idle        → 재생 완료
```

### 주요 상태값

| 상태 | 설명 |
|------|------|
| `appState` | 현재 앱 상태 |
| `transcript` | 인식된 음성 텍스트 |
| `responseText` | AI 응답 텍스트 |
| `audioBlob` | 생성된 음성 파일 |
| `volumeLevel` | 현재 음량 (0-100) |
| `conversationHistory` | 대화 히스토리 |

## ⚙️ 설정

### 오디오 설정 (`app/constants/audio.ts`)

```typescript
SILENCE_THRESHOLD      // 침묵 감지 음량 (기본값: 15)
SILENCE_DURATION       // 침묵 지속 시간 (기본값: 1500ms)
FFT_SIZE               // 오디오 분석 해상도 (기본값: 256)
PLAYBACK_RATE          // 재생 속도 (기본값: 1.2x)
TTS_DELAY              // TTS 완료 후 지연 (기본값: 500ms)
LANGUAGE_DETECTION_TIMEOUT // 언어 감지 표시 시간 (기본값: 2000ms)
```

### UI 설정 (`app/constants/ui.ts`)

```typescript
TYPEWRITER_SPEED       // 타이핑 속도 (기본값: 30ms)
VOLUME_THRESHOLDS      // 음량 단계 임계값
VOLUME_SIZE_CLASSES    // Tailwind 크기 클래스
```

## 🧪 Storybook 컴포넌트

컴포넌트 독립적 테스트 및 문서화:

```bash
npm run storybook
```

### 사용 가능한 스토리

- **VoiceButton**: 다양한 크기 및 상태 (Idle, Listening, Loud Sound)
- **PulseIndicator**: 음량 레벨별 시각화 (0 ~ 100)
- **AudioPlayer**: 오디오 재생 상태 (NoAudio, ReadyToPlay, Playing)

## 🔧 API 엔드포인트

### POST /api/chat
```json
요청:
{
  "message": "안녕하세요",
  "conversationHistory": []
}

응답:
{
  "response": "안녕하세요! 무엇을 도와드릴까요?",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

### POST /api/stt
```json
요청:
{
  "audioData": Blob,
  "language": "ko"
}

응답:
{
  "transcript": "인식된 텍스트"
}
```

### POST /api/tts
```json
요청:
{
  "text": "읽을 텍스트"
}

응답:
Blob (MP3 오디오 파일)
```

## 📱 사용법

### 기본 사용 방식

1. **마이크 버튼 클릭**: 음성 인식 시작
2. **말하기**: 마이크에 대해 말씀하기
3. **자동 완료**: 침묵 감지 시 자동 종료
4. **AI 응답**: Claude AI가 응답 생성
5. **음성 재생**: 자동으로 음성 재생

### 버튼 상태

- **검은 원** (아이들): 준비 상태
- **검은 원 + 그래디언트** (리스닝): 음성 인식 중
- **점프하는 원** (펄스): 음량 레벨 표시

## 📊 성능

- **STT 처리**: ~1-2초 (음성 길이에 따라)
- **Chat API**: ~1-3초 (응답 길이에 따라)
- **TTS 생성**: ~1-2초
- **총 응답 시간**: ~3-7초

## 🐛 문제 해결

### 마이크가 인식되지 않음
```
1. 브라우저 마이크 권한 확인
2. 운영체제 마이크 권한 확인
3. 다른 애플리케이션이 마이크 사용 중인지 확인
```

### API 키 오류
```
1. .env.development 파일 확인
2. API 키 유효성 검증
3. 앱 재시작
```

### 음성이 재생되지 않음
```
1. 브라우저 음량 확인
2. 스피커 연결 확인
3. AudioPlayer 컴포넌트 로그 확인
```

## 📚 문서

- [아키텍처 가이드](docs/voice-flow-architecture.md) - 시스템 플로우 상세 설명
- [설정 가이드](app/config/system-prompt.ts) - AI 시스템 프롬프트

## 🛠️ 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **AI**: Anthropic Claude API
- **TTS/STT**: ElevenLabs API
- **컴포넌트 문서**: Storybook
- **테스트**: Vitest (설정됨)

## 📈 프로덕션 준비도

- ✅ 아키텍처 설계
- ✅ 타입 안정성
- ✅ 컴포넌트 구조
- ✅ 에러 처리
- ✅ Storybook 통합
- ✅ 상수 관리
- ⏳ 유닛 테스트 (구현 예정)
- ⏳ E2E 테스트 (구현 예정)

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - [LICENSE](LICENSE) 파일 참조

## 📞 지원

이슈나 질문이 있으시면 [GitHub Issues](https://github.com/DevONew/voice-ai-app/issues)에 등록해주세요.

---

**마지막 업데이트**: 2025-12-04
**버전**: 1.0.0
