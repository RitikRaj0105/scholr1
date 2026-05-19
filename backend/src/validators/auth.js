import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['EMAIL_VERIFY', 'PASSWORD_RESET', 'TWO_FACTOR']),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(['EMAIL_VERIFY', 'PASSWORD_RESET', 'TWO_FACTOR']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});
