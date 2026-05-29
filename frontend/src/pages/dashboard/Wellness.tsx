import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Brain, Target, Compass, Coffee, UserCheck, ShieldAlert, Sparkles,
  MessageSquare, Plus, Trash2, Send, Flame, Award, BookOpen, Clock, Activity,
  Settings, Eye, EyeOff, RotateCcw, AlertTriangle, ArrowRight, UserPlus, HelpCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, CartesianGrid
} from 'recharts';

type Tab =
  | 'overview'
  | 'study'
  | 'stress'
  | 'mood'
  | 'career'
  | 'recovery'
  | 'parent'
  | 'mentor'
  | 'skills'
  | 'community';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: Heart },
  { id: 'study', label: 'Study Intelligence', icon: BookOpen },
  { id: 'stress', label: 'Stress & Burnout', icon: Activity },
  { id: 'mood', label: 'Mood & Reflection', icon: Coffee },
  { id: 'career', label: 'Career Guidance', icon: Compass },
  { id: 'recovery', label: 'Recovery Mode', icon: RotateCcw },
  { id: 'parent', label: 'Parent Insights', icon: UserCheck },
  { id: 'mentor', label: 'AI Mentor', icon: Brain },
  { id: 'skills', label: 'Skill Discovery', icon: Sparkles },
  { id: 'community', label: 'Wellness Community', icon: MessageSquare },
];

export default function Wellness() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const user = useAuthStore((s) => s.user);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 flex flex-col">
        {/* Header banner */}
        <div className="relative rounded-3xl overflow-hidden mb-6 p-8 border border-white/[0.04] bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-emerald-950/20 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400/80">Scholr Wellness</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight text-white">
                Quiet your mind, <span className="italic text-indigo-300">sharpen your study</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                A calm, emotionally supportive space to manage exam stress, explore careers, reflect on your goals, and discover non-traditional skills.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Prep Mindset: Mindful & Steady
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex-1 grid grid-cols-12 gap-6">
          {/* Left Sub-navigation Tabs */}
          <aside className="col-span-12 lg:col-span-3 space-y-1">
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3 mb-2">Wellness Modules</p>
              <nav className="space-y-1">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/15 to-emerald-500/10 text-white border-l-2 border-indigo-400 shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`} />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Active Tab Screen */}
          <main className="col-span-12 lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'study' && <StudyTab />}
                {activeTab === 'stress' && <StressTab />}
                {activeTab === 'mood' && <MoodTab />}
                {activeTab === 'career' && <CareerTab />}
                {activeTab === 'recovery' && <RecoveryTab />}
                {activeTab === 'parent' && <ParentTab />}
                {activeTab === 'mentor' && <MentorTab />}
                {activeTab === 'skills' && <SkillsTab />}
                {activeTab === 'community' && <CommunityTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── 1. OVERVIEW DASHBOARD TAB ─────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wellness-dashboard'],
    queryFn: async () => (await api.get('/wellness/dashboard')).data,
  });

  if (isLoading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      {/* Risk Meters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stress Meter */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-medium">Stress Indicator</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                data.stressStatus === 'High Stress' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                data.stressStatus === 'Mild Stress' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>{data.stressStatus}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-display font-bold text-white">{data.stressLevel}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  data.stressLevel > 70 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                  data.stressLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${data.stressLevel}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Calculated based on study hours, activity shifts, and logs.
            </p>
          </div>
        </div>

        {/* Burnout Risk Meter */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-medium">Burnout Risk</span>
              <span className="text-[10px] text-slate-500">7-day analysis</span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-display font-bold text-white">{data.burnoutRisk}</span>
              <span className="text-xs text-slate-500">%</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  data.burnoutRisk > 70 ? 'bg-rose-500' :
                  data.burnoutRisk > 40 ? 'bg-amber-400' : 'bg-indigo-400'
                }`}
                style={{ width: `${data.burnoutRisk}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Keep study sessions balanced to prevent collapse.
            </p>
          </div>
        </div>

        {/* Exam Countdown Ring / Info */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Countdown</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-white">{data.examCountdown.days}</span>
              <span className="text-sm text-slate-400">days left</span>
            </div>
            <p className="text-xs text-indigo-300 font-medium mt-1 truncate">{data.examCountdown.examName}</p>
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 border-t border-white/[0.04] pt-2">
            <span>Syllabus Completed</span>
            <span className="font-semibold text-white">{data.syllabusCompletion}%</span>
          </div>
        </div>
      </div>

      {/* AI Wellness Insight Card */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 to-slate-900/40 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-3 opacity-15">
          <Sparkles className="w-16 h-16 text-indigo-400" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
            <Brain className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase text-indigo-300 tracking-wider">AI Wellness Insight</h4>
            <p className="text-xs leading-relaxed text-slate-200">
              "{data.aiInsight.insight}"
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Tip: {data.aiInsight.tip}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Ex: {data.aiInsight.exercise}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Trends Graph & Syllabus Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Mood Trend Chart */}
        <div className="col-span-12 md:col-span-8 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Mood Logs (Last 7 Checks)</h3>
          {data.moodTrends.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.moodTrends}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                  <YAxis ticks={[1, 2, 3, 4, 5]} domain={[1, 5]} stroke="#475569" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelClassName="text-slate-400 text-xs"
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorMood)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
              No mood logs logged yet. Complete check-in in Mood & Reflection.
            </div>
          )}
        </div>

        {/* Quick subject list */}
        <div className="col-span-12 md:col-span-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Balance</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Strong Areas</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.strongSubjects.map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Needs Attention</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.weakSubjects.map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {data.performanceDrop && (
            <div className="mt-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-2 items-center">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="text-[9px] text-rose-300 font-medium leading-normal">
                Test scores show recent decline. A lighter study pace is advised.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 2. STUDY INTELLIGENCE SYSTEM TAB ──────────────
function StudyTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wellness-study'],
    queryFn: async () => (await api.get('/wellness/study-intelligence')).data,
  });

  if (isLoading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Study Hours breakdown */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Study Time (Last 7 Days)</h3>
          {data.subjectBreakdown.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectBreakdown}>
                  <XAxis dataKey="subject" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelClassName="text-slate-400 text-xs"
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {data.subjectBreakdown.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
              No logged study sessions. Record focus sessions to populate.
            </div>
          )}
        </div>

        {/* Accuracy and score trends */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Mock Test Accuracy</h3>
          {data.accuracyTrends.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.accuracyTrends}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelClassName="text-slate-400 text-xs"
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" fill="rgba(16,185,129,0.05)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
              No mock test scores logged yet. Take mock tests in the Test section.
            </div>
          )}
        </div>
      </div>

      {/* Weaknesses vs Strengths and Predicted Readiness Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strengths List */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" /> Strongest Topics
          </h4>
          <ul className="space-y-2">
            {data.strongestTopics.map((t: string) => (
              <li key={t} className="text-xs text-slate-200 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses List */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Revision Gaps
          </h4>
          <ul className="space-y-2">
            {data.weakTopics.map((t: string) => (
              <li key={t} className="text-xs text-slate-200 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Predicted Readiness Score Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/30 border border-indigo-500/20 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
              Readiness Score
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Statistically computed estimate of readiness for target exam.
            </p>
          </div>
          <div className="my-3 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-display font-extrabold text-white">{data.predictedReadinessScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[9px] text-slate-400 text-center leading-normal">
            Based on {data.revisionFrequency} revision sessions and mock test performance logs.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 3. STRESS & BURNOUT TAB ───────────────────────
function StressTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wellness-dashboard'], // share query data
    queryFn: async () => (await api.get('/wellness/dashboard')).data,
  });

  if (isLoading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      {/* Alert Banner for High Stress */}
      {data.stressLevel > 60 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-amber-300">Elevated Stress Signals Detected</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Your recent study patterns and mood logs indicate elevated pressure. Take a moment to log a breathing session or reflect in your journal. Rest is an essential part of active learning.
            </p>
          </div>
        </div>
      )}

      {/* Burnout Risk breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Self check checklist */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Stress Symptoms Tracker
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 leading-normal">
            Tick anything you are experiencing. These help refine AI support:
          </p>
          <div className="space-y-3">
            {[
              'Studying late past midnight consistently',
              'Difficulty maintaining concentration during blocks',
              'Anxiety when not studying (academic guilt)',
              'Fatigue or lack of energy in the mornings',
              'Feeling isolated or disconnected from friends/family',
            ].map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Burnout Prevention Recommendations */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Burnout Prevention Tips</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">The 50-10 Rule</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">For every 50 minutes of deep study, take a strict 10-minute break away from screens.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Sleep Gate</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Avoid mock tests after 9 PM. Sleep prepares your brain for neural consolidations.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Academic Realignment</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">If a subject feels too difficult, split the chapter into smaller, bite-sized revision cards.</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo(0, 0)}
            className="w-full mt-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-medium border border-indigo-500/20 transition-all"
          >
            Review Coping Exercises
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 4. MOOD & REFLECTION TAB ─────────────────────
function MoodTab() {
  const qc = useQueryClient();
  const [journalText, setJournalText] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('Box Breathing');
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: moodData } = useQuery({
    queryKey: ['moods-list'],
    queryFn: async () => (await api.get('/wellness/moods')).data.logs,
  });

  const { data: journalData } = useQuery({
    queryKey: ['journals-list'],
    queryFn: async () => (await api.get('/wellness/journals')).data.entries,
  });

  const logMoodMutation = useMutation({
    mutationFn: async (mood: string) => api.post('/wellness/moods', { mood }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellness-dashboard'] });
      qc.invalidateQueries({ queryKey: ['moods-list'] });
    },
  });

  const journalMutation = useMutation({
    mutationFn: async (body: { content: string; title?: string }) => api.post('/wellness/journals', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journals-list'] });
      setJournalText('');
      setJournalTitle('');
    },
  });

  const removeJournalMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/wellness/journals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journals-list'] });
    },
  });

  // Breathing simulation timer
  useEffect(() => {
    if (breathingActive) {
      setBreathingSeconds(0);
      setBreathingText('Inhale (4s)');
      timerRef.current = setInterval(() => {
        setBreathingSeconds((prev) => {
          const next = (prev + 1) % 16;
          if (next < 4) setBreathingText('Inhale (4s)');
          else if (next < 8) setBreathingText('Hold (4s)');
          else if (next < 12) setBreathingText('Exhale (4s)');
          else setBreathingText('Hold (4s)');
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setBreathingText('Box Breathing');
      setBreathingSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [breathingActive]);

  const moodLevels = [
    { value: 'GREAT', label: 'Great', icon: '😄', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { value: 'GOOD', label: 'Good', icon: '🙂', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { value: 'NEUTRAL', label: 'Okay', icon: '😐', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
    { value: 'LOW', label: 'Low', icon: '😔', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { value: 'TERRIBLE', label: 'Terrible', icon: '😭', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Mood Picker & Breathing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Check-in */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Daily Check-in</h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-4">
              How are you holding up right now? Log your current state.
            </p>
            <div className="flex flex-wrap gap-2 justify-center my-3">
              {moodLevels.map((m) => (
                <button
                  key={m.value}
                  onClick={() => logMoodMutation.mutate(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold w-16 transition-all hover:scale-105 active:scale-95 ${m.color}`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          {logMoodMutation.isPending && (
            <p className="text-[10px] text-indigo-400 text-center animate-pulse">Logging check-in...</p>
          )}
          {moodData && moodData.length > 0 && (
            <div className="text-[10px] text-slate-400 text-center mt-3 border-t border-white/[0.04] pt-2">
              Last check-in: <span className="text-slate-200 font-semibold">{moodData[moodData.length - 1].mood}</span> (logged today)
            </div>
          )}
        </div>

        {/* Breathing Circle Widget */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Box Breathing Exercise</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Calms stress and anchors focus</p>
          </div>
          {/* Animated Breathing Circle */}
          <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center bg-slate-900/60 relative">
            <motion.div
              animate={breathingActive ? {
                scale: [1, 1.4, 1.4, 1, 1],
              } : { scale: 1 }}
              transition={breathingActive ? {
                duration: 16,
                repeat: Infinity,
                ease: 'easeInOut',
              } : {}}
              className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-400/40"
            />
            <span className="text-[10px] font-semibold text-indigo-200 z-10 text-center px-1">
              {breathingText}
            </span>
          </div>
          <button
            onClick={() => setBreathingActive(!breathingActive)}
            className={`mt-5 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              breathingActive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10'
            }`}
          >
            {breathingActive ? 'Stop Exercise' : 'Start 4-4-4 Breathing'}
          </button>
        </div>
      </div>

      {/* Reflection Journal Section */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Reflection Journal</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Write down your fears, expectations, gratitude, or a summary of what is weighing on you. AI will read it and add a calm, validating reflection in your logs.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Journal Title (e.g. Preparing for mock test 4)"
            value={journalTitle}
            onChange={(e) => setJournalTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="Today, I am feeling a bit tired but committed..."
            rows={3}
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={() => journalMutation.mutate({ content: journalText, title: journalTitle || undefined })}
              disabled={journalMutation.isPending || !journalText.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              Save Reflection & Get AI Insight
            </button>
          </div>
        </div>

        {/* Existing Journal Entries */}
        {journalData && journalData.length > 0 && (
          <div className="mt-6 border-t border-white/[0.04] pt-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Reflection Logs</h4>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {journalData.map((j: any) => (
                <div key={j.id} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-200">{j.title}</h5>
                      <span className="text-[9px] text-slate-500">{new Date(j.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <button
                      onClick={() => removeJournalMutation.mutate(j.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                  {j.aiInsight && (
                    <div className="p-2.5 rounded bg-indigo-500/[0.02] border border-indigo-500/10 mt-1 flex gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-indigo-300 leading-normal italic">
                        "{j.aiInsight}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. CAREER GUIDANCE COMPASS TAB ────────────────
function CareerTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wellness-career'],
    queryFn: async () => (await api.get('/wellness/career')).data,
  });

  if (isLoading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      {/* Primary Goal Target */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Exam Goal Focus</span>
          <h3 className="text-xl font-display font-semibold text-white mt-1">{data.goalExam}</h3>
          <p className="text-xs text-indigo-300 mt-0.5">Primary Pathway: {data.primaryPath}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 font-medium">
          Aptitude Affinity: Analytical & Scientific
        </div>
      </div>

      {/* Alternative Recommendations */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Backup Careers & Emerging Fields</h3>
        <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
          Struggling with extreme board cutoffs? These fields match your core aptitude indicators and have higher flexibility.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.alternatePaths.map((p: any) => (
            <div key={p.title} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/20 transition-all flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">{p.title}</h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
              </div>
              <span className="text-[9px] text-indigo-400 font-semibold mt-3 hover:underline cursor-pointer flex items-center gap-1">
                Explore Pathway <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Backup Plan Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.04]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Backup Blueprint</h4>
        <p className="text-[11px] leading-relaxed text-slate-300">
          "{data.backupPlan}"
        </p>
      </div>
    </div>
  );
}

// ─── 6. RECOVERY MODE TAB ─────────────────────────
function RecoveryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['wellness-recovery'],
    queryFn: async () => (await api.get('/wellness/recovery')).data,
  });

  if (isLoading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      {/* Recovery Guidance */}
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/50 to-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <RotateCcw className="w-20 h-20 text-emerald-400" />
        </div>
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Recovery Mode Enabled</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {data.recoveryGuidance}
          </p>
        </div>
      </div>

      {/* Alternate Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scholarships & Opportunities */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" /> Scholarship Options & Alternates
          </h4>
          <div className="space-y-3">
            {data.alternateOpportunities.map((o: any) => (
              <div key={o.name} className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1">
                <h5 className="text-xs font-semibold text-slate-200">{o.name}</h5>
                <p className="text-[10px] text-slate-400 leading-normal">{o.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skill pathways */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Practical Skills Over Cut-offs
            </h4>
            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              Acquiring specialized industry skills often provides a cleaner, direct career entry route than traditional competitive exams.
            </p>
            <div className="space-y-3">
              {data.skillPathways.map((p: any) => (
                <div key={p.name} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-white/[0.04]">
                  <div>
                    <h5 className="text-xs font-medium text-slate-200">{p.name}</h5>
                    <span className="text-[9px] text-slate-500">{p.duration}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                    Free Path
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 italic text-center">
            Remember: There is always a secondary doorway to your dreams.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 7. PARENT INSIGHTS TAB ───────────────────────
function ParentTab() {
  const qc = useQueryClient();
  const [parentId, setParentId] = useState('');
  const [childReportSearch, setChildReportSearch] = useState('');

  const { data: perms } = useQuery({
    queryKey: ['parent-permissions'],
    queryFn: async () => (await api.get('/wellness/parent/permissions')).data.permissions,
  });

  const updatePermsMutation = useMutation({
    mutationFn: async (body: { parentId: string; permissions: any }) =>
      api.post('/wellness/parent/permissions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-permissions'] });
      setParentId('');
    },
  });

  const { data: childReport, refetch: fetchChildReport, error: childReportError } = useQuery({
    queryKey: ['child-report', childReportSearch],
    queryFn: async () => (await api.get(`/wellness/parent/child/${childReportSearch}`)).data.report,
    enabled: false,
    retry: false,
  });

  const handleUpdatePerms = (parentId: string, field: string, val: boolean) => {
    const current = perms?.find((p: any) => p.parentId === parentId);
    if (!current) return;
    const nextPerms = {
      allowAcademic: current.allowAcademic,
      allowAttendance: current.allowAttendance,
      allowStress: current.allowStress,
      allowAptitude: current.allowAptitude,
      [field]: val,
    };
    updatePermsMutation.mutate({ parentId, permissions: nextPerms });
  };

  const handleLinkParent = () => {
    if (!parentId.trim()) return;
    updatePermsMutation.mutate({
      parentId: parentId.trim(),
      permissions: { allowAcademic: true, allowAttendance: true, allowStress: true, allowAptitude: true },
    });
  };

  return (
    <div className="space-y-6">
      {/* Visibility Control */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Student Privacy Dashboard</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Control exactly what metrics linked parents or guardians can view. We support privacy by design so you feel safe during mock failures or stressful revisions.
        </p>

        {/* Link new parent */}
        <div className="flex gap-2 max-w-md mb-5">
          <input
            type="text"
            placeholder="Parent/Guardian User ID"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleLinkParent}
            disabled={updatePermsMutation.isPending || !parentId.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
          >
            Link Parent
          </button>
        </div>

        {/* Permissions Lists */}
        {perms && perms.length > 0 ? (
          <div className="space-y-3 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Guardians</h4>
            {perms.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">
                      {p.parent.firstName} {p.parent.lastName}
                    </h5>
                    <span className="text-[10px] text-slate-500">{p.parent.email}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded font-semibold border border-emerald-500/20">
                    Linked
                  </span>
                </div>
                {/* Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
                  {[
                    { label: 'Academic Performance', field: 'allowAcademic', val: p.allowAcademic },
                    { label: 'Attendance', field: 'allowAttendance', val: p.allowAttendance },
                    { label: 'Stress Status', field: 'allowStress', val: p.allowStress },
                    { label: 'Aptitude & Guidance', field: 'allowAptitude', val: p.allowAptitude },
                  ].map((perm) => (
                    <label key={perm.field} className="flex items-center gap-2 text-[10px] text-slate-400 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={perm.val}
                        onChange={(e) => handleUpdatePerms(p.parentId, perm.field, e.target.checked)}
                        className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
            No parent links established yet.
          </div>
        )}
      </div>

      {/* Parent Report Search Tab (Helper mock view for parents) */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Guardian Report Viewer</h3>
        <p className="text-[11px] text-slate-400 leading-normal mb-4">
          For parents: Enter your child's student ID to pull the permission-filtered general report card.
        </p>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Student/Child ID"
            value={childReportSearch}
            onChange={(e) => setChildReportSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => fetchChildReport()}
            disabled={!childReportSearch.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
          >
            Fetch Report
          </button>
        </div>

        {childReport && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-2">
            <h4 className="text-xs font-semibold text-emerald-300">Child Progress Card ({childReport.studentName})</h4>
            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              {childReport.allowedAreas.academic && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Focus Study Hours</span>
                  <span className="text-slate-100 font-semibold">{childReport.studyHours} hrs (Last 7 Days)</span>
                </div>
              )}
              {childReport.allowedAreas.attendance && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Attendance Record</span>
                  <span className="text-slate-100 font-semibold">{childReport.attendancePercentage}% Present</span>
                </div>
              )}
              {childReport.allowedAreas.stress && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Wellness Status</span>
                  <span className="text-slate-100 font-semibold">{childReport.stressStatus}</span>
                </div>
              )}
              {childReport.allowedAreas.academic && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Mock tests taken</span>
                  <span className="text-slate-100 font-semibold">{childReport.testCount} tests completed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {childReportError && (
          <p className="text-[10px] text-rose-400 mt-2">
            Failed to fetch. Connection not approved by the child or invalid student ID.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 8. AI MENTOR INTEGRATED TAB ──────────────────
function MentorTab() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useQuery<any[]>({
    queryKey: ['ai-chats-wellness'],
    queryFn: async () => (await api.get('/ai/chats')).data.chats,
  });

  const { data: messages } = useQuery<any[]>({
    queryKey: ['ai-chat-wellness', activeChatId],
    queryFn: async () => (await api.get(`/ai/chats/${activeChatId}`)).data.chat.messages,
    enabled: !!activeChatId,
  });

  const createChat = useMutation({
    mutationFn: async () =>
      (await api.post('/ai/chats', { context: 'wellness', title: 'Wellness Reflection' })).data.chat,
    onSuccess: (chat: any) => {
      qc.invalidateQueries({ queryKey: ['ai-chats-wellness'] });
      setActiveChatId(chat.id);
    },
  });

  const { stream, streaming } = useSSE({
    onDelta: (text) => setStreamingText((prev) => prev + text),
    onDone: () => {
      qc.invalidateQueries({ queryKey: ['ai-chat-wellness', activeChatId] });
      setStreamingText('');
    },
    onError: (err) => {
      console.error(err);
      setStreamingText('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const send = async () => {
    if (!input.trim() || !activeChatId || streaming) return;
    const text = input.trim();
    setInput('');
    setStreamingText('');

    // Optimistically update
    qc.setQueryData<any[]>(['ai-chat-wellness', activeChatId], (old = []) => [
      ...old,
      { id: `temp-${Date.now()}`, role: 'USER', content: text, createdAt: new Date().toISOString() },
    ]);

    const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
    await stream(
      `${baseURL}/ai/chats/${activeChatId}/messages`,
      { content: text, mode: 'wellness' },
      accessToken
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-[480px] flex flex-col justify-between">
      {!activeChatId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Dedicated Wellness Assistant</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
              Open a calming dialogue with the AI mentor. Share study anxieties, exam pressure, or scheduling struggles in a completely private environment.
            </p>
          </div>
          <button
            onClick={() => createChat.mutate()}
            disabled={createChat.isPending}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/10 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            Start Conversation
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between h-full">
          {/* Chats Header */}
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
            <span className="text-xs font-semibold text-indigo-300">AI Wellness Mentor</span>
            <button
              onClick={() => setActiveChatId(null)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              Reset Chat
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
            {messages?.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'USER'
                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-white rounded-br-none'
                    : 'bg-slate-900 border border-white/5 text-slate-200 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed bg-slate-900 border border-white/5 text-slate-200 rounded-bl-none">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3 ml-0.5 bg-indigo-400 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Talk about study pressure..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 9. SKILL DISCOVERY TAB ───────────────────────
function SkillsTab() {
  const { data } = useQuery({
    queryKey: ['wellness-career'],
    queryFn: async () => (await api.get('/wellness/career')).data,
  });

  const skills = [
    { title: 'Programming & Web Development', details: 'Python scripting, JS, building web APIs, database schemas.', tag: 'Coding' },
    { title: 'UI/UX Visual Design', details: 'Designing digital wireframes, user psychology, typography, Figma.', tag: 'Design' },
    { title: 'Robotics & Hardware Systems', details: 'Micro-controllers, Arduino programming, IoT device operations.', tag: 'Robotics' },
    { title: 'Generative AI Engineering', details: 'Prompt tuning, fine-tuning API, vector database configurations.', tag: 'AI' },
    { title: 'Financial Modeling & Investing', details: 'Stock valuations, portfolio structures, corporate ledger balances.', tag: 'Finance' },
    { title: 'Public Speaking & Debate', details: 'Speech structures, dynamic body posture, pacing, rhetoric.', tag: 'Leadership' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alternate Skill Discovery</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Discover non-traditional strengths that provide rewarding careers in tech, leadership, and product management.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((s) => (
            <div key={s.title} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] flex flex-col justify-between">
              <div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">{s.tag}</span>
                <h4 className="text-xs font-semibold text-slate-200 mt-2">{s.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">{s.details}</p>
              </div>
              <span className="text-[9px] text-indigo-400 font-semibold mt-3 hover:underline cursor-pointer flex items-center gap-1 self-start">
                Unlock Roadmap <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 10. WELLNESS COMMUNITY TAB ────────────────────
function CommunityTab() {
  const qc = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [threadAnon, setThreadAnon] = useState(false);
  
  const [commentContent, setCommentContent] = useState('');
  const [commentAnon, setCommentAnon] = useState(false);

  const { data: channels } = useQuery({
    queryKey: ['community-channels'],
    queryFn: async () => (await api.get('/wellness/community/channels')).data.channels,
  });

  const { data: threads } = useQuery({
    queryKey: ['channel-threads', selectedChannelId],
    queryFn: async () => (await api.get(`/wellness/community/channels/${selectedChannelId}/threads`)).data.threads,
    enabled: !!selectedChannelId,
  });

  const { data: threadDetails } = useQuery({
    queryKey: ['thread-details', selectedThreadId],
    queryFn: async () => (await api.get(`/wellness/community/threads/${selectedThreadId}`)).data.thread,
    enabled: !!selectedThreadId,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (body: { title: string; content: string; isAnonymous?: boolean }) =>
      api.post(`/wellness/community/channels/${selectedChannelId}/threads`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channel-threads', selectedChannelId] });
      setThreadTitle('');
      setThreadContent('');
      setThreadAnon(false);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (body: { content: string; isAnonymous?: boolean }) =>
      api.post(`/wellness/community/threads/${selectedThreadId}/comments`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thread-details', selectedThreadId] });
      setCommentContent('');
      setCommentAnon(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Back navigations */}
      {selectedThreadId ? (
        <button
          onClick={() => setSelectedThreadId(null)}
          className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5"
        >
          ← Back to threads list
        </button>
      ) : selectedChannelId ? (
        <button
          onClick={() => setSelectedChannelId(null)}
          className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5"
        >
          ← Back to channels list
        </button>
      ) : null}

      {/* Screen 1: Channels List */}
      {!selectedChannelId && !selectedThreadId && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-normal">
            <strong>Community Moderation Guidelines:</strong> Bulling, toxic productivities, and harassing behavior are automatically filtered. Flag toxic interactions using report buttons.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels?.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedChannelId(c.id)}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left hover:border-indigo-500/20 hover:bg-white/[0.03] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-semibold text-slate-100">{c.name}</h4>
                    {c.isAnonymous && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-semibold border border-white/5">
                        Anon Allowed
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{c.description}</p>
                </div>
                <span className="text-[9px] text-indigo-400 font-semibold mt-4 flex items-center gap-1">
                  Enter Channel <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 2: Channel Threads List */}
      {selectedChannelId && !selectedThreadId && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Threads list */}
          <div className="col-span-12 md:col-span-7 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussion Threads</h4>
            {threads && threads.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {threads.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    className="w-full p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] text-left hover:border-indigo-500/20 transition-all space-y-2 block"
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-semibold text-slate-200 truncate">{t.title}</h5>
                      <span className="text-[9px] text-slate-500 flex-shrink-0 ml-2">{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.content}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-white/[0.02] mt-2">
                      <span>Posted by: {t.isAnonymous ? 'Anonymous peer' : t.user.firstName}</span>
                      <span>{t._count.comments} Comments</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
                No threads in this channel. Create the first one!
              </div>
            )}
          </div>

          {/* Create new thread Form */}
          <div className="col-span-12 md:col-span-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-fit">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Create Discussion</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Topic Title"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="What is on your mind? Share details..."
                rows={3}
                value={threadContent}
                onChange={(e) => setThreadContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <label className="flex items-center gap-2 text-[10px] text-slate-400 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={threadAnon}
                  onChange={(e) => setThreadAnon(e.target.checked)}
                  className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Post Anonymously</span>
              </label>
              <button
                onClick={() => createThreadMutation.mutate({ title: threadTitle, content: threadContent, isAnonymous: threadAnon })}
                disabled={createThreadMutation.isPending || !threadTitle.trim() || !threadContent.trim()}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all"
              >
                Publish Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Thread Details & Comments */}
      {selectedThreadId && threadDetails && (
        <div className="space-y-5">
          {/* Main Post */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/[0.04] space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">{threadDetails.title}</h4>
                <span className="text-[9px] text-slate-500">
                  Posted on {new Date(threadDetails.createdAt).toLocaleDateString('en-IN')} by {threadDetails.isAnonymous ? 'Anonymous Peer' : threadDetails.user.firstName}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{threadDetails.content}</p>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Replies ({threadDetails.comments.length})</h5>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {threadDetails.comments.map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1">
                  <span className="text-[9px] text-slate-500 font-medium">
                    {c.isAnonymous ? 'Anonymous Peer' : c.user.firstName} · {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Write comment box */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
            <textarea
              placeholder="Add your supportive reply..."
              rows={2}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-[10px] text-slate-400 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={commentAnon}
                  onChange={(e) => setCommentAnon(e.target.checked)}
                  className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Reply Anonymously</span>
              </label>
              <button
                onClick={() => createCommentMutation.mutate({ content: commentContent, isAnonymous: commentAnon })}
                disabled={createCommentMutation.isPending || !commentContent.trim()}
                className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all"
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENT: SKELETON LOADER ────────────
function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
        ))}
      </div>
      <div className="h-20 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
        <div className="h-44 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
      </div>
    </div>
  );
}
