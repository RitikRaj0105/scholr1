import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import './styles/ProfileSetup.css';

const ROLES = [
  {
    id: 'STUDENT',
    label: 'School Student',
    icon: '🎓',
    description: 'Classes 6-12, board prep, competitive exams',
    dashboard: '/dashboard',
  },
  {
    id: 'COLLEGE_STUDENT',
    label: 'College Student',
    icon: '📚',
    description: 'Undergrad / postgrad, internships, projects',
    dashboard: '/dashboard',
  },
  {
    id: 'TEACHER',
    label: 'Teacher',
    icon: '👨‍🏫',
    description: 'Teach classes, create assignments, manage students',
    dashboard: '/teacher',
  },
  {
    id: 'WORKING_PROFESSIONAL',
    label: 'Working Professional',
    icon: '💼',
    description: 'Upskill, network, showcase work',
    dashboard: '/dashboard/feed',
  },
  {
    id: 'WORKING_PROFESSIONAL',
    label: 'Job Seeker',
    icon: '🔍',
    description: 'Looking for opportunities, ready to be hired',
    dashboard: '/dashboard/feed',
    sub: 'JOB_SEEKER',
  },
  {
    id: 'WORKING_PROFESSIONAL',
    label: 'Service Provider',
    icon: '🛠️',
    description: 'Freelancer, consultant, agency, contractor',
    dashboard: '/dashboard/feed',
    sub: 'SERVICE_PROVIDER',
  },
  {
    id: 'RECRUITER',
    label: 'Recruiter',
    icon: '🎯',
    description: 'Find talent, post jobs, build pipeline',
    dashboard: '/dashboard/feed',
  },
  {
    id: 'PARENT',
    label: 'Parent',
    icon: '👨‍👩‍👧',
    description: "Track your child's progress",
    dashboard: '/dashboard',
  },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];
const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
 

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    gender: '',
    country: 'India',
    state: '',
    city: '',
    role: '',
    subRole: '',
    headline: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    websiteUrl: '',
    skills: '',
    roleData: {} as any,
  });

  useEffect(() => {
    if (user?.firstName) setForm((f: any) => ({ ...f, firstName: user.firstName }));
    if (user?.lastName) setForm((f: any) => ({ ...f, lastName: user.lastName }));
  }, [user]);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  function updateField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    setError('');
  }

  function updateRoleData(field: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      roleData: { ...prev.roleData, [field]: value },
    }));
  }

  function selectRole(index: number) {
    const r = ROLES[index];
    setSelectedRoleIndex(index);
    setForm((prev: any) => ({
      ...prev,
      role: r.id,
      subRole: r.sub || '',
      roleData: {},
    }));
    setError('');
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.firstName.trim()) return 'First name is required';
      if (!form.phone.trim() || form.phone.length < 10) return 'Valid phone number is required';
      if (!form.dob) return 'Date of birth is required';
    }
    if (s === 2) {
      if (!form.country) return 'Country is required';
      if (!form.state) return 'State is required';
      if (!form.city.trim()) return 'City is required';
    }
    if (s === 3) {
      if (!form.role) return 'Please pick a role';
    }
    return null;
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function prevStep() {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      // Step 1: basic info
      await api.post('/profile/onboarding/step1', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        country: form.country,
        state: form.state,
        city: form.city,
      });

      // Step 2: role
      await api.post('/profile/onboarding/step2', { role: form.role });

      // Step 3: role-specific data + final
      const skills = form.skills
        ? form.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      
      const profileData = { 
        ...form.roleData,
        ...(form.subRole ? { subRole: form.subRole } : {}),
      };

      await api.post('/profile/onboarding/step3', {
        profileData,
        headline: form.headline,
        bio: form.bio,
        skills,
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
        portfolioUrl: form.portfolioUrl,
        websiteUrl: form.websiteUrl,
      });

      // Upload avatar if provided
      if (avatarFile) {
        const fd = new FormData();
        fd.append('image', avatarFile);
        try {
          await api.post('/social/upload/avatar', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (e) {
          console.warn('Avatar upload failed (continuing):', e);
        }
      }

      // Upload banner if provided
      if (bannerFile) {
        const fd = new FormData();
        fd.append('image', bannerFile);
        try {
          await api.post('/profile/me/banner', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (e) {
          console.warn('Banner upload failed (continuing):', e);
        }
      }

      // Refresh user from auth/me to get updated role + onboardingDone
      try {
        const { data } = await api.get('/auth/me');
         useAuthStore.setState({ user: data.user || data });
      } catch (e) {
        console.warn('fetchMe failed:', e);
      }

      // Route to correct dashboard
      const role = selectedRoleIndex !== null ? ROLES[selectedRoleIndex] : null;
      navigate(role?.dashboard || '/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      console.error('ProfileSetup submit error:', err?.response?.data || err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ps-wrapper">
      <div className="ps-container">
        <div className="ps-progress-bar">
          <div className="ps-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="ps-header">
          <h1 className="ps-title">Complete your profile</h1>
          <p className="ps-subtitle">Step {step} of {totalSteps}</p>
        </div>

        {error && (
          <motion.div
            className="ps-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              className="ps-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="ps-card-title">Basic information</h2>
              <p className="ps-card-subtitle">Let's start with the basics about you</p>

              <div className="ps-grid-2">
                <div className="ps-field">
                  <label className="ps-label">First name <span className="ps-required">*</span></label>
                  <input className="ps-input" type="text" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Ritik" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Last name</label>
                  <input className="ps-input" type="text" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Raj" />
                </div>
              </div>

              <div className="ps-grid-2">
                <div className="ps-field">
                  <label className="ps-label">Phone number <span className="ps-required">*</span></label>
                  <input className="ps-input" type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" maxLength={10} />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Date of birth <span className="ps-required">*</span></label>
                  <input className="ps-input" type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} max={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="ps-field">
                <label className="ps-label">Gender</label>
                <div className="ps-radio-group">
                  {GENDERS.map((g) => (
                    <button key={g} type="button" className={`ps-radio-btn ${form.gender === g ? 'active' : ''}`} onClick={() => updateField('gender', g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              className="ps-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="ps-card-title">Where are you based?</h2>
              <p className="ps-card-subtitle">This helps us personalize content and opportunities</p>

              <div className="ps-field">
                <label className="ps-label">Country <span className="ps-required">*</span></label>
                <input className="ps-input" type="text" value={form.country} onChange={(e) => updateField('country', e.target.value)} placeholder="India" />
              </div>

              <div className="ps-grid-2">
                <div className="ps-field">
                  <label className="ps-label">State <span className="ps-required">*</span></label>
                  <select className="ps-input" value={form.state} onChange={(e) => updateField('state', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ps-field">
                  <label className="ps-label">City <span className="ps-required">*</span></label>
                  <input className="ps-input" type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Jamshedpur" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              className="ps-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="ps-card-title">What describes you best?</h2>
              <p className="ps-card-subtitle">Pick one — this determines your dashboard experience</p>

              <div className="ps-role-grid">
                {ROLES.map((r, idx) => (
                  <button
                    key={`${r.id}-${r.sub || idx}`}
                    type="button"
                    className={`ps-role-card ${selectedRoleIndex === idx ? 'active' : ''}`}
                    onClick={() => selectRole(idx)}
                  >
                    <div className="ps-role-icon">{r.icon}</div>
                    <div className="ps-role-label">{r.label}</div>
                    <div className="ps-role-desc">{r.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              className="ps-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="ps-card-title">Tell us more about your {selectedRoleIndex !== null ? ROLES[selectedRoleIndex].label.toLowerCase() : ''} profile</h2>
              <p className="ps-card-subtitle">Help us tailor the platform to you</p>

              {form.role === 'STUDENT' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">School name</label>
                      <input className="ps-input" type="text" value={form.roleData.schoolName || ''} onChange={(e) => updateRoleData('schoolName', e.target.value)} placeholder="DAV Public School" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Board</label>
                      <select className="ps-input" value={form.roleData.board || ''} onChange={(e) => updateRoleData('board', e.target.value)}>
                        <option value="">Select board</option>
                        {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Class</label>
                      <select className="ps-input" value={form.roleData.class || ''} onChange={(e) => updateRoleData('class', e.target.value)}>
                        <option value="">Select class</option>
                        {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Section</label>
                      <input className="ps-input" type="text" value={form.roleData.section || ''} onChange={(e) => updateRoleData('section', e.target.value)} placeholder="A" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Goals (JEE / NEET / Boards / Olympiad)</label>
                    <input className="ps-input" type="text" value={form.roleData.goals || ''} onChange={(e) => updateRoleData('goals', e.target.value)} placeholder="JEE Main 2026, Class 12 Boards" />
                  </div>
                </>
              )}

              {form.role === 'COLLEGE_STUDENT' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">College name</label>
                      <input className="ps-input" type="text" value={form.roleData.college || ''} onChange={(e) => updateRoleData('college', e.target.value)} placeholder="IIT Bombay" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">University</label>
                      <input className="ps-input" type="text" value={form.roleData.university || ''} onChange={(e) => updateRoleData('university', e.target.value)} placeholder="Bombay University" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Degree</label>
                      <input className="ps-input" type="text" value={form.roleData.degree || ''} onChange={(e) => updateRoleData('degree', e.target.value)} placeholder="B.Tech" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Branch / Major</label>
                      <input className="ps-input" type="text" value={form.roleData.branch || ''} onChange={(e) => updateRoleData('branch', e.target.value)} placeholder="Computer Science" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Year / Semester</label>
                      <input className="ps-input" type="text" value={form.roleData.year || ''} onChange={(e) => updateRoleData('year', e.target.value)} placeholder="3rd year / Sem 6" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">CGPA</label>
                      <input className="ps-input" type="text" value={form.roleData.cgpa || ''} onChange={(e) => updateRoleData('cgpa', e.target.value)} placeholder="8.5" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Career goals</label>
                    <input className="ps-input" type="text" value={form.roleData.goals || ''} onChange={(e) => updateRoleData('goals', e.target.value)} placeholder="Software Engineer at FAANG" />
                  </div>
                </>
              )}

              {form.role === 'TEACHER' && (
                <>
                  <div className="ps-field">
                    <label className="ps-label">Institution</label>
                    <input className="ps-input" type="text" value={form.roleData.institution || ''} onChange={(e) => updateRoleData('institution', e.target.value)} placeholder="Delhi Public School" />
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Subjects taught</label>
                      <input className="ps-input" type="text" value={form.roleData.subjects || ''} onChange={(e) => updateRoleData('subjects', e.target.value)} placeholder="Math, Physics" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Years of experience</label>
                      <input className="ps-input" type="number" min={0} value={form.roleData.experience || ''} onChange={(e) => updateRoleData('experience', e.target.value)} placeholder="5" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Qualifications</label>
                    <input className="ps-input" type="text" value={form.roleData.qualifications || ''} onChange={(e) => updateRoleData('qualifications', e.target.value)} placeholder="M.Sc Physics, B.Ed" />
                  </div>
                </>
              )}

              {form.role === 'WORKING_PROFESSIONAL' && form.subRole === '' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Company</label>
                      <input className="ps-input" type="text" value={form.roleData.company || ''} onChange={(e) => updateRoleData('company', e.target.value)} placeholder="Google" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Job title</label>
                      <input className="ps-input" type="text" value={form.roleData.jobTitle || ''} onChange={(e) => updateRoleData('jobTitle', e.target.value)} placeholder="Software Engineer" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Industry</label>
                      <input className="ps-input" type="text" value={form.roleData.industry || ''} onChange={(e) => updateRoleData('industry', e.target.value)} placeholder="Tech / Finance" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Years of experience</label>
                      <input className="ps-input" type="number" min={0} value={form.roleData.experience || ''} onChange={(e) => updateRoleData('experience', e.target.value)} placeholder="3" />
                    </div>
                  </div>
                </>
              )}

              {form.role === 'WORKING_PROFESSIONAL' && form.subRole === 'JOB_SEEKER' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Current role (if any)</label>
                      <input className="ps-input" type="text" value={form.roleData.currentRole || ''} onChange={(e) => updateRoleData('currentRole', e.target.value)} placeholder="Frontend Developer" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Looking for</label>
                      <input className="ps-input" type="text" value={form.roleData.lookingFor || ''} onChange={(e) => updateRoleData('lookingFor', e.target.value)} placeholder="Senior Backend Engineer" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Years of experience</label>
                      <input className="ps-input" type="number" min={0} value={form.roleData.experience || ''} onChange={(e) => updateRoleData('experience', e.target.value)} placeholder="3" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Expected salary (LPA)</label>
                      <input className="ps-input" type="text" value={form.roleData.expectedSalary || ''} onChange={(e) => updateRoleData('expectedSalary', e.target.value)} placeholder="15-20" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Preferred location</label>
                    <input className="ps-input" type="text" value={form.roleData.preferredLocation || ''} onChange={(e) => updateRoleData('preferredLocation', e.target.value)} placeholder="Bangalore, Remote" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Notice period</label>
                    <input className="ps-input" type="text" value={form.roleData.noticePeriod || ''} onChange={(e) => updateRoleData('noticePeriod', e.target.value)} placeholder="30 days" />
                  </div>
                </>
              )}

              {form.role === 'WORKING_PROFESSIONAL' && form.subRole === 'SERVICE_PROVIDER' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Service category</label>
                      <input className="ps-input" type="text" value={form.roleData.serviceCategory || ''} onChange={(e) => updateRoleData('serviceCategory', e.target.value)} placeholder="Web Development" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Business / Agency name</label>
                      <input className="ps-input" type="text" value={form.roleData.businessName || ''} onChange={(e) => updateRoleData('businessName', e.target.value)} placeholder="Solo / Acme Studio" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Hourly rate</label>
                      <input className="ps-input" type="text" value={form.roleData.hourlyRate || ''} onChange={(e) => updateRoleData('hourlyRate', e.target.value)} placeholder="₹1500/hr" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Years in business</label>
                      <input className="ps-input" type="number" min={0} value={form.roleData.experience || ''} onChange={(e) => updateRoleData('experience', e.target.value)} placeholder="2" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Services offered</label>
                    <input className="ps-input" type="text" value={form.roleData.servicesOffered || ''} onChange={(e) => updateRoleData('servicesOffered', e.target.value)} placeholder="React websites, SEO audits, mobile apps" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Availability</label>
                    <input className="ps-input" type="text" value={form.roleData.availability || ''} onChange={(e) => updateRoleData('availability', e.target.value)} placeholder="20 hrs/week, immediate" />
                  </div>
                </>
              )}

              {form.role === 'RECRUITER' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Company name</label>
                      <input className="ps-input" type="text" value={form.roleData.company || ''} onChange={(e) => updateRoleData('company', e.target.value)} placeholder="Acme Inc" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Company website</label>
                      <input className="ps-input" type="url" value={form.roleData.website || ''} onChange={(e) => updateRoleData('website', e.target.value)} placeholder="https://acme.com" />
                    </div>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Industry</label>
                    <input className="ps-input" type="text" value={form.roleData.industry || ''} onChange={(e) => updateRoleData('industry', e.target.value)} placeholder="Tech, FinTech" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Roles you're hiring for</label>
                    <input className="ps-input" type="text" value={form.roleData.hiringFor || ''} onChange={(e) => updateRoleData('hiringFor', e.target.value)} placeholder="Frontend Engineer, Data Scientist" />
                  </div>
                </>
              )}

              {form.role === 'PARENT' && (
                <>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Child's name</label>
                      <input className="ps-input" type="text" value={form.roleData.childName || ''} onChange={(e) => updateRoleData('childName', e.target.value)} placeholder="Aarav" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Child's school</label>
                      <input className="ps-input" type="text" value={form.roleData.childSchool || ''} onChange={(e) => updateRoleData('childSchool', e.target.value)} placeholder="DPS Bangalore" />
                    </div>
                  </div>
                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">Child's class</label>
                      <select className="ps-input" value={form.roleData.childClass || ''} onChange={(e) => updateRoleData('childClass', e.target.value)}>
                        <option value="">Select class</option>
                        {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Child's goal</label>
                      <input className="ps-input" type="text" value={form.roleData.childGoal || ''} onChange={(e) => updateRoleData('childGoal', e.target.value)} placeholder="JEE 2027" />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              className="ps-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="ps-card-title">Finish your public profile</h2>
              <p className="ps-card-subtitle">These are all optional — you can add them later from settings</p>

              <div className="ps-field">
                <label className="ps-label">Cover banner</label>
                <div className="ps-banner-upload" style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}}>
                  {!bannerPreview && <span className="ps-upload-hint">Click to upload banner image</span>}
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="ps-file-input" />
                </div>
              </div>

              <div className="ps-field">
                <label className="ps-label">Profile picture</label>
                <div className="ps-avatar-row">
                  <div className="ps-avatar-preview">
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <span>{form.firstName.charAt(0) || '?'}</span>}
                  </div>
                  <label className="ps-upload-btn">
                    {avatarPreview ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="ps-file-input-hidden" />
                  </label>
                </div>
              </div>

              <div className="ps-field">
                <label className="ps-label">Headline</label>
                <input className="ps-input" type="text" value={form.headline} onChange={(e) => updateField('headline', e.target.value)} placeholder="JEE Aspirant · Class 12 · Future SDE" maxLength={100} />
              </div>

              <div className="ps-field">
                <label className="ps-label">Short bio</label>
                <textarea className="ps-input ps-textarea" value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="A line or two about you" rows={3} maxLength={300} />
              </div>

              <div className="ps-field">
                <label className="ps-label">Skills (comma-separated)</label>
                <input className="ps-input" type="text" value={form.skills} onChange={(e) => updateField('skills', e.target.value)} placeholder="Python, React, Problem Solving" />
              </div>

              <div className="ps-grid-2">
                <div className="ps-field">
                  <label className="ps-label">GitHub URL</label>
                  <input className="ps-input" type="url" value={form.githubUrl} onChange={(e) => updateField('githubUrl', e.target.value)} placeholder="https://github.com/you" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">LinkedIn URL</label>
                  <input className="ps-input" type="url" value={form.linkedinUrl} onChange={(e) => updateField('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/you" />
                </div>
              </div>

              <div className="ps-grid-2">
                <div className="ps-field">
                  <label className="ps-label">Portfolio URL</label>
                  <input className="ps-input" type="url" value={form.portfolioUrl} onChange={(e) => updateField('portfolioUrl', e.target.value)} placeholder="https://yoursite.com" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Website URL</label>
                  <input className="ps-input" type="url" value={form.websiteUrl} onChange={(e) => updateField('websiteUrl', e.target.value)} placeholder="https://example.com" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ps-actions">
          {step > 1 && (
            <button className="ps-btn-secondary" onClick={prevStep} disabled={submitting}>← Back</button>
          )}
          <div className="ps-spacer" />
          {step < totalSteps ? (
            <button className="ps-btn-primary" onClick={nextStep}>Next →</button>
          ) : (
            <button className="ps-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Complete profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
