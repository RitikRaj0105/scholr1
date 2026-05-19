import { Router } from 'express';
import * as ctl from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authRequired } from '../middleware/auth.js';
import {
  signupSchema, loginSchema, otpRequestSchema, otpVerifySchema,
  forgotPasswordSchema, resetPasswordSchema, googleAuthSchema,
} from '../validators/auth.js';

const r = Router();
r.post('/signup', authLimiter, validate(signupSchema), ctl.signup);
r.post('/login', authLimiter, validate(loginSchema), ctl.login);
r.post('/refresh', ctl.refresh);
r.post('/logout', ctl.logout);
r.get('/me', authRequired, ctl.me);
r.post('/google', authLimiter, validate(googleAuthSchema), ctl.google);
r.post('/otp/request', authLimiter, validate(otpRequestSchema), ctl.requestOtp);
r.post('/otp/verify', authLimiter, validate(otpVerifySchema), ctl.verifyOtp);
r.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctl.forgotPassword);
r.post('/reset-password', authLimiter, validate(resetPasswordSchema), ctl.resetPasswordCtl);
export default r;
