import { create } from 'zustand';
import { api, setAccessToken, getAccessToken } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'STUDENT' | 'COLLEGE_STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'COLLEGE_ADMIN' | 'RECRUITER' | 'WORKING_PROFESSIONAL' | 'SUPER_ADMIN';
  subscriptionTier: 'FREE' | 'PRO' | 'INSTITUTION' | 'ENTERPRISE';
  emailVerified: boolean;
  onboardingDone: boolean;
  headline: string | null;
}

// Role helpers — single source of truth
export const ADMIN_ROLES: User['role'][] = ['SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'];
export const TEACHER_ROLES: User['role'][] = ['TEACHER', ...ADMIN_ROLES];
export const PROFESSIONAL_ROLES: User['role'][] = ['WORKING_PROFESSIONAL', 'RECRUITER', 'COLLEGE_STUDENT'];

export const isAdmin = (u: User | null): boolean =>
  !!u && ADMIN_ROLES.includes(u.role);

export const isTeacher = (u: User | null): boolean =>
  !!u && TEACHER_ROLES.includes(u.role);

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: User['role'];
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: getAccessToken(),
  status: 'idle',

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await api.get<{ ok: true; user: User }>('/auth/me');
      set({ user: data.user, accessToken: getAccessToken(), status: 'authenticated' });
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    // Clear any leftover cache from a previous user BEFORE setting new auth
    queryClient.clear();
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, status: 'authenticated' });
  },

  signup: async (payload) => {
    queryClient.clear();
    const { data } = await api.post('/auth/signup', payload);
    setAccessToken(data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    set({ user: null, accessToken: null, status: 'unauthenticated' });
    // Clear all cached query data so next user doesn't see previous user's data
    queryClient.clear();
  },
}));
