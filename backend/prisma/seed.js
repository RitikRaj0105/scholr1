import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Scholr123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scholr.app' },
    update: {},
    create: {
      email: 'admin@scholr.app',
      username: 'admin',
      name: 'Scholr Admin',
      password,
      role: 'ADMIN',
      emailVerified: true,
      level: 5, xp: 5000,
      preferences: { create: {} },
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@scholr.app' },
    update: {},
    create: {
      email: 'demo@scholr.app',
      username: 'demo',
      name: 'Demo Student',
      password,
      role: 'STUDENT',
      emailVerified: true,
      level: 3, xp: 1200,
      streakCount: 7,
      preferences: { create: {} },
    },
  });

  // Default blocked sites
  const sites = ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com', 'discord.com', 'snapchat.com', 'twitter.com', 'x.com'];
  for (const domain of sites) {
    await prisma.blockedSite.upsert({
      where: { userId_domain: { userId: demo.id, domain } },
      create: { userId: demo.id, domain, category: 'social' },
      update: {},
    });
  }

  // Life skill lessons
  const lessons = [
    { category: 'productivity', title: 'The 2-Minute Rule', description: 'Do it now if it takes <2 min.', content: '## The 2-Minute Rule\nIf a task takes under two minutes, do it now.', order: 0 },
    { category: 'productivity', title: 'Time Blocking 101', description: 'Plan your day in time blocks.', content: '## Time Blocking\nAssign every minute a job.', order: 1 },
    { category: 'budgeting', title: '50/30/20 Budgeting', description: 'Needs / wants / savings.', content: '## 50/30/20\nA simple monthly framework.', order: 0 },
    { category: 'budgeting', title: 'Building Your Emergency Fund', description: 'Save 3-6 months expenses.', content: '## Emergency Fund\nBuild liquidity for shocks.', order: 1 },
    { category: 'networking', title: 'How to Cold Email', description: 'Win replies in 3 paragraphs.', content: '## Cold Emails\nPersonalize, value, ask.', order: 0 },
    { category: 'confidence', title: 'Power Posing', description: 'Body shapes mind.', content: '## Power Posing\n2 minutes, big change.', order: 0 },
    { category: 'communication', title: 'The STAR Method', description: 'Structure storytelling.', content: '## STAR\nSituation, Task, Action, Result.', order: 0 },
  ];
  for (const l of lessons) {
    await prisma.lifeSkillLesson.upsert({
      where: { id: `${l.category}-${l.order}` },
      create: { id: `${l.category}-${l.order}`, ...l },
      update: l,
    });
  }

  // Achievements
  const achievements = [
    { code: 'first_focus', name: 'First Focus', description: 'Complete your first focus session.', icon: '🎯', xpReward: 50 },
    { code: 'streak_7', name: 'Week Warrior', description: '7-day focus streak.', icon: '🔥', xpReward: 200 },
    { code: 'streak_30', name: 'Habit Master', description: '30-day focus streak.', icon: '🏆', xpReward: 1000 },
    { code: 'planner_first', name: 'Plan Your Climb', description: 'Generate your first AI plan.', icon: '🧭', xpReward: 100 },
    { code: 'mood_tracker', name: 'Mindful Student', description: 'Log mood 7 days in a row.', icon: '🧘', xpReward: 150 },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: a,
    });
  }

  console.log('✅ Seeded.\n  Admin: admin@scholr.app / Scholr123!\n  Demo:  demo@scholr.app  / Scholr123!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
