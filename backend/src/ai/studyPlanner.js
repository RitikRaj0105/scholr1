import { chat } from './openaiClient.js';

const SYSTEM = `You are Scholr's AI Study Planner. Generate realistic, personalized study plans.
Return STRICT JSON of shape:
{
  "summary": string,
  "weeklyRoadmap": [ { "week": number, "focus": string, "hours": number } ],
  "dailySchedule": [ { "day": string, "blocks": [ { "time": string, "subject": string, "topic": string, "minutes": number } ] } ],
  "revisionPlan": [ { "phase": string, "topics": string[] } ],
  "quizRecommendations": string[]
}`;

export async function generateStudyPlan(input) {
  const userPrompt = `Build a study plan for:
Subjects: ${(input.subjects || []).join(', ') || 'unspecified'}
Exam dates: ${(input.examDates || []).join(', ') || 'none'}
Weak topics: ${(input.weakTopics || []).join(', ') || 'none'}
Target grade: ${input.targetGrade || 'A'}
Hours/day available: ${input.hoursPerDay || 2}
Start: ${input.startDate}  End: ${input.endDate}
Goals: ${input.goal || ''}`;

  const res = await chat({
    system: SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
    json: true,
    temperature: 0.4,
  });
  let parsed;
  try { parsed = JSON.parse(res.content); }
  catch {
    parsed = {
      summary: 'Default plan generated.',
      weeklyRoadmap: [{ week: 1, focus: 'Foundations', hours: 7 * (input.hoursPerDay || 2) }],
      dailySchedule: [],
      revisionPlan: [],
      quizRecommendations: [],
    };
  }
  return { plan: parsed, mocked: res.mocked };
}
