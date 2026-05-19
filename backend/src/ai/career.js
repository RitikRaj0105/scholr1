import { chat } from './openaiClient.js';

const SYSTEM = `You are Scholr's Career Compass. From a student's strengths, interests and values,
recommend top careers with a fit score (0-100), median salary range, key skills, and a 6-step roadmap.
Also recommend 5 colleges/programs aligned. Return STRICT JSON of shape:
{
  "topCareers": [ { "title": string, "fitScore": number, "salary": string, "skills": string[], "roadmap": string[] } ],
  "skillRoadmap": [ { "month": number, "focus": string, "resources": string[] } ],
  "collegeMatches": [ { "name": string, "country": string, "program": string, "fit": number } ]
}`;

export async function generateCareerInsights(profile) {
  const prompt = `Profile:
Strengths: ${profile.strengths?.join(', ')}
Interests: ${profile.interests?.join(', ')}
Values: ${profile.values?.join(', ')}
Personality: ${profile.personalityType || 'unspecified'}`;

  const res = await chat({
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    json: true,
    temperature: 0.5,
  });
  try { return { ...JSON.parse(res.content), mocked: res.mocked }; }
  catch {
    return {
      topCareers: [
        { title: 'Software Engineer', fitScore: 88, salary: '$70k-$160k', skills: ['Algorithms', 'JavaScript', 'System design'], roadmap: ['Master fundamentals', 'Build 3 projects', 'Open source', 'Internship', 'Specialize', 'Apply'] },
      ],
      skillRoadmap: [],
      collegeMatches: [],
      mocked: true,
    };
  }
}
