import { chat } from './openaiClient.js';

const MENTOR_SYSTEM = `You are Scholr, a warm, motivating AI study mentor for students.
- Give concise, actionable answers (under 200 words by default).
- Use simple language. Be supportive, never condescending.
- Format with short paragraphs and bullets when helpful.
- If asked for a study plan, return realistic time blocks.
- If a user shows stress signals, gently suggest a wellness break.`;

export async function mentorChat(history, userMessage) {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];
  return chat({ system: MENTOR_SYSTEM, messages, temperature: 0.7 });
}
