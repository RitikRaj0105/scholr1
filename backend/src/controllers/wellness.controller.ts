import type { Request, Response } from 'express';
import * as svc from '../services/wellness.service.js';
import { z } from 'zod';

const moodInputSchema = z.object({
  mood: z.enum(['TERRIBLE', 'LOW', 'NEUTRAL', 'GOOD', 'GREAT']),
  note: z.string().max(500).optional(),
});

const journalInputSchema = z.object({
  content: z.string().min(1).max(20000),
  title: z.string().max(120).optional(),
});

const parentPermsSchema = z.object({
  parentId: z.string().min(1),
  permissions: z.object({
    allowAcademic: z.boolean(),
    allowAttendance: z.boolean(),
    allowStress: z.boolean(),
    allowAptitude: z.boolean(),
  }),
});

const threadInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  isAnonymous: z.boolean().optional(),
});

const commentInputSchema = z.object({
  content: z.string().min(1).max(5000),
  isAnonymous: z.boolean().optional(),
});

export const logMood = async (req: Request, res: Response) => {
  const data = moodInputSchema.parse(req.body);
  const log = await svc.logMood(req.user!.id, data);
  res.status(201).json({ ok: true, log });
};

export const moods = async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const logs = await svc.listMoods(req.user!.id, days);
  res.json({ ok: true, logs });
};

export const insight = async (req: Request, res: Response) => {
  const data = await svc.insight(req.user!.id);
  res.json({ ok: true, insight: data });
};

export const journals = async (req: Request, res: Response) => {
  const entries = await svc.listJournals(req.user!.id);
  res.json({ ok: true, entries });
};

export const createJournal = async (req: Request, res: Response) => {
  const data = journalInputSchema.parse(req.body);
  const entry = await svc.createJournal(req.user!.id, data);
  res.status(201).json({ ok: true, entry });
};

export const removeJournal = async (req: Request, res: Response) => {
  await svc.removeJournal(req.user!.id, req.params.id);
  res.json({ ok: true });
};

export const getDashboard = async (req: Request, res: Response) => {
  const dashboard = await svc.getDashboardData(req.user!.id);
  res.json({ ok: true, ...dashboard });
};

export const getStudyIntelligence = async (req: Request, res: Response) => {
  const data = await svc.getStudyIntelligence(req.user!.id);
  res.json({ ok: true, ...data });
};

export const getCareerGuidance = async (req: Request, res: Response) => {
  const data = await svc.getCareerGuidance(req.user!.id);
  res.json({ ok: true, ...data });
};

export const getRecoveryMode = async (req: Request, res: Response) => {
  const data = await svc.getRecoveryMode(req.user!.id);
  res.json({ ok: true, ...data });
};

export const getParentPermissions = async (req: Request, res: Response) => {
  const perms = await svc.getParentPermissions(req.user!.id);
  res.json({ ok: true, permissions: perms });
};

export const updateParentPermissions = async (req: Request, res: Response) => {
  const { parentId, permissions } = parentPermsSchema.parse(req.body);
  const perms = await svc.updateParentPermissions(req.user!.id, parentId, permissions);
  res.json({ ok: true, permissions: perms });
};

export const getChildReportForParent = async (req: Request, res: Response) => {
  const report = await svc.getChildReportForParent(req.user!.id, req.params.studentId);
  res.json({ ok: true, report });
};

export const getCommunityChannels = async (req: Request, res: Response) => {
  const channels = await svc.getCommunityChannels();
  res.json({ ok: true, channels });
};

export const getChannelThreads = async (req: Request, res: Response) => {
  const threads = await svc.getChannelThreads(req.params.channelId);
  res.json({ ok: true, threads });
};

export const createThread = async (req: Request, res: Response) => {
  const data = threadInputSchema.parse(req.body);
  const thread = await svc.createThread(req.user!.id, req.params.channelId, data);
  res.status(201).json({ ok: true, thread });
};

export const getThreadDetails = async (req: Request, res: Response) => {
  const thread = await svc.getThreadDetails(req.params.threadId);
  res.json({ ok: true, thread });
};

export const createComment = async (req: Request, res: Response) => {
  const data = commentInputSchema.parse(req.body);
  const comment = await svc.createComment(req.user!.id, req.params.threadId, data);
  res.status(201).json({ ok: true, comment });
};
