# 문제점 및 수정 요구사항

## 문제 1: 음성 인식 시 상태 텍스트 미표시
**현상**:
- 검은 원을 눌렀을 때 위에 아무것도 안 나타남
- 원만 활성화되어 있음

**기대 동작**:
1. 검은 원 클릭
2. 즉시 "듣는 중..." 텍스트 표시
3. 음성이 인식되기 시작하면 "듣는 중..." → 인식된 텍스트로 실시간 교체

**참고 사진**:
- `public/음성 인식 시.png` - 듣는 중 상태 화면
- `public/음성 인식 후.png` - 음성 인식 완료 후 화면

---

## 문제 2: 음성 인식 후 자동 전송 안 됨
**현상**:
- 음성 받아쓰기만 됨
- 콘솔에 "최종"만 출력됨
- 아무 일도 일어나지 않음
- 가운데 원을 다시 눌러야만 전송됨

**기대 동작**:
1. 음성 인식이 **완료(최종)**되면
2. **자동으로** 인식된 텍스트를 `/api/chat`으로 전송
3. 추가 클릭 불필요

**수정 필요**:
- 음성 인식 최종 완료 이벤트에서 자동 API 호출 트리거

---

## 문제 3: 음성 인식 후 화면 레이아웃 오류
**현상**:
- 음성 인식 후 검은 원을 누르면
- "생각하는 중" + 아래 검은 원 + 받아쓴 음성이 함께 표시됨
- 레이아웃이 의도와 다름

**기대 동작**:
- 음성 인식이 완료되고 자동 전송되면 (문제 2 수정 후)
- 검은 원을 다시 누를 필요가 없음
- 자동으로 다음 단계로 진행

---

## 문제 4: AI 응답 시 화면 레이아웃 미구현
**현상**:
- AI 응답을 받아올 때 레이아웃이 제대로 전환되지 않음

**기대 동작**:
음성 인식 종료 → API 전송 시점에:

```
┌─────────────────────────┐
│                         │
│    생각하는 중...        │  ← 상단 중앙 표시
│                         │
│   [AI 응답 텍스트]       │  ← 70-80% 영역
│   타이핑 효과로         │
│   한 글자씩 표시        │
│                         │
├─────────────────────────┤
│         ⬤              │  ← 하단 20-30%
│    (작은 검은 원)        │     (애니메이션)
└─────────────────────────┘
```

**세부 요구사항**:
1. 음성 인식 완료 → API 전송 시작
2. 검은 원이 **즉시 하단으로 이동하면서 작게 축소** (0.5초 애니메이션)
3. 동시에 화면 상단에 "생각하는 중..." 표시
4. AI 응답 받으면 **"생각하는 중..." 텍스트 삭제** → AI 응답 텍스트로 교체
5. 응답 텍스트는 타이핑 효과로 표시 (한 글자씩)
6. TTS 음성 재생하면서 하단 작은 원이 음성에 맞춰 애니메이션

**중요**: "생각하는 중..."이 화면에 남아있으면 안 됨! 응답 텍스트만 표시되어야 함.

---

## 문제 5: TTS API 404 오류
**현상**:
- TTS 호출 시 404 에러 발생
- API 엔드포인트 또는 호출 방식 오류로 추측

**해결 방법**:
ElevenLabs 공식 Quickstart 문서 참고: https://elevenlabs.io/docs/quickstart

### ElevenLabs TTS API 올바른 사용법

**엔드포인트**:
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
```

**헤더**:
```typescript
{
  "xi-api-key": process.env.ELEVENLABS_API_KEY,
  "Content-Type": "application/json"
}
```

**요청 Body**:
```typescript
{
  "text": "변환할 텍스트",
  "model_id": "eleven_multilingual_v2",  // 또는 "eleven_flash_v2_5"
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

**응답**:
- Content-Type: `audio/mpeg`
- MP3 오디오 스트림

**추천 모델**:
- `eleven_multilingual_v2` - 고품질, 다국어 지원
- `eleven_flash_v2_5` - 빠른 응답 (75ms 지연), 저렴

**참고 문서**:
- ElevenLabs Quickstart: https://elevenlabs.io/docs/quickstart
- Text-to-Speech API: https://elevenlabs.io/docs/capabilities/text-to-speech

---

## 구현 순서

### 1단계: 음성 인식 UI 수정
- [ ] 원 클릭 시 즉시 "듣는 중..." 표시
- [ ] 음성 인식되면 실시간 받아쓰기로 교체

### 2단계: 자동 전송 구현
- [ ] 음성 인식 최종 완료 시 자동으로 `/api/chat` 호출
- [ ] 사용자 추가 클릭 불필요

### 3단계: 응답 화면 레이아웃 구현
- [ ] API 전송 시작하면 원이 하단으로 이동 + 축소
- [ ] "생각하는 중..." 표시
- [ ] AI 응답을 상단 70-80% 영역에 타이핑 효과로 표시

### 4단계: TTS API 수정
- [ ] `/api/tts/route.ts` 엔드포인트 수정
- [ ] 올바른 ElevenLabs API 호출 방식 적용
- [ ] 음성 스트림 정상 반환 확인

### 5단계: TTS 재생 및 애니메이션
- [ ] TTS 음성 재생
- [ ] 하단 작은 원이 음성에 맞춰 애니메이션
- [ ] 재생 완료 후 2초 대기 → 자동 복귀

---

## 추가 확인 사항

### Voice ID 설정
ElevenLabs에서 사용할 목소리의 Voice ID 확인 필요:
- 대시보드 → My Voices → 목소리 선택 → More actions (•••) → Copy Voice ID

### 환경 변수 확인
`.env.local` 파일에 올바른 키 설정 확인:
```bash
CLAUDE_API_KEY=sk-ant-xxxxx
ELEVENLABS_API_KEY=xxxxx
```

### 에러 로그 확인
콘솔에서 구체적인 에러 메시지 확인:
- Network 탭에서 실제 API 호출 확인
- Response Body 확인
- Status Code 확인

---

## 참고 자료

- ElevenLabs API 문서: https://elevenlabs.io/docs
- Text-to-Speech 가이드: https://elevenlabs.io/docs/capabilities/text-to-speech
- API 레퍼런스: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
