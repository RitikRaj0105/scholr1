import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Brain, Target, BookOpen, Code2,
  Briefcase, Heart, Users, Settings, LogOut, CalendarDays, ShieldCheck,
  GraduationCap, MessageSquare,
} from 'lucide-react';
import { useAuthStore, isAdmin, isTeacher } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/feed', icon: MessageSquare, label: 'Feed' },
  { to: '/dashboard/planner', icon: CalendarDays, label: 'Planner' },
  { to: '/dashboard/ai', icon: Brain, label: 'AI Mentor' },
  { to: '/dashboard/focus', icon: Target, label: 'Focus Mode' },
  { to: '/dashboard/tests', icon: BookOpen, label: 'Tests' },
  { to: '/dashboard/code', icon: Code2, label: 'Coding' },
  { to: '/dashboard/career', icon: Briefcase, label: 'Career' },
  { to: '/dashboard/wellness', icon: Heart, label: 'Wellness' },
  { to: '/dashboard/classroom', icon: Users, label: 'Classroom' },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || 'U';

  return (
    <div className="min-h-screen bg-ink-950 text-bone-100 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 w-60 border-r border-white/[0.06] bg-ink-950 z-40 flex flex-col">
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <span className="text-white font-display text-sm">S</span>
              </div>
              <span className="font-display text-xl text-bone-50 tracking-tight">Scholr</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.3 }}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-500/10 text-violet-400'
                        : 'text-bone-300 hover:text-bone-100 hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <item.icon className="w-[16px] h-[16px]" />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}

            {isAdmin(user) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="pt-3 mt-3 border-t border-white/[0.06]"
              >
                <NavLink
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <ShieldCheck className="w-[16px] h-[16px]" />
                  <span>Admin panel</span>
                </NavLink>
              </motion.div>
            )}

            {isTeacher(user) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                className={!isAdmin(user) ? 'pt-3 mt-3 border-t border-white/[0.06]' : ''}
              >
                <NavLink
                  to="/teacher"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <GraduationCap className="w-[16px] h-[16px]" />
                  <span>Teacher panel</span>
                </NavLink>
              </motion.div>
            )}
          </nav>

          <div className="px-3 py-3 border-t border-white/[0.06]">
            <NavLink
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-bone-300 hover:text-bone-100 hover:bg-white/[0.03] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
            <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                title="View profile"
              >
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-bone-50 truncate font-medium">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[11px] text-bone-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-7 h-7 rounded-md text-bone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-60 min-h-screen">{children}</main>
      </div>
    </div>
  );
};
