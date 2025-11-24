export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return Response.json({ error: '오디오 파일이 필요합니다.' }, { status: 400 });
    }

    // FormData 생성
    const sttFormData = new FormData();
    sttFormData.append('audio', audioFile);

    // ElevenLabs STT API 호출
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: sttFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs STT Error:', errorData);
      return Response.json(
        { error: 'STT 처리 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return Response.json({
      text: result.text || '',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
