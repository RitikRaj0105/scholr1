import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../config/env.js';

const googleClient = env.google.clientId ? new OAuth2Client(env.google.clientId) : null;

function authPayload(user) {
  return { sub: user.id, role: user.role, email: user.email };
}

async function issueTokens(user, meta = {}) {
  const accessToken = signAccessToken(authPayload(user));
  const refreshToken = signRefreshToken({ sub: user.id, type: 'refresh' });
  const decoded = verifyRefreshToken(refreshToken);
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
  return { accessToken, refreshToken };
}

export async function signup(input, meta) {
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (exists) throw ApiError.conflict('Email or username already in use');
  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      email: input.email,
      password,
      preferences: { create: {} },
    },
  });
  // Send email verification OTP (best-effort)
  await sendOtp(user.email, 'EMAIL_VERIFY').catch(() => {});
  const tokens = await issueTokens(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(email, password, meta) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw ApiError.unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');
  if (!user.isActive) throw ApiError.forbidden('Account disabled');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueTokens(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(token, meta) {
  if (!token) throw ApiError.unauthorized('Missing refresh token');
  let payload;
  try { payload = verifyRefreshToken(token); }
  catch { throw ApiError.unauthorized('Invalid refresh token'); }
  const session = await prisma.session.findUnique({ where: { refreshToken: token } });
  if (!session || session.revokedAt) throw ApiError.unauthorized('Session revoked');
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('User not found');
  // Rotate
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout(token) {
  if (!token) return;
  const session = await prisma.session.findUnique({ where: { refreshToken: token } });
  if (session) await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
}

export async function googleLogin(idToken, meta) {
  if (!googleClient) throw ApiError.badRequest('Google OAuth not configured');
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
  const p = ticket.getPayload();
  if (!p?.email) throw ApiError.unauthorized('Invalid Google token');
  let user = await prisma.user.findUnique({ where: { email: p.email } });
  if (!user) {
    const baseUsername = (p.email.split('@')[0] || 'user').replace(/[^a-z0-9_.-]/gi, '').slice(0, 20);
    user = await prisma.user.create({
      data: {
        email: p.email,
        name: p.name || baseUsername,
        username: `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`,
        avatar: p.picture,
        provider: 'GOOGLE',
        providerId: p.sub,
        emailVerified: true,
        preferences: { create: {} },
      },
    });
  }
  const tokens = await issueTokens(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function sendOtp(email, purpose) {
  const code = generateOtp(6);
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.otp.create({
    data: { email, codeHash, purpose, expiresAt, userId: user?.id || null },
  });
  await sendMail({
    to: email,
    subject: `Your Scholr verification code: ${code}`,
    text: `Your Scholr ${purpose} code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Scholr <b>${purpose}</b> code is <b style="font-size:20px">${code}</b>.</p><p>It expires in 10 minutes.</p>`,
  });
  return { ok: true };
}

export async function verifyOtpCode(email, code, purpose) {
  const otp = await prisma.otp.findFirst({
    where: { email, purpose, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw ApiError.badRequest('Invalid or expired code');
  if (otp.attempts >= 5) throw ApiError.tooMany('Too many attempts');
  const ok = await verifyOtp(code, otp.codeHash);
  await prisma.otp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 }, consumed: ok },
  });
  if (!ok) throw ApiError.badRequest('Invalid code');
  if (purpose === 'EMAIL_VERIFY' && otp.userId) {
    await prisma.user.update({ where: { id: otp.userId }, data: { emailVerified: true } });
  }
  return { ok: true };
}

export async function resetPassword(email, code, newPassword) {
  await verifyOtpCode(email, code, 'PASSWORD_RESET');
  const password = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.update({ where: { email }, data: { password } });
  return { user: sanitizeUser(user) };
}

export function sanitizeUser(u) {
  if (!u) return u;
  const { password, providerId, ...safe } = u;
  return safe;
}
