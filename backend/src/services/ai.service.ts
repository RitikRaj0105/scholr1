import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type MentorMode = 'general' | 'study' | 'career' | 'wellness' | 'coding';

const SYSTEM_PROMPTS: Record<MentorMode, string> = {
  general: `You are Scholr, an AI mentor for students. You are warm, sharp, and practical.
Keep answers concise unless the student asks for depth. Encourage critical thinking — when
a student asks for an answer, you may give it, but also briefly show the reasoning so they learn.
Refuse to do assessments or graded work for the student — instead, walk them through it.`,

  study: `You are Scholr's Study Coach. Help the student plan, summarize, and master material.
When asked to summarize, use bullet structure. When asked to plan, output realistic schedules.
When teaching concepts, use vivid analogies and worked examples. Always end with one short
check-for-understanding question.`,

  career: `You are Scholr's Career Compass. Help the student think about skills, roles, and pathways.
Be specific (name companies, courses, projects) and avoid generic platitudes. When asked for a
roadmap, output it as ordered phases with tangible milestones.`,

  wellness: `You are Scholr's Wellness companion. You are not a therapist and you say so when relevant.
You listen, validate, and offer evidence-based coping strategies (breathing, journaling,
sleep hygiene, social connection). If the student expresses self-harm ideation, you provide
crisis resources and gently urge them to talk to a trusted adult or professional.`,

  coding: `You are Scholr's Coding Tutor. Teach the student, don't just hand them code.
For algorithm questions, first clarify constraints, then sketch the approach, THEN the code.
Always include time/space complexity. Use idiomatic code in the requested language.`,
};

const client = env.OPENAI_API_KEY
  ? new OpenAI({
     apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL || undefined,
     })
  : null;

export const isAiEnabled = () => client !== null;

export interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Async iterable of text deltas. Caller is responsible for forwarding to SSE / WebSocket.
 */
export async function* streamCompletion(
  history: ChatMsg[],
  mode: MentorMode = 'general',
): AsyncIterable<string> {
  if (!client) {
    yield "AI is not configured on this server. Set OPENAI_API_KEY in your environment.";
    return;
  }

  const stream = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    stream: true,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS[mode] },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/**
 * Non-streaming completion — used for background jobs (test generation, summaries).
 * Returns the full text.
 */
export const completion = async (
  history: ChatMsg[],
  mode: MentorMode = 'general',
): Promise<string> => {
  if (!client) {
    logger.warn('AI completion requested but OPENAI_API_KEY not set');
    return 'AI is not configured on this server.';
  }

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS[mode] },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return res.choices[0]?.message?.content ?? '';
};

/**
 * Generate a structured exam — returns parsed JSON or throws.
 * Uses OpenAI's JSON mode for reliable structure.
 */
export const generateExam = async (params: {
  subject: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  count: number;
  type: 'MCQ' | 'MIXED';
}) => {
  if (!client) throw new Error('OPENAI_API_KEY not configured');

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert exam generator. Output strictly valid JSON matching the requested schema. No commentary.',
      },
      {
        role: 'user',
        content: `Generate ${params.count} ${params.difficulty} questions on "${params.subject}".
Type: ${params.type}.
Output schema:
{
  "title": string,
  "questions": [
    {
      "prompt": string,
      "type": "MCQ" | "DESCRIPTIVE",
      "options": [string, string, string, string] | null,
      "correctAnswer": string,
      "explanation": string,
      "marks": number,
      "topic": string
    }
  ]
}`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text);
};
