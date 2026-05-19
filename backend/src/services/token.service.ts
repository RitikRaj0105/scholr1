import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { Unauthorized } from '../utils/errors.js';

export interface JwtPayload {
  sub: string; // user id
  role: string;
}

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw Unauthorized('Invalid or expired access token');
  }
};

/**
 * Refresh tokens are opaque, random strings stored hashed in DB.
 * Verification = look up the hash, check expiry & revocation.
 * This gives us the ability to revoke individual sessions server-side.
 */
const REFRESH_BYTES = 48;
const REFRESH_DAYS = 30;

const hashRefresh = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const issueRefreshToken = async (
  userId: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<string> => {
  const raw = crypto.randomBytes(REFRESH_BYTES).toString('base64url');
  const hash = hashRefresh(raw);

  await prisma.session.create({
    data: {
      userId,
      refreshToken: hash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return raw;
};

export const rotateRefreshToken = async (
  rawToken: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<{ userId: string; role: string; newRefresh: string }> => {
  const hash = hashRefresh(rawToken);
  const session = await prisma.session.findUnique({
    where: { refreshToken: hash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw Unauthorized('Refresh token invalid or expired');
  }

  // Rotate: revoke old, issue new — defends against token replay.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const newRefresh = await issueRefreshToken(session.userId, meta);

  return {
    userId: session.userId,
    role: session.user.role,
    newRefresh,
  };
};

export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  const hash = hashRefresh(rawToken);
  await prisma.session.updateMany({
    where: { refreshToken: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
