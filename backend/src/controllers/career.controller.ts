import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// ─── Static career catalog ──────────────────────
// No DB model needed — curated data, fast to iterate

interface Career {
  slug: string;
  title: string;
  icon: string;
  category: 'tech' | 'science' | 'business' | 'creative' | 'healthcare';
  description: string;
  salaryRange: string;
  growthRate: string;
  demandLevel: 'high' | 'medium' | 'low';
  skills: string[];
  education: string[];
  roadmap: string[];
  relatedSubjects: string[]; // maps to exam types for matching
}

const CAREERS: Career[] = [
  {
    slug: 'ai-ml-engineer',
    title: 'AI / ML Engineer',
    icon: '🤖',
    category: 'tech',
    description:
      'Design and deploy machine learning models that power intelligent systems — recommendation engines, autonomous vehicles, NLP chatbots, computer vision. One of the fastest-growing and highest-paying engineering roles globally.',
    salaryRange: '₹12–50 LPA',
    growthRate: '+34% yoy',
    demandLevel: 'high',
    skills: ['Python', 'Linear Algebra', 'Statistics', 'PyTorch/TensorFlow', 'Data Structures', 'Calculus'],
    education: ['BTech CS/AI', 'MTech AI/ML', 'Online specializations (Andrew Ng, fast.ai)'],
    roadmap: ['Master Python + NumPy', 'Learn linear algebra & statistics', 'Take Andrew Ng\'s ML course', 'Build 3 projects (NLP, CV, recommendation)', 'Contribute to open-source ML', 'Apply for ML internships'],
    relatedSubjects: ['math', 'physics', 'cs', 'coding'],
  },
  {
    slug: 'full-stack-developer',
    title: 'Full Stack Developer',
    icon: '💻',
    category: 'tech',
    description:
      'Build web applications end-to-end — from the user interface to the server and database. High demand across every industry. Remote-friendly with strong freelancing potential.',
    salaryRange: '₹8–35 LPA',
    growthRate: '+22% yoy',
    demandLevel: 'high',
    skills: ['JavaScript/TypeScript', 'React', 'Node.js', 'SQL/NoSQL', 'Git', 'REST APIs'],
    education: ['BTech CS/IT', 'Self-taught (very viable)', 'Bootcamps'],
    roadmap: ['Learn HTML/CSS/JS fundamentals', 'Build projects with React', 'Learn Node.js + Express', 'Master databases (SQL + MongoDB)', 'Deploy apps on Vercel/Railway', 'Build a portfolio of 5 live projects'],
    relatedSubjects: ['cs', 'coding', 'math'],
  },
  {
    slug: 'data-scientist',
    title: 'Data Scientist',
    icon: '📊',
    category: 'tech',
    description:
      'Extract insights from large datasets using statistics, machine learning, and visualization. Critical role in every data-driven company — from startups to FAANG.',
    salaryRange: '₹10–40 LPA',
    growthRate: '+28% yoy',
    demandLevel: 'high',
    skills: ['Python/R', 'Statistics', 'SQL', 'Machine Learning', 'Data Visualization', 'Communication'],
    education: ['BTech + MTech (Stats/CS)', 'MSc Statistics', 'Online programs'],
    roadmap: ['Master Python + Pandas + Matplotlib', 'Learn statistics deeply', 'SQL for data querying', 'Kaggle competitions (3-5)', 'Build end-to-end data projects', 'Internship at a data-driven company'],
    relatedSubjects: ['math', 'cs', 'coding'],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    icon: '🔒',
    category: 'tech',
    description:
      'Protect organizations from cyber threats. Identify vulnerabilities, respond to incidents, and build security systems. Demand far exceeds supply — very strong job security.',
    salaryRange: '₹8–30 LPA',
    growthRate: '+31% yoy',
    demandLevel: 'high',
    skills: ['Networking', 'Linux', 'Python scripting', 'Penetration testing', 'SIEM tools', 'Risk assessment'],
    education: ['BTech CS/IT', 'CEH / OSCP certifications', 'CompTIA Security+'],
    roadmap: ['Learn networking fundamentals (TCP/IP)', 'Get comfortable with Linux', 'Study OWASP Top 10', 'Practice on TryHackMe / HackTheBox', 'Get CompTIA Security+ certified', 'Apply for SOC analyst roles'],
    relatedSubjects: ['cs', 'coding', 'math'],
  },
  {
    slug: 'doctor-mbbs',
    title: 'Doctor (MBBS)',
    icon: '🩺',
    category: 'healthcare',
    description:
      'Diagnose and treat patients. One of the most respected and stable career paths. Requires dedication through NEET + 5.5 years of MBBS + internships, but offers lifelong career security.',
    salaryRange: '₹8–25 LPA (early), ₹30–80+ LPA (specialist)',
    growthRate: '+15% yoy',
    demandLevel: 'high',
    skills: ['Biology', 'Chemistry', 'Empathy', 'Problem-solving', 'Communication', 'Endurance'],
    education: ['NEET UG → MBBS (5.5 yr)', 'MD/MS specialization (3 yr)', 'Super-specialization (DM/MCh)'],
    roadmap: ['Clear NEET UG with strong score', 'Complete MBBS at a good college', 'Choose specialization (MD/MS)', 'Residency + clinical practice', 'Optional: super-specialization or research'],
    relatedSubjects: ['biology', 'chemistry', 'physics'],
  },
  {
    slug: 'mechanical-engineer',
    title: 'Mechanical Engineer',
    icon: '⚙️',
    category: 'science',
    description:
      'Design and build physical systems — from automobiles to robotics to HVAC. One of the broadest engineering disciplines with opportunities across manufacturing, automotive, aerospace, and energy.',
    salaryRange: '₹6–20 LPA',
    growthRate: '+10% yoy',
    demandLevel: 'medium',
    skills: ['Physics', 'CAD/CAM', 'Thermodynamics', 'Materials science', 'Math', 'Problem-solving'],
    education: ['BTech Mechanical', 'MTech (specialization)', 'GATE for PSUs'],
    roadmap: ['Strong foundation in physics + math', 'Learn CAD tools (SolidWorks/AutoCAD)', 'Internship at a manufacturing company', 'GATE prep if targeting PSU/MTech', 'Specialize (robotics, automotive, thermal)'],
    relatedSubjects: ['physics', 'math', 'chemistry'],
  },
  {
    slug: 'product-manager',
    title: 'Product Manager',
    icon: '🎯',
    category: 'business',
    description:
      'Own the strategy and roadmap for a product. Bridge between engineering, design, and business. High-impact role at tech companies with excellent growth trajectory.',
    salaryRange: '₹15–50 LPA',
    growthRate: '+20% yoy',
    demandLevel: 'high',
    skills: ['Analytical thinking', 'Communication', 'SQL basics', 'UX understanding', 'Strategy', 'Prioritization'],
    education: ['BTech + MBA', 'BTech + PM experience', 'APM programs (Google, Flipkart)'],
    roadmap: ['Build a strong analytical foundation', 'Learn basic SQL + data analysis', 'Read "Inspired" by Marty Cagan', 'Build a side project end-to-end', 'Apply for APM programs or PM internships'],
    relatedSubjects: ['math', 'cs', 'english'],
  },
  {
    slug: 'ux-designer',
    title: 'UX/UI Designer',
    icon: '🎨',
    category: 'creative',
    description:
      'Design intuitive, beautiful interfaces that people love to use. Combines psychology, visual design, and technology. Strong demand across tech companies and startups.',
    salaryRange: '₹8–30 LPA',
    growthRate: '+18% yoy',
    demandLevel: 'high',
    skills: ['Figma/Sketch', 'User research', 'Prototyping', 'Visual design', 'Interaction design', 'HTML/CSS basics'],
    education: ['Design degree (NID, Srishti)', 'Self-taught + portfolio', 'Online courses (Google UX cert)'],
    roadmap: ['Learn Figma deeply', 'Study design fundamentals (color, typography, layout)', 'Complete Google UX Design certificate', 'Redesign 3 existing apps as case studies', 'Build a portfolio website', 'Apply for junior UX roles or internships'],
    relatedSubjects: ['cs', 'english'],
  },
  {
    slug: 'chartered-accountant',
    title: 'Chartered Accountant (CA)',
    icon: '📈',
    category: 'business',
    description:
      'Manage financial accounts, auditing, taxation, and advisory. One of India\'s most sought-after professional qualifications with strong earning potential and job security.',
    salaryRange: '₹7–25 LPA (early), ₹30–80+ LPA (partner)',
    growthRate: '+12% yoy',
    demandLevel: 'medium',
    skills: ['Accounting', 'Taxation', 'Auditing', 'Financial analysis', 'Excel', 'Attention to detail'],
    education: ['CA Foundation → Intermediate → Final', 'Articleship (3 yr practical)', 'Optional: CPA/ACCA for global roles'],
    roadmap: ['Clear CA Foundation after 12th', 'Pass CA Intermediate (both groups)', 'Complete 3-year articleship', 'Clear CA Final', 'Specialize (tax, audit, advisory)'],
    relatedSubjects: ['math', 'business'],
  },
  {
    slug: 'research-scientist',
    title: 'Research Scientist',
    icon: '🔬',
    category: 'science',
    description:
      'Push the boundaries of human knowledge through scientific research. Work in academia, national labs, or corporate R&D. Requires deep expertise and patience but offers intellectual fulfillment.',
    salaryRange: '₹8–25 LPA (India), $80-150K (US)',
    growthRate: '+14% yoy',
    demandLevel: 'medium',
    skills: ['Research methodology', 'Statistics', 'Scientific writing', 'Domain expertise', 'Critical thinking', 'Programming'],
    education: ['BSc/BTech → MSc/MTech → PhD', 'Postdoc (1-3 years)', 'Publications track record'],
    roadmap: ['Excel in your core science subject', 'Get research experience early (summer internships)', 'Strong GRE/GATE score for grad school', 'PhD with strong publications', 'Postdoc or industry R&D'],
    relatedSubjects: ['physics', 'chemistry', 'biology', 'math'],
  },
];

// ─── Match scoring ───────────────────────────────

async function computeMatchScore(userId: string, career: Career): Promise<number> {
  // Get user's exam mastery by type
  const attempts = await prisma.examAttempt.findMany({
    where: { userId },
    select: {
      score: true,
      exam: { select: { type: true, totalMarks: true } },
    },
  });

  // Get coding submission stats
  const codeStats = await prisma.codeSubmission.groupBy({
    by: ['language'],
    where: { userId, verdict: 'ACCEPTED' },
    _count: true,
  });

  // Get focus stats
  const focusSessions = await prisma.focusSession.count({ where: { userId } });

  let score = 30; // Base score — everyone starts with some match

  // Score based on exam performance in related subjects
  if (attempts.length > 0) {
    const typeScores: Record<string, { total: number; earned: number }> = {};
    for (const a of attempts) {
      const type = a.exam.type.toLowerCase();
      if (!typeScores[type]) typeScores[type] = { total: 0, earned: 0 };
      typeScores[type].total += a.exam.totalMarks;
      typeScores[type].earned += a.score ?? 0;
    }

    let relatedHits = 0;
    for (const subject of career.relatedSubjects) {
      // Check exam types that might match (e.g. "math" matches "MATH", "JEE_MATH", etc.)
      for (const [type, data] of Object.entries(typeScores)) {
        if (type.includes(subject.toLowerCase())) {
          const pct = data.total > 0 ? (data.earned / data.total) * 100 : 0;
          score += Math.min(pct * 0.15, 10); // Up to 10 points per matching subject
          relatedHits++;
        }
      }
    }
    if (relatedHits > 0) score += 5; // Bonus for having relevant exam data
  }

  // Score based on coding skills (for tech careers)
  if (career.category === 'tech' && codeStats.length > 0) {
    const totalAccepted = codeStats.reduce((s, c) => s + c._count, 0);
    score += Math.min(totalAccepted * 2, 15); // Up to 15 points
    if (codeStats.some((c) => c.language === 'python')) score += 5;
  }

  // Dedication bonus from focus sessions
  if (focusSessions > 0) {
    score += Math.min(focusSessions, 10); // Up to 10 points
  }

  return Math.min(Math.round(score), 99); // Cap at 99%
}

// ─── Endpoints ───────────────────────────────────

export const listCareers = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { category, search } = req.query;

  let filtered = CAREERS;
  if (category && category !== 'all') {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.category.includes(q)
    );
  }

  // Compute match scores
  const withScores = await Promise.all(
    filtered.map(async (c) => ({
      slug: c.slug,
      title: c.title,
      icon: c.icon,
      category: c.category,
      salaryRange: c.salaryRange,
      growthRate: c.growthRate,
      demandLevel: c.demandLevel,
      skills: c.skills.slice(0, 4),
      matchScore: await computeMatchScore(userId, c),
    }))
  );

  // Sort by match score descending
  withScores.sort((a, b) => b.matchScore - a.matchScore);

  res.json({ ok: true, careers: withScores });
};

export const getCareer = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const career = CAREERS.find((c) => c.slug === req.params.slug);
  if (!career) {
    res.status(404).json({ ok: false, error: 'Career not found' });
    return;
  }

  const matchScore = await computeMatchScore(userId, career);

  // Get user's skill levels for gap analysis
  const attempts = await prisma.examAttempt.findMany({
    where: { userId },
    select: {
      score: true,
      exam: { select: { type: true, totalMarks: true } },
    },
  });

  const codeStats = await prisma.codeSubmission.groupBy({
    by: ['language'],
    where: { userId, verdict: 'ACCEPTED' },
    _count: true,
  });

  // Build skill assessment
  const skillAssessment = career.skills.map((skill) => {
    let level = 0; // 0-100
    const skillLower = skill.toLowerCase();

    // Check exam performance
    for (const a of attempts) {
      const type = a.exam.type.toLowerCase();
      for (const subject of career.relatedSubjects) {
        if (
          type.includes(subject) &&
          (skillLower.includes(subject) ||
            subject.includes(skillLower.split('/')[0].toLowerCase()))
        ) {
          const pct = a.exam.totalMarks > 0 ? ((a.score ?? 0) / a.exam.totalMarks) * 100 : 0;
          level = Math.max(level, Math.round(pct));
        }
      }
    }

    // Check coding skills
    if (
      skillLower.includes('python') &&
      codeStats.some((c) => c.language === 'python')
    ) {
      level = Math.max(level, 40 + codeStats.find((c) => c.language === 'python')!._count * 5);
    }
    if (
      (skillLower.includes('javascript') || skillLower.includes('typescript')) &&
      codeStats.some((c) => c.language === 'javascript' || c.language === 'typescript')
    ) {
      const jsCount =
        (codeStats.find((c) => c.language === 'javascript')?._count ?? 0) +
        (codeStats.find((c) => c.language === 'typescript')?._count ?? 0);
      level = Math.max(level, 30 + jsCount * 5);
    }

    return {
      name: skill,
      level: Math.min(level, 100),
      status:
        level >= 70
          ? ('strong' as const)
          : level >= 40
          ? ('developing' as const)
          : ('gap' as const),
    };
  });

  res.json({
    ok: true,
    career: {
      ...career,
      matchScore,
      skillAssessment,
    },
  });
};
