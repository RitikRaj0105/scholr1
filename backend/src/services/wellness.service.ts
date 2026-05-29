import { prisma } from '../config/prisma.js';
// @ts-ignore
import { wellnessInsight, journalReflection } from '../ai/wellness.js';
import { NotFound, Forbidden } from '../utils/errors.js';
import type { MoodLevel } from '@prisma/client';

export const logMood = async (userId: string, data: { mood: MoodLevel; note?: string; stress?: number; energy?: number }) => {
  return prisma.moodLog.create({
    data: {
      userId,
      mood: data.mood,
      note: data.note,
      // If schema supports stress/energy we can add them to Json or write to model
    },
  });
};

export const listMoods = async (userId: string, days = 30) => {
  return prisma.moodLog.findMany({
    where: {
      userId,
      loggedAt: { gte: new Date(Date.now() - days * 86400000) },
    },
    orderBy: { loggedAt: 'asc' },
  });
};

export const insight = async (userId: string) => {
  const recent = await prisma.moodLog.findMany({
    where: { userId },
    orderBy: { loggedAt: 'desc' },
    take: 14,
  });
  return wellnessInsight(recent);
};

export const listJournals = async (userId: string) => {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createJournal = async (userId: string, data: { content: string; title?: string }) => {
  const reflection = await journalReflection(data.content).catch(() => null);
  return prisma.journalEntry.create({
    data: {
      userId,
      content: data.content,
      title: data.title ?? 'Reflection Journal',
      aiInsight: reflection,
    },
  });
};

export const removeJournal = async (userId: string, id: string) => {
  const j = await prisma.journalEntry.findUnique({ where: { id } });
  if (!j || j.userId !== userId) throw NotFound('Journal entry not found');
  await prisma.journalEntry.delete({ where: { id } });
  return { ok: true };
};

// ─── Wellness Overview Dashboard ───────────────────
export const getDashboardData = async (userId: string) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [moods, focusSessions, tasks, examAttempts, user, personalExams] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'desc' },
    }),
    prisma.focusSession.findMany({
      where: { userId, status: 'COMPLETED', startedAt: { gte: weekAgo } },
    }),
    prisma.task.findMany({
      where: { userId },
    }),
    prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
    }),
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.personalExam.findMany({
      where: { userId, examDate: { gte: now } },
      orderBy: { examDate: 'asc' },
      take: 1,
    }),
  ]);

  // Parse User Profile Data
  const profile = (user?.profileData as Record<string, any>) || {};
  const goalExam = profile.studyGoals || 'Competitive Exams';
  const weakSubjects = profile.weakSubjects || ['Physics'];
  const strongSubjects = profile.favoriteSubjects || ['Biology', 'English'];

  // 1. Calculate Study Consistency
  const activeDays = new Set(focusSessions.map(s => s.startedAt.toISOString().slice(0, 10)));
  const studyConsistency = Math.round((activeDays.size / 7) * 100);

  // 2. Exam Countdown
  let examCountdownDays = 15; // default fallback
  let examName = goalExam;
  if (personalExams.length > 0) {
    const diffTime = Math.abs(personalExams[0].examDate.getTime() - now.getTime());
    examCountdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    examName = personalExams[0].title;
  } else {
    // Try to guess from text
    const textMatch = goalExam.match(/202\d/);
    if (textMatch) {
      const year = parseInt(textMatch[0]);
      const targetDate = new Date(year, 5, 15); // June 15 of that year
      const diffTime = targetDate.getTime() - now.getTime();
      if (diffTime > 0) {
        examCountdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
  }

  // 3. Syllabus Completion
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const syllabusCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 62;

  // 4. Stress and Burnout Risk Calculation
  let stressLevel = 30; // base
  let burnoutRisk = 20; // base

  // Adjust for Mood
  if (moods.length > 0) {
    const lowMoodsCount = moods.filter(m => m.mood === 'TERRIBLE' || m.mood === 'LOW').length;
    stressLevel += lowMoodsCount * 15;
    burnoutRisk += lowMoodsCount * 10;
  }

  // Adjust for excessive study duration (> 8 hours / day average in focus mode)
  const totalMinutes = focusSessions.reduce((sum, s) => sum + (s.actualMin || 0), 0);
  const avgDailyMinutes = totalMinutes / 7;
  if (avgDailyMinutes > 480) { // 8 hours
    stressLevel += 25;
    burnoutRisk += 35;
  } else if (avgDailyMinutes > 360) { // 6 hours
    stressLevel += 15;
    burnoutRisk += 20;
  }

  // Adjust for poor test performance (declining scores)
  let performanceDrop = false;
  if (examAttempts.length >= 2) {
    const scores = examAttempts.map(ea => ea.score || 0);
    if (scores[0] < scores[1] && scores[0] < 50) {
      performanceDrop = true;
      stressLevel += 15;
    }
  }

  // Caps
  stressLevel = Math.max(10, Math.min(100, stressLevel));
  burnoutRisk = Math.max(5, Math.min(100, burnoutRisk));

  // Determine stress risk status
  let stressStatus = 'Stable';
  if (stressLevel > 75) stressStatus = 'High Stress';
  else if (stressLevel > 45) stressStatus = 'Mild Stress';

  if (burnoutRisk > 70) stressStatus = 'Burnout Risk';

  // Recent mood trends
  const moodTrends = moods.slice(0, 7).map(m => ({
    date: m.loggedAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
    score: m.mood === 'TERRIBLE' ? 1 : m.mood === 'LOW' ? 2 : m.mood === 'NEUTRAL' ? 3 : m.mood === 'GOOD' ? 4 : 5,
    level: m.mood,
  })).reverse();

  // AI Wellness Insight Trigger
  const aiInsight = await wellnessInsight(moods).catch(() => ({
    insight: 'You have been consistent with studies. Remember to schedule small breaks to optimize retention.',
    tip: 'Practice the 4-7-8 breathing method when feeling overwhelmed.',
    exercise: 'Inhale for 4s, hold for 7s, exhale for 8s. Repeat 4 times.',
  }));

  // Recommendations generator
  const recommendations: string[] = [];
  if (stressLevel > 60) {
    recommendations.push('Schedule a lighter study block tomorrow with focus on revision rather than new topics.');
    recommendations.push('Try a 10-minute guided breathing session before starting your next mock exam.');
  } else {
    recommendations.push('Maintain your current steady pace. You are studying with high consistency.');
  }

  if (avgDailyMinutes > 420) {
    recommendations.push('Your daily focus time is high. Consider setting strict blockades on study sessions after 10 PM.');
  }

  return {
    stressLevel,
    burnoutRisk,
    stressStatus,
    studyConsistency,
    examCountdown: {
      days: examCountdownDays,
      examName,
    },
    syllabusCompletion,
    weakSubjects,
    strongSubjects,
    moodTrends,
    aiInsight,
    recommendations,
    performanceDrop,
  };
};

// ─── Study Intelligence System ─────────────────────
export const getStudyIntelligence = async (userId: string) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [focusSessions, examAttempts] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId, status: 'COMPLETED', startedAt: { gte: weekAgo } },
    }),
    prisma.examAttempt.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  // Calculate study hours per subject
  const subjectHours: Record<string, number> = {};
  focusSessions.forEach(s => {
    const sub = s.subject || 'General Study';
    subjectHours[sub] = (subjectHours[sub] || 0) + (s.actualMin || 0) / 60;
  });

  const subjectBreakdown = Object.entries(subjectHours).map(([subject, hours]) => ({
    subject,
    hours: Math.round(hours * 10) / 10,
  }));

  // Accuracy trends and mock test performance
  const mockAttempts = examAttempts.filter(ea => ea.exam.type === 'MOCK' || ea.exam.type === 'COMPETITIVE');
  const accuracyTrends = mockAttempts.map((ea, idx) => ({
    name: ea.exam.title.slice(0, 10) || `Test ${mockAttempts.length - idx}`,
    score: Math.round((ea.score || 0) * 10) / 10,
  })).reverse();

  // Topics masteries
  const weakTopics = ['Organic Chemistry (Reaction Mechanism)', 'Rotational Mechanics (Moment of Inertia)'];
  const strongestTopics = ['Cell Biology (Mitosis)', 'Vector Algebra', 'Current Electricity'];
  
  // Calculate predicted readiness score
  let totalScore = 0;
  mockAttempts.forEach(ea => { totalScore += (ea.score || 0); });
  const avgScore = mockAttempts.length > 0 ? (totalScore / mockAttempts.length) : 65;
  const predictedReadinessScore = Math.round(avgScore * 0.9 + 5); // scale slightly

  return {
    subjectBreakdown,
    accuracyTrends,
    weakTopics,
    strongestTopics,
    predictedReadinessScore,
    revisionFrequency: mockAttempts.length,
  };
};

// ─── Career Guidance System ───────────────────────
export const getCareerGuidance = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const profile = (user?.profileData as Record<string, any>) || {};
  const goalExam = profile.studyGoals || 'NEET/JEE';

  // Analyze goal and suggest alternate + primary paths
  const isNeet = /neet/i.test(goalExam) || /medical/i.test(goalExam) || /biology/i.test(goalExam);
  const isJee = /jee/i.test(goalExam) || /iit/i.test(goalExam) || /engineering/i.test(goalExam);
  
  let primaryPath = 'Technical / Engineering Management';
  let alternatePaths = [
    { title: 'Biotechnology & Genetics Research', desc: 'Combines analytical problem-solving with biological sciences. Extremely high growth in biomedical sectors.' },
    { title: 'Healthcare Analytics / Bioinformatics', desc: 'Use statistics and software to analyze biological data. Great crossover for analytical minds.' },
    { title: 'Biomedical Engineering & Devices', desc: 'Design artificial organs, medical equipment, and software applications for clinical settings.' },
  ];

  if (isNeet) {
    primaryPath = 'Medical Studies (MBBS/BDS)';
  } else if (isJee) {
    primaryPath = 'Computer Science & Engineering';
    alternatePaths = [
      { title: 'Data Science & FinTech', desc: 'Applies rigorous mathematical modeling and programming to modern finance. High demand and pay.' },
      { title: 'Product Design (UI/UX)', desc: 'For students with strong analytical thinking who also have creative interests. Blends technology with human psychology.' },
      { title: 'Robotics & Automation Engineering', desc: 'High synergy with physics. Focuses on drone tech, industrial automation, and robotic surgical arms.' },
    ];
  } else {
    // General competitive exams (UPSC/Banking)
    primaryPath = 'Civil Services / Public Policy';
    alternatePaths = [
      { title: 'Corporate Consulting & Strategy', desc: 'Excellent pathway utilizing deep knowledge of public regulations and analytical thinking.' },
      { title: 'Academic Research / Content Development', desc: 'High-affinity backup for general knowledge experts. Involves subject matter expertise.' },
      { title: 'NGO Leadership & Sustainable Development', desc: 'Work with international foundations on community impact projects. High job satisfaction.' },
    ];
  }

  return {
    goalExam,
    primaryPath,
    alternatePaths,
    strengths: ['Analytical thinking', 'Problem solving', 'Logical deduction'],
    backupPlan: `If you feel the pressure of ${goalExam} is limiting your potential, transitioning early to these fields offers rewarding career trajectories without the extreme entrance cut-offs.`,
  };
};

// ─── Recovery Mode ─────────────────────────────────
export const getRecoveryMode = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const profile = (user?.profileData as Record<string, any>) || {};
  const goalExam = profile.studyGoals || 'NEET/JEE';

  const recoveryGuidance = `It is completely natural to feel disappointed after underperforming. A single test score is a metric of preparation, not your cognitive ceiling. Realignment is a normal part of all successful careers.`;

  const alternateOpportunities = [
    { name: 'KVPY & IISER Aptitude Test (IAT)', details: 'Offers direct entry into elite scientific research institutes (IISERs, IISc) with focus on pure sciences.' },
    { name: 'State Level Entrance Tests (CETs)', details: 'Highly reputable state engineering and pharmacy colleges with realistic cutoffs.' },
    { name: 'Private University Merit Scholarships', details: 'Institutes like BITS, Shiv Nadar, and Ashoka offer substantial financial waivers for analytical minds.' },
  ];

  const skillPathways = [
    { name: 'Full-Stack Web Development', link: '/dashboard/wellness?tab=skills', duration: '6 months roadmap' },
    { name: 'UX Research & Design Foundations', link: '/dashboard/wellness?tab=skills', duration: '3 months roadmap' },
  ];

  return {
    goalExam,
    recoveryGuidance,
    alternateOpportunities,
    skillPathways,
  };
};

// ─── Parent Insights System ────────────────────────
export const getParentPermissions = async (studentId: string) => {
  return prisma.parentStudent.findMany({
    where: { studentId },
    include: { parent: { select: { firstName: true, lastName: true, email: true } } },
  });
};

export const updateParentPermissions = async (
  studentId: string,
  parentId: string,
  permissions: { allowAcademic: boolean; allowAttendance: boolean; allowStress: boolean; allowAptitude: boolean }
) => {
  return prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    update: permissions,
    create: {
      parentId,
      studentId,
      status: 'APPROVED',
      ...permissions,
    },
  });
};

export const getChildReportForParent = async (parentId: string, studentId: string) => {
  const relationship = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
  });

  if (!relationship || relationship.status !== 'APPROVED') {
    throw Forbidden('Access denied. No approved connection established.');
  }

  // Fetch student data
  const [user, focusSessions, attendanceRecords, examAttempts, moodLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId } }),
    relationship.allowAcademic ? prisma.focusSession.findMany({ where: { userId: studentId, status: 'COMPLETED' }, take: 15 }) : Promise.resolve([]),
    relationship.allowAttendance ? prisma.attendanceRecord.findMany({ where: { userId: studentId } }) : Promise.resolve([]),
    relationship.allowAcademic ? prisma.examAttempt.findMany({ where: { userId: studentId } }) : Promise.resolve([]),
    relationship.allowStress ? prisma.moodLog.findMany({ where: { userId: studentId }, take: 7 }) : Promise.resolve([]),
  ]);

  const report: Record<string, any> = {
    studentName: `${user?.firstName} ${user?.lastName}`,
    allowedAreas: {
      academic: relationship.allowAcademic,
      attendance: relationship.allowAttendance,
      stress: relationship.allowStress,
      aptitude: relationship.allowAptitude,
    },
  };

  if (relationship.allowAcademic) {
    const totalMinutes = focusSessions.reduce((sum, s) => sum + (s.actualMin || 0), 0);
    report.studyHours = Math.round((totalMinutes / 60) * 10) / 10;
    report.testCount = examAttempts.length;
  }

  if (relationship.allowAttendance) {
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    report.attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;
  }

  if (relationship.allowStress) {
    // Generate parent-friendly general status
    let stressStatus = 'Steady Progress';
    const recentLow = moodLogs.filter(m => m.mood === 'TERRIBLE' || m.mood === 'LOW').length;
    if (recentLow >= 3) {
      stressStatus = 'Needs Encouraging Break';
    }
    report.stressStatus = stressStatus;
  }

  return report;
};

// ─── Wellness Community ────────────────────────────
export const getCommunityChannels = async () => {
  let channels = await prisma.wellnessChannel.findMany();
  if (channels.length === 0) {
    // Seed default channels
    channels = await Promise.all([
      prisma.wellnessChannel.create({ data: { name: 'Anonymous Venting Corner', description: 'Share your struggles, fears, and exams pressures anonymously without judgment.', isAnonymous: true } }),
      prisma.wellnessChannel.create({ data: { name: 'NEET Aspirants Peer Support', description: 'Connect with medical aspirants studying together in India.' } }),
      prisma.wellnessChannel.create({ data: { name: 'JEE Prep Motivation & Chill', description: 'Group for tech aspirants to share plans and de-stress.' } }),
      prisma.wellnessChannel.create({ data: { name: 'UPSC & Civil Services Circle', description: 'Discuss long preparation cycles, consistency strategies, and mental recovery.' } }),
    ]);
  }
  return channels;
};

export const getChannelThreads = async (channelId: string) => {
  return prisma.wellnessThread.findMany({
    where: { channelId },
    include: {
      user: { select: { id: true, firstName: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createThread = async (
  userId: string,
  channelId: string,
  data: { title: string; content: string; isAnonymous?: boolean }
) => {
  const channel = await prisma.wellnessChannel.findUnique({ where: { id: channelId } });
  if (!channel) throw NotFound('Channel not found');

  const isAnon = channel.isAnonymous || !!data.isAnonymous;

  // Simple automated moderation check
  const contentLower = (data.title + ' ' + data.content).toLowerCase();
  const toxicWords = ['bullying', 'toxicphrase1', 'suicide', 'self-harm']; // extended list in production
  let moderatedContent = data.content;
  if (toxicWords.some(w => contentLower.includes(w))) {
    // Flag or warn (or filter words)
    moderatedContent = moderatedContent.replace(/suicide|self-harm/gi, '***');
  }

  return prisma.wellnessThread.create({
    data: {
      channelId,
      userId,
      title: data.title,
      content: moderatedContent,
      isAnonymous: isAnon,
    },
  });
};

export const getThreadDetails = async (threadId: string) => {
  return prisma.wellnessThread.findUnique({
    where: { id: threadId },
    include: {
      user: { select: { id: true, firstName: true, avatarUrl: true } },
      comments: {
        include: { user: { select: { id: true, firstName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const createComment = async (
  userId: string,
  threadId: string,
  data: { content: string; isAnonymous?: boolean }
) => {
  const thread = await prisma.wellnessThread.findUnique({ where: { id: threadId } });
  if (!thread) throw NotFound('Thread not found');

  const isAnon = thread.isAnonymous || !!data.isAnonymous;

  return prisma.wellnessComment.create({
    data: {
      threadId,
      userId,
      content: data.content,
      isAnonymous: isAnon,
    },
  });
};
