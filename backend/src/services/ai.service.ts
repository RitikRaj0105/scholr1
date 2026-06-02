import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/prisma.js';

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

export const explainTopic = async (topic: string, depth: 'brief' | 'detailed') => {
  if (!client) {
    return {
      explanation: 'AI is currently offline. Topic: ' + topic,
      analogy: 'N/A',
      summary: 'N/A',
      keyTakeaways: []
    };
  }

  const prompt = `Provide a ${depth} explanation of the topic: "${topic}".
Include a clear, vivid analogy to make it easy to understand.
Provide a summary and a list of key takeaways.
Output format must be JSON:
{
  "explanation": "string (markdown formatted explanation)",
  "analogy": "string (analogy to real life)",
  "summary": "string (one sentence summary)",
  "keyTakeaways": ["string", "string", ...]
}`;

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You are an expert tutor. Output strictly valid JSON matching the requested schema.' },
      { role: 'user', content: prompt }
    ]
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}');
};

export const generatePracticeQuiz = async (topic: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD', count: number) => {
  if (!client) {
    return {
      title: 'Practice Quiz',
      questions: [
        {
          prompt: 'Sample Question for ' + topic,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'Sample explanation'
        }
      ]
    };
  }

  const prompt = `Generate a ${difficulty} difficulty quiz on "${topic}" with ${count} multiple choice questions.
Output format must be JSON:
{
  "title": "string",
  "questions": [
    {
      "prompt": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string (exact match of the correct option)",
      "explanation": "string"
    }
  ]
}`;

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You are an expert quiz generator. Output strictly valid JSON matching the requested schema.' },
      { role: 'user', content: prompt }
    ]
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}');
};

export const generateLessonPlan = async (subject: string, topic: string, syllabus: string, targetDurationMinutes: number) => {
  if (!client) {
    return {
      title: 'Lesson Plan',
      objectives: ['Sample learning objective'],
      outline: [
        { timeframe: '0-10m', activity: 'Introduction', description: 'Introduce the topic' }
      ],
      homework: 'Sample homework task'
    };
  }

  const prompt = `Generate a lesson plan for Subject: "${subject}", Topic: "${topic}", matching Syllabus: "${syllabus}".
Target duration: ${targetDurationMinutes} minutes.
Output format must be JSON:
{
  "title": "string",
  "objectives": ["string", "string", ...],
  "outline": [
    {
      "timeframe": "string (e.g. 0-10 mins)",
      "activity": "string (title of phase)",
      "description": "string (what the teacher does)"
    }
  ],
  "homework": "string (suggested homework assignment)"
}`;

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You are an expert lesson planner for teachers. Output strictly valid JSON matching the requested schema.' },
      { role: 'user', content: prompt }
    ]
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}');
};

export const evaluateDescriptiveAnswer = async (questionPrompt: string, studentAnswer: string, sampleSolution: string | null) => {
  if (!client) {
    return {
      grade: 7,
      feedback: 'AI evaluation is offline. Feedback is simulated.',
      strengths: ['Answer was submitted'],
      improvements: ['Configure AI API key for actual evaluation']
    };
  }

  const prompt = `Evaluate the student's answer to the question.
Question: "${questionPrompt}"
Student's Answer: "${studentAnswer}"
${sampleSolution ? `Sample Solution / Criteria: "${sampleSolution}"` : ''}

Output format must be JSON:
{
  "grade": number (score from 0 to 10),
  "feedback": "string (detailed review of their answer)",
  "strengths": ["string", "string", ...],
  "improvements": ["string", "string", ...]
}`;

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    messages: [
      { role: 'system', content: 'You are an academic grader. Be fair, encouraging, and rigorous. Output strictly valid JSON.' },
      { role: 'user', content: prompt }
    ]
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}');
};

export const getClassroomAIAnalytics = async (classroomId: string) => {
  if (!client) {
    return {
      weakTopics: [
        { topic: 'Topic 1', averageScore: 60, recommendation: 'Revise fundamental concepts and exercises.' }
      ],
      atRiskStudents: [],
      classStatusSummary: 'AI analysis is offline. Please configure OPENAI_API_KEY.',
      remedialLearningPath: ['Read textbook chapters 1-3', 'Attempt practice quizzes']
    };
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              examAttempts: {
                where: { exam: { classroomId } },
                select: { score: true, exam: { select: { title: true, totalMarks: true } } }
              },
              submissions: {
                where: { assignment: { classroomId } },
                select: { marks: true, status: true, assignment: { select: { title: true, totalMarks: true } } }
              }
            }
          }
        }
      }
    }
  });

  if (!classroom) throw new Error('Classroom not found');

  const studentsSummary = classroom.enrollments.map(e => {
    const name = `${e.user.firstName} ${e.user.lastName}`;
    const attempts = e.user.examAttempts.map(a => `${a.exam.title}: ${a.score}/${a.exam.totalMarks}`);
    const submissions = e.user.submissions.map(s => `${s.assignment.title}: ${s.marks}/${s.assignment.totalMarks} (${s.status})`);
    return {
      name,
      id: e.user.id,
      attempts,
      submissions
    };
  });

  const prompt = `Analyze this classroom performance and generate academic insights.
Classroom Name: ${classroom.name}
Subject: ${classroom.subject || 'N/A'}
Number of Students: ${classroom.enrollments.length}

Students Performance Data:
${JSON.stringify(studentsSummary, null, 2)}

Provide a JSON response with the following format:
{
  "weakTopics": [
    {
      "topic": "string (name of weak topic/concept)",
      "averageScore": number (estimated percentage average e.g. 55),
      "recommendation": "string (remedial study action)"
    }
  ],
  "atRiskStudents": [
    {
      "studentName": "string",
      "studentId": "string",
      "reason": "string (why are they at risk? e.g. failing exam X or missing assignment Y)",
      "remedialAction": "string (specific action for this student)"
    }
  ],
  "classStatusSummary": "string (1-2 paragraph overview of how the class is doing overall)",
  "remedialLearningPath": [
    "string (step 1 of learning path)",
    "string (step 2 of learning path)"
  ]
}`;

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.4,
    messages: [
      { role: 'system', content: 'You are an educational analytics AI. Output strictly valid JSON matching the requested schema.' },
      { role: 'user', content: prompt }
    ]
  });

  const text = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text);
};
