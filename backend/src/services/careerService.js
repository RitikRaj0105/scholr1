import { prisma } from '../lib/prisma.js';
import { generateCareerInsights } from '../ai/career.js';

export const getProfile = async (userId) => {
  let profile = await prisma.careerProfile.findUnique({ where: { userId } });
  if (!profile) profile = await prisma.careerProfile.create({ data: { userId } });
  return profile;
};

export const updateProfile = async (userId, data) =>
  prisma.careerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

export const recompute = async (userId) => {
  const profile = await getProfile(userId);
  const ai = await generateCareerInsights(profile);
  return prisma.careerProfile.update({
    where: { userId },
    data: {
      topCareers: ai.topCareers,
      skillRoadmap: ai.skillRoadmap,
      collegeMatches: ai.collegeMatches,
      lastAssessedAt: new Date(),
    },
  });
};
