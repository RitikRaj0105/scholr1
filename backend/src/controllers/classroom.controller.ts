import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';

// ─── Helpers ──────────────────────────────────────

function generateJoinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

async function assertTeacherOwns(classroomId: string, userId: string) {
  const cls = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
  if (!cls) throw NotFound('Classroom not found');
  if (cls.teacherId !== userId) throw Forbidden('Not your classroom');
  return cls;
}

async function assertEnrolledOrTeacher(classroomId: string, userId: string) {
  const cls = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { teacherId: true, enrollments: { where: { userId }, select: { id: true } } },
  });
  if (!cls) throw NotFound('Classroom not found');
  if (cls.teacherId !== userId && cls.enrollments.length === 0) {
    throw Forbidden('You are not in this classroom');
  }
  return cls;
}

// ─── My classrooms (both as teacher and as student) ───────
export async function myClassrooms(req: Request, res: Response) {
  const me = req.user!.id;
  const showArchived = req.query.archived === 'true';

  const taught = await prisma.classroom.findMany({
    where: { teacherId: me, archived: showArchived ? undefined : false },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { enrollments: true, assignments: true, announcements: true } },
    },
  });

  const enrolled = await prisma.enrollment.findMany({
    where: { userId: me, classroom: { archived: showArchived ? undefined : false } },
    orderBy: { joinedAt: 'desc' },
    include: {
      classroom: {
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { enrollments: true, assignments: true, announcements: true } },
        },
      },
    },
  });

  res.json({
    taught,
    enrolled: enrolled.map((e) => ({ ...e.classroom, enrollment: { id: e.id, joinedAt: e.joinedAt } })),
  });
}

// ─── Create classroom (teacher) ──────────────────────
const createSchema = z.object({
  name: z.string().min(2).max(120),
  subject: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  grade: z.string().max(40).optional(),
  schedule: z.string().max(120).optional(),
  bannerColor: z.string().max(20).optional(),
  meetingLink: z.string().url().max(500).optional().or(z.literal('')),
});

export async function createClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const data = createSchema.parse(req.body);

  // Generate a unique join code (retry on collision)
  let code = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.classroom.findUnique({ where: { code }, select: { id: true } });
    if (!exists) break;
    code = generateJoinCode();
  }

  const cls = await prisma.classroom.create({
    data: {
      ...data,
      meetingLink: data.meetingLink || null,
      code,
      teacherId: me,
    },
  });

  res.status(201).json({ classroom: cls });
}

// ─── Single classroom detail ──────────────────────────
export async function getClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const cls = await prisma.classroom.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, headline: true } },
      _count: { select: { enrollments: true, assignments: true, materials: true, announcements: true } },
    },
  });

  const isTeacher = cls?.teacherId === me;
  res.json({ classroom: cls, isTeacher });
}

// ─── Update classroom (teacher) ───────────────────────
export async function updateClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  const data = createSchema.partial().parse(req.body);

  const cls = await prisma.classroom.update({
    where: { id },
    data: { ...data, meetingLink: data.meetingLink || null },
  });
  res.json({ classroom: cls });
}

// ─── Regenerate join code ─────────────────────────────
export async function regenerateCode(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);

  let code = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.classroom.findUnique({ where: { code }, select: { id: true } });
    if (!exists) break;
    code = generateJoinCode();
  }

  const cls = await prisma.classroom.update({ where: { id }, data: { code } });
  res.json({ classroom: cls });
}

// ─── Archive / unarchive classroom ────────────────────
export async function archiveClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  const archived = req.body.archived !== false;
  await prisma.classroom.update({ where: { id }, data: { archived } });
  res.json({ ok: true, archived });
}

// ─── Delete classroom ─────────────────────────────────
export async function deleteClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  await prisma.classroom.delete({ where: { id } });
  res.json({ ok: true });
}

// ─── Join via code (student) ──────────────────────────
const joinSchema = z.object({ code: z.string().min(4).max(10) });
export async function joinByCode(req: Request, res: Response) {
  const me = req.user!.id;
  const { code } = joinSchema.parse(req.body);
  const cls = await prisma.classroom.findUnique({ where: { code: code.toUpperCase() } });
  if (!cls) throw NotFound('Invalid join code');
  if (cls.teacherId === me) throw BadRequest("Can't join your own classroom");

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_classroomId: { userId: me, classroomId: cls.id } },
    create: { userId: me, classroomId: cls.id },
    update: {},
  });

  res.json({ classroom: cls, enrollment });
}

// ─── Leave classroom (student) ────────────────────────
export async function leaveClassroom(req: Request, res: Response) {
  const me = req.user!.id;
  const classroomId = req.params.id;
  await prisma.enrollment.deleteMany({ where: { userId: me, classroomId } });
  res.json({ ok: true });
}

// ─── Roster ───────────────────────────────────────────
export async function getRoster(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const enrollments = await prisma.enrollment.findMany({
    where: { classroomId: id },
    orderBy: { joinedAt: 'asc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, headline: true } },
    },
  });
  res.json({ students: enrollments });
}

// ─── Remove student (teacher) ─────────────────────────
export async function removeStudent(req: Request, res: Response) {
  const me = req.user!.id;
  const { id: classroomId, userId } = req.params;
  await assertTeacherOwns(classroomId, me);
  await prisma.enrollment.deleteMany({ where: { userId, classroomId } });
  res.json({ ok: true });
}

// ─── Announcements ────────────────────────────────────
const announcementSchema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(2).max(5000),
  pinned: z.boolean().optional(),
});

export async function listAnnouncements(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const announcements = await prisma.classroomAnnouncement.findMany({
    where: { classroomId: id },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  res.json({ announcements });
}

export async function createAnnouncement(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  const data = announcementSchema.parse(req.body);

  const a = await prisma.classroomAnnouncement.create({
    data: { ...data, classroomId: id, authorId: me },
  });

  // Notify enrolled students
  const enrollments = await prisma.enrollment.findMany({ where: { classroomId: id }, select: { userId: true } });
  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.userId,
        fromUserId: me,
        type: 'SYSTEM' as const,
        title: `New announcement: ${data.title}`,
        body: data.content.slice(0, 100),
        link: `/dashboard/classroom/${id}`,
      })),
    }).catch(() => null);
  }

  res.status(201).json({ announcement: a });
}

export async function updateAnnouncement(req: Request, res: Response) {
  const me = req.user!.id;
  const { id, announcementId } = req.params;
  await assertTeacherOwns(id, me);
  const data = announcementSchema.partial().parse(req.body);
  const a = await prisma.classroomAnnouncement.update({ where: { id: announcementId }, data });
  res.json({ announcement: a });
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const me = req.user!.id;
  const { id, announcementId } = req.params;
  await assertTeacherOwns(id, me);
  await prisma.classroomAnnouncement.delete({ where: { id: announcementId } });
  res.json({ ok: true });
}

// ─── Materials ────────────────────────────────────────
const materialSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  linkUrl: z.string().url().optional().or(z.literal('')),
  type: z.enum(['PDF', 'VIDEO', 'LINK', 'IMAGE', 'DOC', 'OTHER']).default('LINK'),
});

export async function listMaterials(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const materials = await prisma.classroomMaterial.findMany({
    where: { classroomId: id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  res.json({ materials });
}

export async function createMaterial(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  const data = materialSchema.parse(req.body);
  if (!data.fileUrl && !data.linkUrl) throw BadRequest('Provide a file URL or a link');

  const m = await prisma.classroomMaterial.create({
    data: {
      ...data,
      fileUrl: data.fileUrl || null,
      linkUrl: data.linkUrl || null,
      classroomId: id,
      authorId: me,
    },
  });
  res.status(201).json({ material: m });
}

export async function deleteMaterial(req: Request, res: Response) {
  const me = req.user!.id;
  const { id, materialId } = req.params;
  await assertTeacherOwns(id, me);
  await prisma.classroomMaterial.delete({ where: { id: materialId } });
  res.json({ ok: true });
}

// ─── Attendance ───────────────────────────────────────
const attendanceMarkSchema = z.object({
  date: z.string(), // ISO date
  topic: z.string().max(200).optional(),
  records: z.array(z.object({
    userId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note: z.string().max(200).optional(),
  })),
});

export async function markAttendance(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertTeacherOwns(id, me);
  const data = attendanceMarkSchema.parse(req.body);

  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  // Upsert the session
  const session = await prisma.attendanceSession.upsert({
    where: { classroomId_date: { classroomId: id, date } },
    create: { classroomId: id, teacherId: me, date, topic: data.topic },
    update: { topic: data.topic },
  });

  // Wipe existing records for this session and re-create (simplest correct behaviour)
  await prisma.attendanceRecord.deleteMany({ where: { sessionId: session.id } });
  if (data.records.length > 0) {
    await prisma.attendanceRecord.createMany({
      data: data.records.map((r) => ({
        sessionId: session.id,
        userId: r.userId,
        status: r.status,
        note: r.note,
      })),
    });
  }

  res.json({ ok: true, session });
}

export async function listAttendance(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const sessions = await prisma.attendanceSession.findMany({
    where: { classroomId: id },
    orderBy: { date: 'desc' },
    take: 60,
    include: {
      records: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
    },
  });
  res.json({ sessions });
}

// Per-student attendance summary across all sessions of this classroom
export async function attendanceStats(req: Request, res: Response) {
  const me = req.user!.id;
  const id = req.params.id;
  await assertEnrolledOrTeacher(id, me);

  const sessions = await prisma.attendanceSession.findMany({
    where: { classroomId: id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);
  const totalSessions = sessions.length;

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { userId: true, status: true },
  });

  const byUser: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
  for (const r of records) {
    if (!byUser[r.userId]) byUser[r.userId] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    byUser[r.userId].total += 1;
    if (r.status === 'PRESENT') byUser[r.userId].present += 1;
    else if (r.status === 'ABSENT') byUser[r.userId].absent += 1;
    else if (r.status === 'LATE') byUser[r.userId].late += 1;
    else byUser[r.userId].excused += 1;
  }

  res.json({ totalSessions, byUser });
}
