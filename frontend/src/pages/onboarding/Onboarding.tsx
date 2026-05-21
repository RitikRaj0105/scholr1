import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, MapPin, ChevronRight, ChevronLeft,
  BookOpen, GraduationCap, Briefcase, Users, Building2, Sparkles,
  Check, Upload, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/social/Avatar';

// ─── Role definitions ──────────────────────────────

const ROLES = [
  {
    value: 'STUDENT',
    label: 'School Student',
    icon: BookOpen,
    desc: 'Class 6–12, preparing for board or competitive exams',
    color: 'cyan',
  },
  {
    value: 'COLLEGE_STUDENT',
    label: 'College Student',
    icon: GraduationCap,
    desc: 'Undergraduate or postgraduate student',
    color: 'violet',
  },
  {
    value: 'TEACHER',
    label: 'Teacher / Educator',
    icon: Users,
    desc: 'School or college teacher, tutor, or trainer',
    color: 'emerald',
  },
  {
    value: 'PARENT',
    label: 'Parent / Guardian',
    icon: Users,
    desc: 'Parent monitoring their child\'s learning',
    color: 'amber',
  },
  {
    value: 'RECRUITER',
    label: 'Recruiter / HR',
    icon: Building2,
    desc: 'Hiring managers and talent acquisition teams',
    color: 'red',
  },
  {
    value: 'WORKING_PROFESSIONAL',
    label: 'Working Professional',
    icon: Briefcase,
    desc: 'Industry professional upskilling or exploring roles',
    color: 'pink',
  },
];

const ROLE_COLORS: Record<string, string> = {
  cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
  violet: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  red: 'border-red-500/30 bg-red-500/5 text-red-400',
  pink: 'border-pink-500/30 bg-pink-500/5 text-pink-400',
};

const ROLE_COLORS_ACTIVE: Record<string, string> = {
  cyan: 'border-cyan-400 bg-cyan-500/15 shadow-cyan-500/20',
  violet: 'border-violet-400 bg-violet-500/15 shadow-violet-500/20',
  emerald: 'border-emerald-400 bg-emerald-500/15 shadow-emerald-500/20',
  amber: 'border-amber-400 bg-amber-500/15 shadow-amber-500/20',
  red: 'border-red-400 bg-red-500/15 shadow-red-500/20',
  pink: 'border-pink-400 bg-pink-500/15 shadow-pink-500/20',
};

// ─── Role-specific form field components (defined at module level to prevent focus loss) ───

function RoleField({
  label,
  name,
  placeholder,
  type = 'text',
  data,
  onChange,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  data: Record<string, string | string[]>;
  onChange: (key: string, val: string | string[]) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
        {label}
      </label>
      <input
        type={type}
        value={(data[name] as string) || ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
      />
    </div>
  );
}

function TagInput({
  label,
  name,
  placeholder,
  data,
  onChange,
}: {
  label: string;
  name: string;
  placeholder?: string;
  data: Record<string, string | string[]>;
  onChange: (key: string, val: string | string[]) => void;
}) {
  const tags = (data[name] as string[]) || [];
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    onChange(name, [...tags, input.trim()]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {t}
              <button onClick={() => onChange(name, tags.filter(x => x !== t))} className="text-violet-400 hover:text-red-400 ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Role-specific form fields ────────────────────

function RoleSpecificFields({
  role,
  data,
  onChange,
}: {
  role: string;
  data: Record<string, string | string[]>;
  onChange: (key: string, val: string | string[]) => void;
}) {

  if (role === 'STUDENT') return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <RoleField label="School name" name="schoolName" placeholder="e.g. DPS, Delhi" data={data} onChange={onChange} />
        <RoleField label="Board" name="board" placeholder="CBSE, ICSE, State Board…" data={data} onChange={onChange} />
        <RoleField label="Class" name="class" placeholder="e.g. 11" data={data} onChange={onChange} />
        <RoleField label="Section" name="section" placeholder="e.g. A" data={data} onChange={onChange} />
        <RoleField label="Roll number" name="rollNumber" placeholder="e.g. 42" data={data} onChange={onChange} />
        <RoleField label="Parent mobile" name="parentMobile" placeholder="+91 …" data={data} onChange={onChange} />
      </div>
      <RoleField label="Parent / Guardian name" name="parentName" placeholder="Full name" data={data} onChange={onChange} />
      <TagInput label="Favourite subjects" name="favoriteSubjects" placeholder="Add a subject" data={data} onChange={onChange} />
      <TagInput label="Weak subjects (for AI suggestions)" name="weakSubjects" placeholder="Add a subject" data={data} onChange={onChange} />
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Study goals</label>
        <textarea
          value={(data['studyGoals'] as string) || ''}
          onChange={(e) => onChange('studyGoals', e.target.value)}
          rows={2}
          placeholder="e.g. Clear JEE Mains 2026 with 99+ percentile"
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>
    </div>
  );

  if (role === 'COLLEGE_STUDENT') return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <RoleField label="College name" name="collegeName" placeholder="e.g. IIT Bombay" data={data} onChange={onChange} />
        <RoleField label="University" name="university" placeholder="e.g. Mumbai University" data={data} onChange={onChange} />
        <RoleField label="Degree" name="degree" placeholder="B.Tech, M.Sc, MBA…" data={data} onChange={onChange} />
        <RoleField label="Branch / Major" name="branch" placeholder="Computer Science, Finance…" data={data} onChange={onChange} />
        <RoleField label="Semester" name="semester" placeholder="e.g. 5th" data={data} onChange={onChange} />
        <RoleField label="CGPA" name="cgpa" placeholder="e.g. 8.5" data={data} onChange={onChange} />
      </div>
      <RoleField label="GitHub profile" name="githubUrl" placeholder="https://github.com/username" data={data} onChange={onChange} />
      <RoleField label="LinkedIn profile" name="linkedinUrl" placeholder="https://linkedin.com/in/username" data={data} onChange={onChange} />
      <TagInput label="Skills" name="skills" placeholder="Add a skill (e.g. Python, React)" data={data} onChange={onChange} />
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Career goals</label>
        <textarea
          value={(data['careerGoals'] as string) || ''}
          onChange={(e) => onChange('careerGoals', e.target.value)}
          rows={2}
          placeholder="e.g. Get a SWE role at a product company"
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>
    </div>
  );

  if (role === 'TEACHER') return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <RoleField label="Institution" name="institution" placeholder="School or college name" data={data} onChange={onChange} />
        <RoleField label="Experience (years)" name="experience" placeholder="e.g. 8" type="number" data={data} onChange={onChange} />
      </div>
      <TagInput label="Subjects you teach" name="subjects" placeholder="Add a subject" data={data} onChange={onChange} />
      <TagInput label="Qualifications" name="qualifications" placeholder="e.g. M.Sc Physics, B.Ed" data={data} onChange={onChange} />
    </div>
  );

  if (role === 'PARENT') return (
    <div className="space-y-3">
      <RoleField label="Child's school" name="childSchool" placeholder="e.g. Delhi Public School" data={data} onChange={onChange} />
      <RoleField label="Child's class" name="childClass" placeholder="e.g. 9" data={data} onChange={onChange} />
      <RoleField label="Child's goal" name="childGoal" placeholder="e.g. Prepare for NEET" data={data} onChange={onChange} />
    </div>
  );

  if (role === 'RECRUITER') return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <RoleField label="Company name" name="company" placeholder="e.g. Google" data={data} onChange={onChange} />
        <RoleField label="Industry" name="industry" placeholder="e.g. Technology" data={data} onChange={onChange} />
      </div>
      <RoleField label="Company website" name="companyWebsite" placeholder="https://company.com" data={data} onChange={onChange} />
      <TagInput label="Roles you hire for" name="hiringRoles" placeholder="e.g. Software Engineer" data={data} onChange={onChange} />
    </div>
  );

  if (role === 'WORKING_PROFESSIONAL') return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <RoleField label="Current company" name="company" placeholder="e.g. Infosys" data={data} onChange={onChange} />
        <RoleField label="Job title / Role" name="jobRole" placeholder="e.g. Senior Developer" data={data} onChange={onChange} />
        <RoleField label="Total experience" name="experience" placeholder="e.g. 4 years" data={data} onChange={onChange} />
        <RoleField label="Industry" name="industry" placeholder="e.g. FinTech" data={data} onChange={onChange} />
      </div>
      <RoleField label="LinkedIn profile" name="linkedinUrl" placeholder="https://linkedin.com/in/username" data={data} onChange={onChange} />
      <RoleField label="Portfolio / website" name="portfolioUrl" placeholder="https://yourname.dev" data={data} onChange={onChange} />
      <TagInput label="Skills" name="skills" placeholder="Add a skill" data={data} onChange={onChange} />
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Career goals</label>
        <textarea
          value={(data['careerGoals'] as string) || ''}
          onChange={(e) => onChange('careerGoals', e.target.value)}
          rows={2}
          placeholder="e.g. Move into a leadership role in next 2 years"
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>
    </div>
  );

  return null;
}

// ─── Main Onboarding component ────────────────────

export default function Onboarding() {
  const user = useAuthStore((s) => s.user);
  const { hydrate } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [basicData, setBasicData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    dob: '',
    gender: '',
    country: '',
    state: '',
    city: '',
  });

  // Step 2 data
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'STUDENT');

  // Step 3 data
  const [roleFields, setRoleFields] = useState<Record<string, string | string[]>>({});
  const [globalSkills, setGlobalSkills] = useState<string[]>([]);
  const [headline, setHeadline] = useState('');

  const step1Mut = useMutation({
    mutationFn: () => api.post('/profile/onboarding/step1', basicData),
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Failed'),
  });

  const step2Mut = useMutation({
    mutationFn: () => api.post('/profile/onboarding/step2', { role: selectedRole }),
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Failed'),
  });

  const step3Mut = useMutation({
    mutationFn: () => {
      const skills = [
        ...(Array.isArray(roleFields['skills']) ? roleFields['skills'] as string[] : []),
        ...globalSkills,
      ];
      const profileData = { ...roleFields };
      delete profileData['skills'];

      return api.post('/profile/onboarding/step3', {
        profileData,
        skills: [...new Set(skills)],
        headline: headline ||
          (roleFields['jobRole'] ? `${roleFields['jobRole']} at ${roleFields['company']}` : '') ||
          (roleFields['degree'] ? `${roleFields['degree']} Student` : '') ||
          `${ROLES.find(r => r.value === selectedRole)?.label || 'Scholr User'}`,
      });
    },
    onSuccess: async () => {
      await hydrate();
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => setError(err?.response?.data?.error?.message || 'Failed'),
  });

  const handleNext = async () => {
    setError(null);
    if (step === 1) {
      await step1Mut.mutateAsync();
      setStep(2);
    } else if (step === 2) {
      await step2Mut.mutateAsync();
      setStep(3);
    } else if (step === 3) {
      await step3Mut.mutateAsync();
    }
  };

  const selectedRoleData = ROLES.find((r) => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl text-white">Scholr</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            {step === 1 ? 'Set up your profile' : step === 2 ? 'What best describes you?' : 'Tell us more about yourself'}
          </h1>
          <p className="text-sm text-zinc-400">
            {step === 1 ? 'Basic info — takes 2 minutes' : step === 2 ? 'This personalizes your entire Scholr experience' : 'Fills in the details that make your profile stand out'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${s <= step ? 'bg-violet-500' : 'bg-zinc-800'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'First name', key: 'firstName', placeholder: 'Rahul', icon: User },
                  { label: 'Last name', key: 'lastName', placeholder: 'Sharma', icon: User },
                ].map(({ label, key, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        value={basicData[key as keyof typeof basicData]}
                        onChange={(e) => setBasicData((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      value={basicData.phone}
                      onChange={(e) => setBasicData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Date of birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="date"
                      value={basicData.dob}
                      onChange={(e) => setBasicData((prev) => ({ ...prev, dob: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">Gender</label>
                <select
                  value={basicData.gender}
                  onChange={(e) => setBasicData((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['country', 'state', 'city'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        value={basicData[field]}
                        onChange={(e) => setBasicData((prev) => ({ ...prev, [field]: e.target.value }))}
                        placeholder={field === 'country' ? 'India' : field === 'state' ? 'Maharashtra' : 'Mumbai'}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Role selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left shadow-lg ${
                      isSelected
                        ? `${ROLE_COLORS_ACTIVE[role.color]} shadow-lg`
                        : `${ROLE_COLORS[role.color]} hover:border-opacity-60`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      ROLE_COLORS[role.color]
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{role.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Step 3: Role-specific details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Role badge */}
              {selectedRoleData && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${ROLE_COLORS[selectedRoleData.color]}`}>
                  <selectedRoleData.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{selectedRoleData.label}</span>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                {/* Headline */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Profile headline (optional)
                  </label>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={
                      selectedRole === 'STUDENT' ? 'Class 12 CBSE | JEE Aspirant' :
                      selectedRole === 'COLLEGE_STUDENT' ? 'B.Tech CSE @ IIT Delhi | ML Enthusiast' :
                      selectedRole === 'WORKING_PROFESSIONAL' ? 'Senior Developer @ TechCorp | 5 YOE' :
                      'Your professional headline'
                    }
                    maxLength={120}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <RoleSpecificFields
                  role={selectedRole}
                  data={roleFields}
                  onChange={(k, v) => setRoleFields((prev) => ({ ...prev, [k]: v }))}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={step1Mut.isPending || step2Mut.isPending || step3Mut.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {(step1Mut.isPending || step2Mut.isPending || step3Mut.isPending) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {step === 3 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Complete setup
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-4">
          {step === 3 ? 'You can always edit this later in profile settings.' : `Step ${step} of 3`}
        </p>
      </div>
    </div>
  );
}
