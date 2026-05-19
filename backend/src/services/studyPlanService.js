import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { generateStudyPlan } from '../ai/studyPlanner.js';

export const list = (userId) =>
  prisma.studyPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

export const get = async (userId, id) => {
  const plan = await prisma.studyPlan.findUnique({ where: { id }, include: { tasks: true } });
  if (!plan || plan.userId !== userId) throw ApiError.notFound('Plan not found');
  return plan;
};

export const create = async (userId, data) => {
  const ai = await generateStudyPlan({
    subjects: data.subjects, examDates: data.examDates,
    weakTopics: data.weakTopics, targetGrade: data.targetGrade,
    hoursPerDay: data.hoursPerDay, startDate: data.startDate,
    endDate: data.endDate, goal: data.goal,
  });
  return prisma.studyPlan.create({
    data: {
      userId,
      title: data.title,
      goal: data.goal,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      hoursPerDay: data.hoursPerDay || 2,
      weakTopics: data.weakTopics || [],
      targetGrade: data.targetGrade,
      aiPlan: ai.plan,
    },
  });
};

export const updateProgress = async (userId, id) => {
  const plan = await prisma.studyPlan.findUnique({ where: { id }, include: { tasks: true } });
  if (!plan || plan.userId !== userId) throw ApiError.notFound('Plan not found');
  const total = plan.tasks.length || 1;
  const done = plan.tasks.filter((t) => t.status === 'DONE').length;
  const progress = Math.round((done / total) * 100);
  return prisma.studyPlan.update({ where: { id }, data: { progress } });
};

export const remove = async (userId, id) => {
  const plan = await prisma.studyPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== userId) throw ApiError.notFound('Plan not found');
  await prisma.studyPlan.delete({ where: { id } });
  return { ok: true };
};
