import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Code2,
  Users,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/problems', icon: Code2, label: 'Coding Problems' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || 'A';

  return (
    <div className="min-h-screen bg-ink-950 text-bone-100 font-sans">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 w-60 border-r border-red-500/[0.08] bg-ink-950 z-40 flex flex-col">
          {/* Admin badge header */}
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <Link to="/admin" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-display text-lg text-bone-50 leading-none">
                  Scholr Admin
                </div>
                <div className="text-[10px] text-red-400 uppercase tracking-wider mt-0.5 font-medium">
                  Restricted area
                </div>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500/10 text-red-400'
                        : 'text-bone-300 hover:text-bone-100 hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}

            <div className="my-3 h-px bg-white/[0.06]" />

            <NavLink
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-bone-400 hover:text-bone-100 hover:bg-white/[0.03] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </NavLink>
          </nav>

          {/* User card */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-bone-50 truncate font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-red-400 truncate uppercase tracking-wider font-medium">
                  Admin
                </div>
              </div>
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
