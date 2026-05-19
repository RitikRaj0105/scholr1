import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

function getTransport() {
  if (!env.smtp.host) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();
  if (!t) {
    logger.info({ to, subject }, '[mailer] SMTP not configured — logging email');
    logger.info(text || html);
    return { mocked: true };
  }
  return t.sendMail({ from: env.smtp.from, to, subject, html, text });
}
