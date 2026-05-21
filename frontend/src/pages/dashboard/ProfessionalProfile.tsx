import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Edit3, Plus, Trash2, ExternalLink, Download, Phone,
  MapPin, Building2, Calendar, Briefcase, GraduationCap, Award,
  Github, Linkedin, Globe, Camera, Loader2, CheckCircle2, UserPlus,
  BookOpen, Target, Sparkles, AlertCircle, TrendingUp, FileText,
  X, Check, ChevronDown, ChevronUp, Upload, User,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Avatar } from '@/components/social/Avatar';
import { PostCard, type PostData } from '@/components/social/PostCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startYear: number | null;
  endYear: number | null;
  current: boolean;
  grade: string | null;
  description: string | null;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string;
  credentialUrl: string | null;
  imageUrl: string | null;
}

interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  headline: string | null;
  role: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  skills: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  resumeUrl: string | null;
  profileData: Record<string, unknown> | null;
  onboardingDone: boolean;
  createdAt: string;
  education: Education[];
  workExperiences: Experience[];
  certificates: Certificate[];
  strengthScore: number;
  missingFields: string[];
  isMe: boolean;
  isFollowedByMe: boolean;
  _count: { followers: number; following: number; posts: number };
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'School Student',
  COLLEGE_STUDENT: 'College Student',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  RECRUITER: 'Recruiter',
  WORKING_PROFESSIONAL: 'Working Professional',
  SCHOOL_ADMIN: 'School Admin',
  COLLEGE_ADMIN: 'College Admin',
  SUPER_ADMIN: 'Admin',
};

function formatDateRange(start: string | number | null, end: string | number | null, current: boolean): string {
  const fmt = (v: string | number | null) => {
    if (!v) return '?';
    if (typeof v === 'number') return v.toString();
    const d = new Date(v);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  return `${fmt(start)} – ${current ? 'Present' : fmt(end)}`;
}

// ─── Section wrapper ──────────────────────────────

function Section({ title, icon: Icon, children, onAdd, collapsible = false }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  onAdd?: () => void;
  collapsible?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white text-base">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {onAdd && (
            <button onClick={onAdd} className="w-8 h-8 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 flex items-center justify-center transition-colors" title={`Add ${title}`}>
              <Plus className="w-4 h-4" />
            </button>
          )}
          {collapsible && (
            <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Strength Score card ──────────────────────────

function StrengthCard({ score, missing }: { score: number; missing: string[] }) {
  const color = score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'red';
  const colors = {
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30 bg-emerald-500/10' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30 bg-amber-500/10' },
    red: { bar: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30 bg-red-500/10' },
  };
  const c = colors[color];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-violet-400" />
        <h3 className="font-semibold text-white text-sm">Profile strength</h3>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-16 h-16 rounded-full ring-4 ${c.ring} flex items-center justify-center flex-shrink-0`}>
          <span className={`font-mono text-xl font-bold ${c.text}`}>{score}%</span>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${c.bar}`}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            {score >= 80 ? 'Excellent! Your profile stands out.' : score >= 50 ? 'Good start — keep adding details.' : 'Add more info to get noticed.'}
          </p>
        </div>
      </div>
      {missing.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium">Add to boost score</p>
          <div className="space-y-1.5">
            {missing.map((m) => (
              <div key={m} className="flex items-center gap-2 text-xs text-zinc-300">
                <Plus className="w-3 h-3 text-violet-400 flex-shrink-0" />
                {m}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Analysis card ─────────────────────────────

function AIAnalysisCard({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-analysis', userId],
    queryFn: async () => (await api.get('/profile/me/ai-analysis')).data,
    enabled: false,
  });

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="font-semibold text-white text-sm">AI Profile Analysis</h3>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 uppercase tracking-wider font-medium">AI</span>
      </div>

      {!open ? (
        <div>
          <p className="text-xs text-zinc-400 mb-3">Get personalized career suggestions, skill gap analysis, and recommendations from our AI.</p>
          <button
            onClick={() => { setOpen(true); refetch(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyse my profile
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analysing your profile…
        </div>
      ) : data ? (
        <div className="space-y-3">
          {data.strengthSummary && (
            <p className="text-sm text-zinc-200 italic">"{data.strengthSummary}"</p>
          )}
          {data.suggestions?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium">Improve your profile</p>
              {data.suggestions.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-xs text-zinc-300">
                  <CheckCircle2 className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
          {data.careerSuggestions?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium">Career paths for you</p>
              {data.careerSuggestions.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-xs text-zinc-300">
                  <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
          {data.studyRecommendations?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-medium">Learning recommendations</p>
              {data.studyRecommendations.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-xs text-zinc-300">
                  <BookOpen className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Sparkles className="w-2.5 h-2.5" />
            {data.aiPowered ? 'Powered by Ollama AI' : 'Rule-based analysis'}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Shared form components ───────────────────────

const FormField = ({ label, value, onChange, placeholder, type = 'text', disabled = false }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string; 
  type?: string; 
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
      disabled={disabled} 
      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 disabled:opacity-40" 
    />
  </div>
);

// ─── Edit modals ──────────────────────────────────

function EditBioModal({ current, onSave, onClose }: {
  current: string;
  onSave: (val: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(current);
  return (
    <ModalWrapper onClose={onClose} title="Edit About">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Describe yourself, your goals, and your background…"
        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
      />
      <p className="text-[10px] text-zinc-500 mt-1 text-right">{val.length}/2000</p>
      <ModalActions onClose={onClose} onSave={() => onSave(val)} />
    </ModalWrapper>
  );
}

function EditSkillsModal({ current, onSave, onClose }: {
  current: string[];
  onSave: (skills: string[]) => void;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<string[]>(current);
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim() || skills.includes(input.trim())) return;
    setSkills([...skills, input.trim()]);
    setInput('');
  };
  return (
    <ModalWrapper onClose={onClose} title="Edit Skills">
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add a skill (e.g. Python, Leadership)"
          className="flex-1 px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button onClick={add} className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg">Add</button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-zinc-950 rounded-lg border border-zinc-700">
        {skills.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
            {s}
            <button onClick={() => setSkills(skills.filter(x => x !== s))} className="text-violet-400 hover:text-red-400">×</button>
          </span>
        ))}
        {skills.length === 0 && <span className="text-xs text-zinc-500">No skills added yet</span>}
      </div>
      <ModalActions onClose={onClose} onSave={() => onSave(skills)} />
    </ModalWrapper>
  );
}

function AddEducationModal({ onSave, onClose, initial }: {
  onSave: (data: Partial<Education>) => void;
  onClose: () => void;
  initial?: Partial<Education>;
}) {
  const [form, setForm] = useState({
    institution: initial?.institution || '',
    degree: initial?.degree || '',
    field: initial?.field || '',
    startYear: initial?.startYear?.toString() || '',
    endYear: initial?.endYear?.toString() || '',
    current: initial?.current || false,
    grade: initial?.grade || '',
    description: initial?.description || '',
  });
  
  const updateField = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  return (
    <ModalWrapper onClose={onClose} title={initial ? 'Edit Education' : 'Add Education'}>
      <div className="space-y-3">
        <FormField label="Institution *" value={form.institution} onChange={updateField('institution')} placeholder="School or college name" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Degree" value={form.degree} onChange={updateField('degree')} placeholder="B.Tech, XII, etc." />
          <FormField label="Field / Subject" value={form.field} onChange={updateField('field')} placeholder="Computer Science" />
          <FormField label="Start year" value={form.startYear} onChange={updateField('startYear')} placeholder="2020" type="number" />
          <FormField label="End year" value={form.endYear} onChange={updateField('endYear')} placeholder="2024" type="number" disabled={form.current} />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={form.current} onChange={(e) => setForm((prev) => ({ ...prev, current: e.target.checked }))} className="accent-violet-500" />
          Currently studying here
        </label>
        <FormField label="Grade / CGPA / Percentage" value={form.grade} onChange={updateField('grade')} placeholder="9.1 CGPA" />
      </div>
      <ModalActions onClose={onClose} onSave={() => onSave({ ...form, startYear: form.startYear ? parseInt(form.startYear) : undefined, endYear: form.endYear ? parseInt(form.endYear) : undefined })} disabled={!form.institution} />
    </ModalWrapper>
  );
}

function AddExperienceModal({ onSave, onClose, initial }: {
  onSave: (data: Partial<Experience>) => void;
  onClose: () => void;
  initial?: Partial<Experience>;
}) {
  const [form, setForm] = useState({
    company: initial?.company || '',
    role: initial?.role || '',
    location: initial?.location || '',
    startDate: initial?.startDate ? initial.startDate.split('T')[0] : '',
    endDate: initial?.endDate ? initial.endDate.split('T')[0] : '',
    current: initial?.current || false,
    description: initial?.description || '',
  });
  
  const updateField = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  return (
    <ModalWrapper onClose={onClose} title={initial ? 'Edit Experience' : 'Add Experience'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Company *" value={form.company} onChange={updateField('company')} placeholder="Google, Startup, etc." />
          <FormField label="Role / Title *" value={form.role} onChange={updateField('role')} placeholder="Software Intern" />
        </div>
        <FormField label="Location" value={form.location} onChange={updateField('location')} placeholder="Bangalore, Remote" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date" value={form.startDate} onChange={updateField('startDate')} type="date" />
          <FormField label="End date" value={form.endDate} onChange={updateField('endDate')} type="date" disabled={form.current} />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={form.current} onChange={(e) => setForm((prev) => ({ ...prev, current: e.target.checked }))} className="accent-violet-500" />
          Currently working here
        </label>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Describe your responsibilities and achievements…" className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none" />
        </div>
      </div>
      <ModalActions onClose={onClose} onSave={() => onSave(form)} disabled={!form.company || !form.role} />
    </ModalWrapper>
  );
}

// ─── Small shared components ──────────────────────

const ModalWrapper = ({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-white text-lg">{title}</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

const ModalActions = ({ onClose, onSave, disabled = false }: { onClose: () => void; onSave: () => void; disabled?: boolean }) => (
  <div className="flex gap-2 mt-5">
    <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800">Cancel</button>
    <button onClick={onSave} disabled={disabled} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold">Save</button>
  </div>
);

// ─── Main Profile component ───────────────────────

export default function ProfessionalProfile() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const { hydrate } = useAuthStore();
  const qc = useQueryClient();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const targetId = userId || me?.id;
  const isMe = !userId || userId === me?.id;

  // Modals
  const [editBio, setEditBio] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [addEdu, setAddEdu] = useState(false);
  const [editEdu, setEditEdu] = useState<Education | null>(null);
  const [addExp, setAddExp] = useState(false);
  const [editExp, setEditExp] = useState<Experience | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['full-profile', targetId],
    queryFn: async () => {
      const endpoint = isMe ? '/profile/me' : `/profile/users/${targetId}`;
      return (await api.get(endpoint)).data.profile;
    },
    enabled: !!targetId,
  });

  const { data: posts = [] } = useQuery<PostData[]>({
    queryKey: ['user-posts', targetId],
    queryFn: async () => (await api.get(`/social/users/${targetId}/posts`)).data.posts,
    enabled: !!targetId,
  });

  const invalidateProfile = () => qc.invalidateQueries({ queryKey: ['full-profile', targetId] });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/profile/me', data),
    onSuccess: () => { invalidateProfile(); hydrate(); },
  });

  const addEduMut = useMutation({
    mutationFn: (data: Partial<Education>) => api.post('/profile/me/education', data),
    onSuccess: () => { invalidateProfile(); setAddEdu(false); },
  });

  const updateEduMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<Education> & { id: string }) =>
      api.patch(`/profile/me/education/${id}`, data),
    onSuccess: () => { invalidateProfile(); setEditEdu(null); },
  });

  const deleteEduMut = useMutation({
    mutationFn: (id: string) => api.delete(`/profile/me/education/${id}`),
    onSuccess: invalidateProfile,
  });

  const addExpMut = useMutation({
    mutationFn: (data: Partial<Experience>) => api.post('/profile/me/experience', data),
    onSuccess: () => { invalidateProfile(); setAddExp(false); },
  });

  const updateExpMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<Experience> & { id: string }) =>
      api.patch(`/profile/me/experience/${id}`, data),
    onSuccess: () => { invalidateProfile(); setEditExp(null); },
  });

  const deleteExpMut = useMutation({
    mutationFn: (id: string) => api.delete(`/profile/me/experience/${id}`),
    onSuccess: invalidateProfile,
  });

  const followMut = useMutation({
    mutationFn: () => profile?.isFollowedByMe
      ? api.delete(`/social/follow/${targetId}`)
      : api.post(`/social/follow/${targetId}`),
    onSuccess: invalidateProfile,
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const fd = new FormData();
    fd.append('image', file);
    await api.post('/profile/me/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await invalidateProfile();
    await hydrate();
    setUploadingBanner(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('image', file);
    await api.post('/social/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await invalidateProfile();
    await hydrate();
    setUploadingAvatar(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    const fd = new FormData();
    fd.append('resume', file);
    await api.post('/profile/me/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await invalidateProfile();
    setUploadingResume(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-zinc-400 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading profile…
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Link to="/dashboard/feed" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm">
            <ArrowLeft className="w-4 h-4" />Back to feed
          </Link>
          <p className="mt-6 text-sm text-zinc-400">Profile not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email.split('@')[0];
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  const profileDataObj = (profile.profileData as Record<string, unknown>) || {};

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* Back link if viewing someone else */}
        {!isMe && (
          <Link to="/dashboard/feed" className="inline-flex items-center gap-2 text-zinc-400 hover:text-violet-400 text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Back to feed
          </Link>
        )}

        {/* ── Hero card ───────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Banner */}
          <div className="relative h-40 md:h-52 bg-gradient-to-br from-violet-900/40 via-zinc-900 to-cyan-900/30">
            {profile.bannerUrl && (
              <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
            )}
            {isMe && (
              <>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition-colors"
                >
                  {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {uploadingBanner ? 'Uploading…' : 'Edit banner'}
                </button>
              </>
            )}
          </div>

          <div className="px-5 pb-5 -mt-14 relative">
            {/* Avatar */}
            <div className="relative inline-block mb-3">
              <div className="ring-4 ring-zinc-900 rounded-full">
                <Avatar user={profile} size={96} />
              </div>
              {isMe && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center ring-2 ring-zinc-900 shadow-lg transition-colors"
                  >
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl md:text-3xl text-white font-bold">{displayName}</h1>
                {profile.headline && <p className="text-sm text-zinc-300 mt-1">{profile.headline}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400 flex-wrap">
                  {location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>
                  )}
                  <span className="capitalize text-violet-400">{ROLE_LABEL[profile.role] || profile.role}</span>
                  <span>{profile._count.followers} followers · {profile._count.following} following</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMe ? (
                  <>
                    <Link
                      to="/dashboard/profile/settings"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit profile
                    </Link>
                    {profile.resumeUrl ? (
                      <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Resume
                      </a>
                    ) : (
                      <>
                        <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" />
                        <button onClick={() => resumeInputRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 transition-colors">
                          {uploadingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {uploadingResume ? 'Uploading…' : 'Upload resume'}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => followMut.mutate()}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      profile.isFollowedByMe
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                    }`}
                  >
                    {profile.isFollowedByMe ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" />Following</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" />Follow</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Social links */}
            {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.websiteUrl) && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                    <Github className="w-3.5 h-3.5" />GitHub
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-400 transition-colors">
                    <Linkedin className="w-3.5 h-3.5" />LinkedIn
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                    <Globe className="w-3.5 h-3.5" />Portfolio
                  </a>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column layout ──────────────────── */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left column: main sections */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* About */}
            <Section title="About" icon={User} onAdd={isMe && !profile.bio ? () => setEditBio(true) : undefined}>
              {profile.bio ? (
                <div className="flex items-start gap-3">
                  <p className="text-sm text-zinc-200 leading-relaxed flex-1">{profile.bio}</p>
                  {isMe && (
                    <button onClick={() => setEditBio(true)} className="text-zinc-500 hover:text-violet-400 flex-shrink-0"><Edit3 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ) : isMe ? (
                <button onClick={() => setEditBio(true)} className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">
                  + Add a bio to tell people about yourself
                </button>
              ) : (
                <p className="text-sm text-zinc-500">No bio yet.</p>
              )}
            </Section>

            {/* Role-specific summary card */}
            {Object.keys(profileDataObj).length > 0 && (
              <Section title="Profile Details" icon={FileText} collapsible>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(profileDataObj).map(([key, val]) => {
                    if (!val || (Array.isArray(val) && !val.length)) return null;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                    return (
                      <div key={key} className="text-sm">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</span>
                        <p className="text-zinc-200 mt-0.5">
                          {Array.isArray(val) ? (val as string[]).join(', ') : String(val)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Education */}
            <Section title="Education" icon={GraduationCap} onAdd={isMe ? () => setAddEdu(true) : undefined}>
              {profile.education.length === 0 && !isMe && <p className="text-sm text-zinc-500">No education added.</p>}
              {profile.education.length === 0 && isMe && (
                <button onClick={() => setAddEdu(true)} className="text-sm text-zinc-500 hover:text-violet-400">+ Add education</button>
              )}
              <div className="space-y-4">
                {profile.education.map((e) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{e.institution}</p>
                      {(e.degree || e.field) && <p className="text-xs text-zinc-300 mt-0.5">{[e.degree, e.field].filter(Boolean).join(' — ')}</p>}
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDateRange(e.startYear, e.endYear, e.current)}</p>
                      {e.grade && <p className="text-xs text-zinc-400 mt-0.5">Grade: {e.grade}</p>}
                    </div>
                    {isMe && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditEdu(e)} className="text-zinc-500 hover:text-violet-400"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteEduMut.mutate(e.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Experience */}
            <Section title="Experience" icon={Briefcase} onAdd={isMe ? () => setAddExp(true) : undefined}>
              {profile.workExperiences.length === 0 && !isMe && <p className="text-sm text-zinc-500">No experience added.</p>}
              {profile.workExperiences.length === 0 && isMe && (
                <button onClick={() => setAddExp(true)} className="text-sm text-zinc-500 hover:text-violet-400">+ Add work experience or internship</button>
              )}
              <div className="space-y-4">
                {profile.workExperiences.map((exp) => (
                  <div key={exp.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{exp.role}</p>
                      <p className="text-xs text-zinc-300 mt-0.5">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
                      {exp.description && <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{exp.description}</p>}
                    </div>
                    {isMe && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditExp(exp)} className="text-zinc-500 hover:text-violet-400"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteExpMut.mutate(exp.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Skills */}
            <Section title="Skills" icon={Target} onAdd={isMe ? () => setEditSkills(true) : undefined}>
              {profile.skills.length === 0 && !isMe && <p className="text-sm text-zinc-500">No skills added.</p>}
              {profile.skills.length === 0 && isMe && (
                <button onClick={() => setEditSkills(true)} className="text-sm text-zinc-500 hover:text-violet-400">+ Add skills</button>
              )}
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/25">{s}</span>
                  ))}
                  {isMe && (
                    <button onClick={() => setEditSkills(true)} className="text-xs px-3 py-1.5 rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:text-violet-400 hover:border-violet-500/50 transition-colors">
                      <Plus className="w-3 h-3 inline mr-1" />Edit
                    </button>
                  )}
                </div>
              )}
            </Section>

            {/* Certifications */}
            {(profile.certificates.length > 0 || isMe) && (
              <Section title="Certifications" icon={Award} onAdd={isMe ? () => window.location.href = '/dashboard/feed' : undefined}>
                {profile.certificates.length === 0 && isMe && (
                  <p className="text-sm text-zinc-500">Post a Certificate in your feed to have it appear here.</p>
                )}
                <div className="space-y-3">
                  {profile.certificates.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{c.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{c.issuer}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(c.issuedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      {c.credentialUrl && (
                        <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-violet-400 text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />Verify
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Activity */}
            {posts.length > 0 && (
              <Section title="Activity" icon={TrendingUp} collapsible>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {isMe && (
              <>
                <StrengthCard score={profile.strengthScore} missing={profile.missingFields} />
                <AIAnalysisCard userId={profile.id} />
              </>
            )}

            {/* Contact info */}
            {(profile.phone || profile.dob || profile.gender) && (
              <Section title="Contact & Info" icon={User}>
                <div className="space-y-2">
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.dob && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  {profile.gender && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      {profile.gender}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Resume */}
            {profile.resumeUrl && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <h3 className="font-semibold text-white text-sm">Resume</h3>
                </div>
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  View / Download Resume
                </a>
                {isMe && (
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    className="mt-2 w-full py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 transition-colors"
                  >
                    Replace resume
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hidden inputs ─── */}
      <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" />

      {/* ── Modals ──────────────────────────────── */}
      <AnimatePresence>
        {editBio && (
          <EditBioModal
            current={profile.bio || ''}
            onSave={(bio) => { updateMut.mutate({ bio }); setEditBio(false); }}
            onClose={() => setEditBio(false)}
          />
        )}
        {editSkills && (
          <EditSkillsModal
            current={profile.skills}
            onSave={(skills) => { updateMut.mutate({ skills }); setEditSkills(false); }}
            onClose={() => setEditSkills(false)}
          />
        )}
        {addEdu && (
          <AddEducationModal
            onSave={(data) => addEduMut.mutate(data as any)}
            onClose={() => setAddEdu(false)}
          />
        )}
        {editEdu && (
          <AddEducationModal
            initial={editEdu}
            onSave={(data) => updateEduMut.mutate({ id: editEdu.id, ...data } as any)}
            onClose={() => setEditEdu(null)}
          />
        )}
        {addExp && (
          <AddExperienceModal
            onSave={(data) => addExpMut.mutate(data as any)}
            onClose={() => setAddExp(false)}
          />
        )}
        {editExp && (
          <AddExperienceModal
            initial={editExp}
            onSave={(data) => updateExpMut.mutate({ id: editExp.id, ...data } as any)}
            onClose={() => setEditExp(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// End of ProfessionalProfile
