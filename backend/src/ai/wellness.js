import { chat } from './openaiClient.js';

const SYSTEM = `You are Scholr's gentle wellness companion. Given recent mood/stress signals,
return STRICT JSON: { "insight": string, "tip": string, "exercise": string }.
Keep tone warm, never clinical. Avoid medical claims.`;

export async function wellnessInsight(recent) {
  const prompt = `Recent logs (latest first): ${JSON.stringify(recent.slice(0, 14))}`;
  const res = await chat({
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    json: true,
    temperature: 0.6,
  });
  try { return { ...JSON.parse(res.content), mocked: res.mocked }; }
  catch {
    return {
      insight: 'You have been consistent — keep listening to your body.',
      tip: 'Try a 5-minute box-breathing break before your next study block.',
      exercise: 'Inhale 4s · hold 4s · exhale 4s · hold 4s — repeat 6 times.',
      mocked: true,
    };
  }
}

export async function journalReflection(text) {
  const res = await chat({
    system: 'You reflect on a student\'s journal in 2-3 supportive sentences. No advice unless asked.',
    messages: [{ role: 'user', content: text }],
    temperature: 0.6,
  });
  return res.content;
}
