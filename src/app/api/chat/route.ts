import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

const openai = createOpenAI({
  // custom settings, e.g.
  compatibility: 'strict', // strict mode, enable when using the OpenAI API
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o-mini', {}),
    system: 'You are an expert of astrology.',
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
