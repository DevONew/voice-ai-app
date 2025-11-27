export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const currentLanguage = formData.get('currentLanguage') as string;

    if (!audioFile) {
      return Response.json({ error: '오디오 파일이 필요합니다.' }, { status: 400 });
    }

    console.log('📁 받은 오디오 파일:', audioFile.name, audioFile.type, audioFile.size);
    console.log('🌐 현재 설정 언어:', currentLanguage || 'ko');

    // FormData로 전송 (ElevenLabs API는 multipart/form-data 요구)
    const sttFormData = new FormData();
    sttFormData.append('file', audioFile);
    sttFormData.append('model_id', 'scribe_v2');
    // 한국어 + 현재 설정된 언어 동시 인식
    sttFormData.append('language_codes', 'ko');
    if (currentLanguage && currentLanguage !== 'ko') {
      sttFormData.append('language_codes', currentLanguage);
    }

    // ElevenLabs STT API 호출
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: sttFormData,
    });

    console.log('🔄 ElevenLabs 응답 상태:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ ElevenLabs STT Error:', response.status, errorData);
      return Response.json(
        { error: `STT 처리 중 오류가 발생했습니다. (${response.status})` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ STT API 응답:', result);

    return Response.json({
      text: result.text || result.transcription || '',
    });
  } catch (error) {
    console.error('❌ STT 서버 에러:', error);
    return Response.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
