export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 여자 목소리 ID (Charlotte - 자연스럽고 여린 목소리)
    const { text, voiceId = 'XB0fDUnXU5powFXDhCwa' } = body;

    if (!text || typeof text !== 'string') {
      return Response.json({ error: '텍스트가 필요합니다.' }, { status: 400 });
    }

    console.log('🎙️ TTS 요청:', {
      textLength: text.length,
      voiceId,
      timestamp: new Date().toISOString(),
    });

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
            stability: 0.75,
            similarity_boost: 0.75,
          },
          // Safari 호환성을 위한 output format 명시
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ ElevenLabs TTS Error:', errorData);
      return Response.json(
        { error: 'TTS 처리 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }

    // 오디오 스트림을 그대로 클라이언트로 전달
    const audioBuffer = await response.arrayBuffer();
    
    console.log('✅ TTS 생성 완료:', {
      size: audioBuffer.byteLength,
      sizeKB: (audioBuffer.byteLength / 1024).toFixed(2) + 'KB',
    });

    // Safari 호환성을 위한 추가 헤더
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        // Safari에서 중요: Range 요청 지원
        'Accept-Ranges': 'bytes',
        // 캐시 제어 (선택사항)
        'Cache-Control': 'public, max-age=3600',
        // CORS 헤더 (필요시)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ TTS API Error:', error);
    return Response.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 처리 (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
