import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let client = null;
export function getOpenAI() {
  if (!env.openai.apiKey) return null;
  if (!client) client = new OpenAI({ apiKey: env.openai.apiKey });
  return client;
}

/**
 * Chat completion with graceful fallback when no API key is configured.
 * Returns { content, tokens, mocked }.
 */
export async function chat({ system, messages, temperature = 0.7, json = false }) {
  const openai = getOpenAI();
  if (!openai) {
    return {
      content: mockResponse(messages, json),
      tokens: 0,
      mocked: true,
    };
  }
  try {
    const res = await openai.chat.completions.create({
      model: env.openai.model,
      temperature,
      response_format: json ? { type: 'json_object' } : undefined,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages,
      ],
    });
    const choice = res.choices[0];
    return {
      content: choice.message.content,
      tokens: res.usage?.total_tokens ?? null,
      mocked: false,
    };
  } catch (err) {
    logger.error({ err: err.message }, '[openai] failed; falling back');
    return { content: mockResponse(messages, json), tokens: 0, mocked: true };
  }
}

function mockResponse(messages, json) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (json) {
    return JSON.stringify({
      summary: `Mock response (no OPENAI_API_KEY). Echoing: ${last.slice(0, 120)}`,
      suggestions: [
        'Block social media for the next 25 minutes.',
        'Review your weakest topic for 20 minutes.',
        'Take a 5-minute breathing break.',
      ],
    });
  }
  return `🤖 (mock) Add OPENAI_API_KEY to enable real AI. You said: "${last.slice(0, 200)}"`;
}
