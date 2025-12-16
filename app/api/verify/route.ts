// app/api/verify-password/route.ts

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // 환경변수에서 비밀번호 가져오기
    const correctPassword = process.env.OWNER_PASSWORD || 'demo123';

    const isValid = password === correctPassword;

    return Response.json({ 
      valid: isValid,
      message: isValid ? '인증 성공' : '비밀번호가 틀렸습니다'
    });

  } catch (error) {
    return Response.json(
      { valid: false, message: '오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
