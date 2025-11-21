# 음성 AI 웹앱 프로젝트

## 기술 스택
- Next.js 14 + TypeScript + Tailwind CSS
- App Router 사용

## 기능 요구사항

1. **UI**
   - 중앙에 큰 원형 마이크 버튼
   - 클릭하면 녹음 시작/정지
   - 음성 재생 시 원이 음성 크기에 맞춰 커졌다 작아지는 애니메이션
   - 모바일 친화적 반응형 디자인

2. **음성 인식**
   - Web Speech API 사용
   - 한국어 인식

3. **API 연동 (현재는 Mock)**
   - Claude API: 임시 더미 응답 사용
   - ElevenLabs API: 임시 더미 오디오 또는 브라우저 TTS 사용

4. **상태 표시**
   - 듣는 중 / 생각하는 중 / 말하는 중 상태 표시

## 구현 우선순위
1. 기본 UI 및 마이크 버튼
2. Web Speech API 음성 인식
3. Mock API 응답
4. 음성 재생 및 애니메이션