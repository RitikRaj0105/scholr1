import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { NotFound } from '../utils/errors.js';
import { saveAvatar, deleteUploadedFile } from '../middleware/upload.js';

// ─── Safe select ──────────────────────────────

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  bannerUrl: true,
  bio: true,
  headline: true,
  role: true,
  phone: true,
  dob: true,
  gender: true,
  country: true,
  state: true,
  city: true,
  skills: true,
  githubUrl: true,
  linkedinUrl: true,
  portfolioUrl: true,
  websiteUrl: true,
  resumeUrl: true,
  profileData: true,
  onboardingDone: true,
  // Privacy
  showPhone: true,
  showEmail: true,
  showLocation: true,
  showDob: true,
  createdAt: true,
};

// Apply privacy filtering — when viewer isn't the profile owner, hide
// contact fields that the owner has chosen to keep private.
function applyPrivacy<T extends Record<string, any>>(user: T, isOwner: boolean): T {
  if (isOwner) return user;
  const filtered: any = { ...user };
  if (!filtered.showPhone) filtered.phone = null;
  if (!filtered.showEmail) filtered.email = null;
  if (!filtered.showDob) filtered.dob = null;
  if (!filtered.showLocation) {
    filtered.country = null;
    filtered.state = null;
    filtered.city = null;
  }
  return filtered as T;
}
// ─── Profile strength calculator ─────────────

export function calcProfileStrength(user: Record<string, unknown>): {
  score: number;
  missing: string[];
} {
  const checks: { label: string; key: string; weight: number }[] = [
    { label: 'Profile photo', key: 'avatarUrl', weight: 10 },
    { label: 'Cover banner', key: 'bannerUrl', weight: 5 },
    { label: 'Headline', key: 'headline', weight: 8 },
    { label: 'Bio / About', key: 'bio', weight: 8 },
    { label: 'Location', key: 'city', weight: 5 },
    { label: 'Phone number', key: 'phone', weight: 5 },
    { label: 'Skills', key: 'skills', weight: 10 },
    { label: 'LinkedIn URL', key: 'linkedinUrl', weight: 5 },
    { label: 'GitHub URL', key: 'githubUrl', weight: 5 },
    { label: 'Resume', key: 'resumeUrl', weight: 10 },
    { label: 'Role-specific details', key: 'profileData', weight: 12 },
  ];

  let earned = 0;
  const missing: string[] = [];

  for (const c of checks) {
    const val = user[c.key];
    const filled = Array.isArray(val)
      ? (val as unknown[]).length > 0
      : !!val;
    if (filled) earned += c.weight;
    else missing.push(c.label);
  }

  // Education / experience bonus (up to 12)
  const hasEducation = (user._educationCount as number) > 0;
  const hasExperience = (user._experienceCount as number) > 0;
  if (hasEducation) { earned += 6; }
  else missing.push('Education');
  if (hasExperience) { earned += 6; }
  else missing.push('Work experience / Internship');

  return { score: Math.min(earned, 100), missing: missing.slice(0, 5) };
}

// ─── Get profile ──────────────────────────────

export const getProfile = async (req: Request, res: Response) => {
  const viewerId = req.user?.id;
  const targetId = req.params.userId || viewerId;

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      ...publicUserSelect,
      education: { orderBy: { startYear: 'desc' } },
      workExperiences: { orderBy: { startDate: 'desc' } },
      certificates: { orderBy: { issuedAt: 'desc' } },
      serviceProfile: {
        select: {
          id: true,
          category: true,
          customCategory: true,
          displayName: true,
          hourlyRate: true,
          fixedPrice: true,
          priceUnit: true,
          avgRating: true,
          totalReviews: true,
          isActive: true,
          isVerified: true,
        }
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!user) throw NotFound('User not found');

  // Block check
  if (viewerId && viewerId !== targetId) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetId },
          { blockerId: targetId, blockedId: viewerId },
        ],
      },
    });
    if (block) throw NotFound('User not available');
  }

  // Compute strength
  const { score, missing } = calcProfileStrength({
    ...user,
    _educationCount: user.education.length,
    _experienceCount: user.workExperiences.length,
  });

  // Is viewer following?
  let isFollowedByMe = false;
  if (viewerId && viewerId !== targetId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    });
    isFollowedByMe = !!follow;
  }

  res.json({
    ok: true,
    profile: {
      ...applyPrivacy(user, viewerId === targetId),
      strengthScore: score,
      missingFields: missing,
      isMe: viewerId === targetId,
      isFollowedByMe,
    },
  });
};

// ─── Update basic profile ─────────────────────

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().max(60).optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  gender: z.string().max(30).optional(),
  country: z.string().max(60).optional(),
  state: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
  githubUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  // Privacy toggles
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  showDob: z.boolean().optional(),
});

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicUserSelect,
  });

  // Sync the service profile if one exists — keeps location, skills, name
  // consistent without the user having to update both places.
  const svcProfile = await prisma.serviceProfile.findUnique({
    where: { userId },
    select: { id: true, skills: true, serviceArea: true },
  });
  if (svcProfile) {
    const syncPatch: any = {};

    // If skills changed in main profile, merge into service skills
    if (data.skills) {
      const merged = Array.from(new Set([...(data.skills as string[]), ...(svcProfile.skills || [])]));
      syncPatch.skills = merged;
    }

    // If location changed and service profile didn't have a custom area, sync it
    if ((data.city || data.state) && !svcProfile.serviceArea) {
      const parts = [data.city || user.city, data.state || user.state].filter(Boolean);
      if (parts.length) syncPatch.serviceArea = parts.join(', ');
    }

    if (Object.keys(syncPatch).length > 0) {
      await prisma.serviceProfile.update({ where: { userId }, data: syncPatch });
    }
  }

  res.json({ ok: true, user });
};

// ─── Upload banner ────────────────────────────

export const uploadBanner = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  if (!req.file) throw new Error('No image uploaded');

  const { saveBannerImage } = await import('../middleware/upload.js');
  const url = await saveBannerImage(req.file);

  const old = await prisma.user.findUnique({ where: { id: userId }, select: { bannerUrl: true } });
  if (old?.bannerUrl?.startsWith('/uploads/')) await deleteUploadedFile(old.bannerUrl);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { bannerUrl: url },
    select: { id: true, bannerUrl: true },
  });
  res.json({ ok: true, user });
};

// ─── Upload resume ────────────────────────────

export const uploadResume = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  if (!req.file) throw new Error('No file uploaded');

  const { saveResume } = await import('../middleware/upload.js');
  const url = await saveResume(req.file);

  const old = await prisma.user.findUnique({ where: { id: userId }, select: { resumeUrl: true } });
  if (old?.resumeUrl?.startsWith('/uploads/')) await deleteUploadedFile(old.resumeUrl);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { resumeUrl: url },
    select: { id: true, resumeUrl: true },
  });
  res.json({ ok: true, user });
};

// ─── Update role-specific profile data ────────

const profileDataSchema = z.object({
  profileData: z.record(z.unknown()),
});

export const updateProfileData = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { profileData } = profileDataSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileData: profileData as any },
    select: publicUserSelect,
  });
  res.json({ ok: true, user });
};

// ─── Education CRUD ───────────────────────────

const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(100).optional(),
  field: z.string().max(100).optional(),
  startYear: z.number().int().min(1990).max(2040).optional(),
  endYear: z.number().int().min(1990).max(2040).optional(),
  current: z.boolean().optional(),
  grade: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export const addEducation = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = educationSchema.parse(req.body);
  const edu = await prisma.education.create({ data: { userId, ...data } });
  res.status(201).json({ ok: true, education: edu });
};

export const updateEducation = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = educationSchema.partial().parse(req.body);
  const edu = await prisma.education.findUnique({ where: { id: req.params.id } });
  if (!edu || edu.userId !== userId) throw NotFound('Education not found');
  const updated = await prisma.education.update({ where: { id: edu.id }, data });
  res.json({ ok: true, education: updated });
};

export const deleteEducation = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const edu = await prisma.education.findUnique({ where: { id: req.params.id } });
  if (!edu || edu.userId !== userId) throw NotFound('Education not found');
  await prisma.education.delete({ where: { id: edu.id } });
  res.json({ ok: true });
};

// ─── Work Experience CRUD ─────────────────────

const experienceSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  startDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  endDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  current: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

export const addExperience = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = experienceSchema.parse(req.body);
  const exp = await prisma.workExperience.create({ data: { userId, ...data } });
  res.status(201).json({ ok: true, experience: exp });
};

export const updateExperience = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = experienceSchema.partial().parse(req.body);
  const exp = await prisma.workExperience.findUnique({ where: { id: req.params.id } });
  if (!exp || exp.userId !== userId) throw NotFound('Experience not found');
  const updated = await prisma.workExperience.update({ where: { id: exp.id }, data });
  res.json({ ok: true, experience: updated });
};

export const deleteExperience = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const exp = await prisma.workExperience.findUnique({ where: { id: req.params.id } });
  if (!exp || exp.userId !== userId) throw NotFound('Experience not found');
  await prisma.workExperience.delete({ where: { id: exp.id } });
  res.json({ ok: true });
};

// ─── Profile strength ─────────────────────────

export const getStrength = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      _count: {
        select: { education: true, workExperiences: true },
      },
    },
  });
  if (!user) throw NotFound('User not found');

  const { score, missing } = calcProfileStrength({
    ...user,
    _educationCount: user._count.education,
    _experienceCount: user._count.workExperiences,
  });

  res.json({ ok: true, score, missing });
};

// ─── AI Profile Analysis ──────────────────────

export const getAIAnalysis = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      education: { orderBy: { startYear: 'desc' }, take: 3 },
      workExperiences: { orderBy: { startDate: 'desc' }, take: 3 },
      certificates: { take: 5, select: { title: true, issuer: true } },
    },
  });
  if (!user) throw NotFound('User not found');

  const { score, missing } = calcProfileStrength({
    ...user,
    _educationCount: user.education.length,
    _experienceCount: user.workExperiences.length,
  });

  // Build a compact profile summary for the AI
  const summary = `
Role: ${user.role}
Name: ${user.firstName || ''} ${user.lastName || ''}
Location: ${[user.city, user.state, user.country].filter(Boolean).join(', ') || 'Not specified'}
Skills: ${user.skills.join(', ') || 'None listed'}
Headline: ${user.headline || 'Not set'}
Education: ${user.education.map(e => `${e.institution} (${e.degree || 'degree'})`).join(', ') || 'None'}
Experience: ${user.workExperiences.map(e => `${e.role} at ${e.company}`).join(', ') || 'None'}
Certifications: ${user.certificates.map(c => c.title).join(', ') || 'None'}
GitHub: ${user.githubUrl ? 'Yes' : 'No'}
LinkedIn: ${user.linkedinUrl ? 'Yes' : 'No'}
Resume: ${user.resumeUrl ? 'Yes' : 'No'}
Profile Data: ${JSON.stringify(user.profileData || {})}
  `.trim();

  // Try Ollama for AI suggestions
  let suggestions: string[] = [];
  let careerSuggestions: string[] = [];
  let studyRecommendations: string[] = [];

  try {
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        model: 'mistral',
        stream: false,
        prompt: `You are an AI career counselor for the Scholr EdTech platform. Analyze this user profile and give specific, actionable advice.

${summary}

Profile completeness: ${score}%
Missing: ${missing.join(', ')}

Respond with ONLY a JSON object (no markdown, no extra text):
{
  "suggestions": ["3-5 profile improvement tips"],
  "careerSuggestions": ["3 specific career paths suited to this profile"],
  "studyRecommendations": ["2-3 learning resources or skills to acquire"],
  "internshipTips": ["1-2 internship or job search tips"],
  "strengthSummary": "One sentence summary of their profile strengths"
}`,
      }),
    });

    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const text = (data.response || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      suggestions = parsed.suggestions || [];
      careerSuggestions = parsed.careerSuggestions || [];
      studyRecommendations = parsed.studyRecommendations || [];
      const result = {
        ok: true,
        score,
        missing,
        suggestions,
        careerSuggestions,
        studyRecommendations,
        internshipTips: parsed.internshipTips || [],
        strengthSummary: parsed.strengthSummary || '',
        aiPowered: true,
      };
      return res.json(result);
    }
  } catch {
    // Ollama not available — use fallback
  }

  // Fallback: rule-based suggestions
  const fallbackSuggestions: string[] = [];
  if (!user.avatarUrl) fallbackSuggestions.push('Add a professional profile photo — profiles with photos get 14× more views');
  if (!user.bio) fallbackSuggestions.push('Write a compelling bio that describes who you are and what you\'re looking for');
  if (!user.skills.length) fallbackSuggestions.push('Add your skills — recruiters filter by skills, so list at least 5');
  if (!user.resumeUrl) fallbackSuggestions.push('Upload your resume or CV to make it easy for recruiters to reach you');
  if (!user.linkedinUrl) fallbackSuggestions.push('Connect your LinkedIn profile to build credibility');
  if (missing.includes('Education')) fallbackSuggestions.push('Add your education history — it\'s the #1 section recruiters look at');
  if (missing.includes('Work experience / Internship')) fallbackSuggestions.push('Add work experience or internships, even short ones count');

  const roleSuggestions: Record<string, string[]> = {
    STUDENT: ['Focus on academics and add your exam scores', 'Join Scholr coding challenges to build your portfolio', 'Add extracurricular activities and achievements'],
    COLLEGE_STUDENT: ['Apply for internships in your field', 'Build 2-3 projects to showcase on GitHub', 'Get AWS/Google certifications to stand out'],
    TEACHER: ['Document your teaching methodology and subject expertise', 'Add student success stories and achievements as impact metrics', 'List your qualifications and specialized training'],
    RECRUITER: ['Complete your company profile to attract better candidates', 'Post job openings to reach 10,000+ Scholr students', 'Use AI matching to find the best profiles'],
    WORKING_PROFESSIONAL: ['Update your current role and key achievements', 'Add metrics to your experience (e.g. "Increased revenue by 30%")', 'Enable job alerts for senior roles in your field'],
  };

  const roleSpecific = roleSuggestions[user.role] || roleSuggestions.COLLEGE_STUDENT;

  res.json({
    ok: true,
    score,
    missing,
    suggestions: fallbackSuggestions.slice(0, 4),
    careerSuggestions: roleSpecific,
    studyRecommendations: ['Take online courses on Coursera or NPTEL', 'Practice coding on LeetCode or HackerRank', 'Read industry blogs and follow thought leaders'],
    internshipTips: ['Apply 3 months before target start date', 'Customize each cover letter with the company\'s products or mission'],
    strengthSummary: score >= 70
      ? 'Your profile is looking strong! A few more additions will make it stand out.'
      : score >= 40
      ? 'Good start — filling in the missing sections will significantly boost your visibility.'
      : 'Your profile needs more detail to attract opportunities. Start with a photo and bio.',
    aiPowered: false,
  });
};

// ─── Onboarding (3-step signup) ───────────────

const step1Schema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  dob: z.string().optional().transform(v => v ? new Date(v) : undefined),
  gender: z.string().max(30).optional(),
  country: z.string().max(60).optional(),
  state: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
});

const step2Schema = z.object({
  role: z.enum([
    'STUDENT',
    'COLLEGE_STUDENT',
    'TEACHER',
    'PARENT',
    'RECRUITER',
    'WORKING_PROFESSIONAL',
  ]),
});

const step3Schema = z.object({
  profileData: z.record(z.unknown()),
  skills: z.array(z.string()).optional(),
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal('')).nullable(),
  portfolioUrl: z.string().url().optional().or(z.literal('')).nullable(),
  websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
}).passthrough();

export const onboardStep1 = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = step1Schema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...data },
    select: publicUserSelect,
  });
  res.json({ ok: true, user });
};

export const onboardStep2 = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { role } = step2Schema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: publicUserSelect,
  });
  res.json({ ok: true, user });
};

export const onboardStep3 = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parsed = step3Schema.parse(req.body);

const user = await prisma.user.update({
  where: { id: userId },
  data: {
    profileData: parsed.profileData as any,
    skills: parsed.skills || [],
    headline: parsed.headline || undefined,
    bio: parsed.bio || undefined,
    githubUrl: parsed.githubUrl || undefined,
    linkedinUrl: parsed.linkedinUrl || undefined,
    portfolioUrl: parsed.portfolioUrl || undefined,
    websiteUrl: parsed.websiteUrl || undefined,
    onboardingDone: true,
  },
  select: publicUserSelect,
});

  res.json({ ok: true, user });
};
