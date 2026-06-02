import type { Request, Response } from 'express';
import * as svc from '../services/lms.service.js';
import { z } from 'zod';
import { Forbidden } from '../utils/errors.js';
import { prisma } from '../config/prisma.js';

const timetableSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM format'),
  subject: z.string().min(1).max(80),
  roomName: z.string().max(80).optional(),
});

const manualAttendanceSchema = z.object({
  date: z.string().datetime(),
  records: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    })
  ),
});

const qrCheckinSchema = z.object({
  qrToken: z.string().min(1),
});

const cardCheckinSchema = z.object({
  studentId: z.string().min(1),
});

export const createSlot = async (req: Request, res: Response) => {
  const classroomId = req.params.classroomId;
  // Ensure user is teacher of the classroom
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== req.user!.id) {
    throw Forbidden('Only the primary teacher can manage the timetable');
  }

  const data = timetableSchema.parse(req.body);
  const slot = await svc.createTimetableSlot(classroomId, data);
  res.status(201).json({ ok: true, slot });
};

export const getSlots = async (req: Request, res: Response) => {
  const slots = await svc.getTimetableSlots(req.params.classroomId);
  res.json({ ok: true, slots });
};

export const deleteSlot = async (req: Request, res: Response) => {
  const slotId = req.params.slotId;
  const classroomId = req.params.classroomId;
  // Verify ownership
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== req.user!.id) {
    throw Forbidden('Access denied');
  }

  await svc.deleteTimetableSlot(classroomId, slotId);
  res.json({ ok: true });
};

export const getSchedule = async (req: Request, res: Response) => {
  const schedule = await svc.getWeeklySchedule(req.user!.id);
  res.json({ ok: true, schedule });
};

export const getStudentReport = async (req: Request, res: Response) => {
  const studentId = req.params.studentId || req.user!.id;
  
  // Guard access: student can view their own, parent can view if approved, teacher can view
  if (studentId !== req.user!.id && req.user!.role !== 'TEACHER' && req.user!.role !== 'PARENT') {
    throw Forbidden('Access denied to academic reports');
  }

  const report = await svc.getStudentAcademicReport(studentId);
  res.json({ ok: true, report });
};

export const getClassroomGrades = async (req: Request, res: Response) => {
  const classroomId = req.params.classroomId;
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || (classroom.teacherId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN')) {
    throw Forbidden('Only teachers can pull class grade lists');
  }

  const grades = await svc.getClassroomGrades(classroomId);
  res.json({ ok: true, grades });
};

export const markAttendance = async (req: Request, res: Response) => {
  const classroomId = req.params.classroomId;
  const data = manualAttendanceSchema.parse(req.body);
  const result = await svc.markManualAttendance(classroomId, req.user!.id, data);
  res.status(201).json({ ok: true, ...result });
};

export const generateQRCode = async (req: Request, res: Response) => {
  const classroomId = req.params.classroomId;
  const qrToken = await svc.generateAttendanceQRCode(classroomId, req.user!.id);
  res.json({ ok: true, qrToken });
};

export const checkInQR = async (req: Request, res: Response) => {
  const { qrToken } = qrCheckinSchema.parse(req.body);
  const result = await svc.checkInViaQR(req.user!.id, qrToken);
  res.status(201).json({ ok: true, ...result });
};

export const checkInCard = async (req: Request, res: Response) => {
  const classroomId = req.params.classroomId;
  const { studentId } = cardCheckinSchema.parse(req.body);
  const result = await svc.checkInStudentCard(req.user!.id, classroomId, studentId);
  res.status(201).json({ ok: true, ...result });
};
