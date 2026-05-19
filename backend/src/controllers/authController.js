import { asyncHandler } from '../utils/asyncHandler.js';
import * as authSvc from '../services/authService.js';
import { env } from '../config/env.js';

const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  domain: env.isProd ? env.cookieDomain : undefined,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function meta(req) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export const signup = asyncHandler(async (req, res) => {
  const out = await authSvc.signup(req.body, meta(req));
  res.cookie('refreshToken', out.refreshToken, cookieOpts);
  res.status(201).json({ user: out.user, accessToken: out.accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const out = await authSvc.login(req.body.email, req.body.password, meta(req));
  res.cookie('refreshToken', out.refreshToken, cookieOpts);
  res.json({ user: out.user, accessToken: out.accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const out = await authSvc.refresh(token, meta(req));
  res.cookie('refreshToken', out.refreshToken, cookieOpts);
  res.json({ user: out.user, accessToken: out.accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authSvc.logout(req.cookies?.refreshToken);
  res.clearCookie('refreshToken', { ...cookieOpts, maxAge: 0 });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const google = asyncHandler(async (req, res) => {
  const out = await authSvc.googleLogin(req.body.idToken, meta(req));
  res.cookie('refreshToken', out.refreshToken, cookieOpts);
  res.json({ user: out.user, accessToken: out.accessToken });
});

export const requestOtp = asyncHandler(async (req, res) => {
  await authSvc.sendOtp(req.body.email, req.body.purpose);
  res.json({ ok: true });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  await authSvc.verifyOtpCode(req.body.email, req.body.code, req.body.purpose);
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authSvc.sendOtp(req.body.email, 'PASSWORD_RESET');
  res.json({ ok: true });
});

export const resetPasswordCtl = asyncHandler(async (req, res) => {
  const out = await authSvc.resetPassword(req.body.email, req.body.code, req.body.password);
  res.json(out);
});
