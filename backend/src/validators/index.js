import { z } from 'zod';

export const idParam = z.object({ id: z.string().min(1) });

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  studyPlanId: z.string().optional().nullable(),
});

export const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000).default(''),
  courseId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export const examSchema = z.object({
  title: z.string().min(1),
  date: z.string().datetime(),
  weight: z.number().optional(),
  notes: z.string().optional(),
  courseId: z.string().optional().nullable(),
});

export const studyPlanSchema = z.object({
  title: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  hoursPerDay: z.number().min(0.25).max(16).optional(),
  weakTopics: z.array(z.string()).optional(),
  targetGrade: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  examDates: z.array(z.string()).optional(),
});

export const focusStartSchema = z.object({
  mode: z.enum(['POMODORO', 'DEEP_WORK', 'CUSTOM']).default('POMODORO'),
  plannedMin: z.number().int().min(5).max(240),
  notes: z.string().optional(),
});

export const focusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED']).optional(),
  actualMin: z.number().int().optional(),
  distractions: z.number().int().optional(),
  productivity: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const blockedSiteSchema = z.object({
  domain: z.string().min(2),
  category: z.string().optional(),
  enabled: z.boolean().optional(),
  scheduleStart: z.number().int().optional().nullable(),
  scheduleEnd: z.number().int().optional().nullable(),
});

export const moodSchema = z.object({
  mood: z.enum(['TERRIBLE', 'BAD', 'OKAY', 'GOOD', 'GREAT']),
  stress: z.number().int().min(0).max(10).optional(),
  energy: z.number().int().min(0).max(10).optional(),
  note: z.string().optional(),
});

export const journalSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.enum(['TERRIBLE', 'BAD', 'OKAY', 'GOOD', 'GREAT']).optional(),
  prompt: z.string().optional(),
});

export const careerProfileSchema = z.object({
  strengths: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  personalityType: z.string().optional(),
});

export const aiChatSchema = z.object({
  chatId: z.string().optional(),
  context: z.enum(['mentor', 'planner', 'wellness', 'career']).default('mentor'),
  message: z.string().min(1).max(4000),
});

export const studyRoomSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  topic: z.string().optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(100).optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const friendActionSchema = z.object({
  userId: z.string().min(1),
});

export const challengeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  metric: z.enum(['focusMin', 'tasksDone', 'xp']),
  goal: z.number().int().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const listingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['NOTES', 'COURSE', 'EBOOK', 'TUTORING', 'TEMPLATE', 'OTHER']).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  thumbnail: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const preferencesSchema = z.object({
  theme: z.string().optional(),
  emailDigest: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  focusReminders: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  aiSuggestions: z.boolean().optional(),
  language: z.string().optional(),
  studyStartHour: z.number().int().min(0).max(23).optional(),
  studyEndHour: z.number().int().min(0).max(23).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
});
