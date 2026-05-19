import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/prisma.js';
import { env, isProd } from '../config/env.js';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../validators/auth.validator.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/token.service.js';
import { BadRequest, Conflict, Unauthorized, NotFound } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const BCRYPT_ROUNDS = 12;

const REFRESH_COOKIE = 'refreshToken';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
  });
};

const publicUser = (u: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  avatarUrl: string | null;
  subscriptionTier: string;
  emailVerified: boolean;
}) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  avatarUrl: u.avatarUrl,
  subscriptionTier: u.subscriptionTier,
  emailVerified: u.emailVerified,
});

// =====================================================================

export const signup = async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw Conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      authProvider: 'LOCAL',
      emailVerifyToken: crypto.randomBytes(24).toString('base64url'),
    },
  });

  // Initialize streak record so /focus updates don't have to upsert.
  await prisma.streak.create({ data: { userId: user.id } }).catch(() => undefined);

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  setRefreshCookie(res, refreshToken);

  res.status(201).json({ ok: true, user: publicUser(user), accessToken });
};

// =====================================================================

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw Unauthorized('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid email or password');

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  setRefreshCookie(res, refreshToken);

  res.json({ ok: true, user: publicUser(user), accessToken });
};

// =====================================================================

export const refresh = async (req: Request, res: Response) => {
  const raw = (req.cookies?.[REFRESH_COOKIE] as string) ?? (req.body?.refreshToken as string);
  if (!raw) throw Unauthorized('No refresh token provided');

  const { userId, role, newRefresh } = await rotateRefreshToken(raw, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  const accessToken = signAccessToken({ sub: userId, role });
  setRefreshCookie(res, newRefresh);

  res.json({ ok: true, accessToken });
};

// =====================================================================

export const logout = async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (raw) await revokeRefreshToken(raw);
  clearRefreshCookie(res);
  res.json({ ok: true });
};

// =====================================================================

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
      subscriptionTier: true,
      emailVerified: true,
      bio: true,
      createdAt: true,
    },
  });
  if (!user) throw NotFound('User not found');
  res.json({ ok: true, user });
};

// =====================================================================

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = googleAuthSchema.parse(req.body);

  if (!env.GOOGLE_CLIENT_ID) {
    throw BadRequest('Google OAuth not configured on this server');
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw Unauthorized('Invalid Google token');

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        emailVerified: true,
        authProvider: 'GOOGLE',
        googleId: payload.sub,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatarUrl: payload.picture,
      },
    });
    await prisma.streak.create({ data: { userId: user.id } }).catch(() => undefined);
  } else if (!user.googleId) {
    // Link Google to existing local account
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, emailVerified: true },
    });
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  setRefreshCookie(res, refreshToken);

  res.json({ ok: true, user: publicUser(user), accessToken });
};

// =====================================================================

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });

  // Never reveal whether the email exists — always respond OK.
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    // TODO: wire email transport (Resend / SES / SendGrid). For now log it.
    logger.info({ email, token }, '[password-reset] token issued — send via email');
  }

  res.json({ ok: true });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw BadRequest('Reset token invalid or expired');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  // Invalidate all existing sessions on password reset.
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  res.json({ ok: true });
};
