# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 개발 명령어

```bash
npm run dev          # 개발 서버 시작 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행
npm run storybook    # 컴포넌트 개발 (http://localhost:6006)
```

## 아키텍처 개요

다국어 언어 학습을 위한 음성 AI 애플리케이션. 사용자가 Claude AI 에이전트에게 말하면 응답을 생성하고 TTS로 재생합니다.

**기술 스택**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion

**외부 API**:
- Anthropic Claude (claude-sonnet-4-20250514) - 채팅 응답
- ElevenLabs - STT (Scribe v2) 및 TTS (multilingual v2)

## 앱 상태 머신

```
idle → listening → processing → speaking → idle
         ↓                          ↓
       error ←─────────────────────←
```

## 주요 디렉토리

- `app/api/` - 백엔드 라우트: `/chat`, `/stt`, `/tts`
- `app/hooks/` - 핵심 로직:
  - `useVoiceRecorderStreaming` - 마이크 캡처, 침묵 감지, STT
  - `useChatHandler` - Chat API 호출, 언어 감지, TTS 오케스트레이션
  - `useAppState` - 전역 상태 관리
- `app/components/` - React UI 컴포넌트 (VoiceButton, StateViews, AudioPlayer 등)
- `app/utils/` - Singleton AudioContext, LRU TTS 캐시, 언어 감지
- `app/config/system-prompt.ts` - Claude 시스템 프롬프트 설정
- `app/constants/` - 오디오 설정 (침묵 임계값, FFT 크기) 및 UI 설정

## 중요 패턴

- **Singleton AudioContext**: `app/utils/audio-context.ts` - 메모리 누수 방지를 위한 단일 전역 AudioContext
- **TTS 캐싱**: `app/utils/tts-cache.ts` - 중복 API 호출 방지를 위한 LRU 캐시 (50개 항목)
- **침묵 감지**: 2초 침묵 후 자동 녹음 중지 (임계값: 15, FFT 크기: 256)
- **대화 히스토리**: 컨텍스트 인식 응답을 위해 상태에서 유지

## 환경 변수

`.env.development` 또는 `.env.production`에 필요:
```
CLAUDE_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```
