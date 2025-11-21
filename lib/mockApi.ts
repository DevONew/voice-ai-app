// Mock API responses

export async function getMockAIResponse(userMessage: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  const responses = [
    '안녕하세요. 무엇을 도와드릴까요?',
    '알겠습니다. 좋은 질문이네요. 저는 이에 대해 다음과 같이 생각합니다.',
    `당신이 말씀하신 "${userMessage}"는 매우 흥미로운 주제입니다.`,
    '이것은 정말 좋은 지적입니다. 저도 동의합니다.',
    '음, 생각해보니 이것이 중요한 포인트네요. 더 알아볼 필요가 있겠어요.',
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

export async function generateAudioFromText(text: string): Promise<ArrayBuffer> {
  // Simulate audio generation delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Return a simple WAV file header (silent audio)
  const sampleRate = 44100
  const duration = 2 // seconds
  const samples = sampleRate * duration

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const audioBuffer = audioContext.createBuffer(1, samples, sampleRate)

  return audioBuffer.getChannelData(0).buffer
}

export async function speakText(text: string): Promise<void> {
  // Use browser's native TTS (Web Speech API Synthesis)
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 1
    utterance.pitch = 1

    return new Promise((resolve) => {
      utterance.onend = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }
}
