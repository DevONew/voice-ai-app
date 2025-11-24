export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voiceId = 'JBFqnCBsd6RMkjVY5ZN0' } = body;

    if (!text || typeof text !== 'string') {
      return Response.json({ error: '텍스트가 필요합니다.' }, { status: 400 });
    }

    // ElevenLabs TTS API 호출
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs TTS Error:', errorData);
      return Response.json(
        { error: 'TTS 처리 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }

    // 오디오 스트림을 그대로 클라이언트로 전달
    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
