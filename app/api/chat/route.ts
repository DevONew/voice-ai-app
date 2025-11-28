import { Anthropic } from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/app/config/system-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 대화 히스토리에 사용자 메시지 추가
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages as any,
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return Response.json({
      response: assistantMessage,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens:
          (response.usage as any).cache_creation_input_tokens || 0,
        cache_read_input_tokens:
          (response.usage as any).cache_read_input_tokens || 0,
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
