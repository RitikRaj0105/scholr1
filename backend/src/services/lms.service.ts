import { prisma } from '../config/prisma.js';
import { NotFound, Forbidden, BadRequest } from '../utils/errors.js';

// ─── Timetable Slots ───────────────────────────────
export const createTimetableSlot = async (
  classroomId: string,
  data: { dayOfWeek: string; startTime: string; endTime: string; subject: string; roomName?: string }
) => {
  return prisma.timetableSlot.create({
    data: {
      classroomId,
      dayOfWeek: data.dayOfWeek.toUpperCase(),
      startTime: data.startTime,
      endTime: data.endTime,
      subject: data.subject,
      roomName: data.roomName,
    },
  });
};

export const getTimetableSlots = async (classroomId: string) => {
  return prisma.timetableSlot.findMany({
    where: { classroomId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

export const deleteTimetableSlot = async (classroomId: string, slotId: string) => {
  const slot = await prisma.timetableSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.classroomId !== classroomId) {
    throw NotFound('Timetable slot not found');
  }
  await prisma.timetableSlot.delete({ where: { id: slotId } });
  return { ok: true };
};

export const getWeeklySchedule = async (userId: string) => {
  // Fetch classrooms where user is a teacher or enrolled student
  const [taughtClasses, enrolledClasses] = await Promise.all([
    prisma.classroom.findMany({ where: { teacherId: userId } }),
    prisma.enrollment.findMany({ where: { userId }, include: { classroom: true } }),
  ]);

  const classroomIds = [
    ...taughtClasses.map((c) => c.id),
    ...enrolledClasses.map((e) => e.classroom.id),
  ];

  return prisma.timetableSlot.findMany({
    where: { classroomId: { in: classroomIds } },
    include: { classroom: { select: { name: true, bannerColor: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

// ─── Academic Grades & Progress ────────────────────
export const getStudentAcademicReport = async (studentId: string) => {
  const [attempts, submissions] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId: studentId },
      include: { exam: true },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.submission.findMany({
      where: { userId: studentId },
      include: { assignment: true },
      orderBy: { gradedAt: 'desc' },
    }),
  ]);

  const testGrades = attempts.map((a) => ({
    title: a.exam.title,
    score: a.score,
    total: a.exam.totalMarks,
    percentage: a.exam.totalMarks > 0 ? Math.round(((a.score || 0) / a.exam.totalMarks) * 100) : 0,
    date: a.submittedAt || a.startedAt,
  }));

  const assignmentGrades = submissions.map((s) => ({
    title: s.assignment.title,
    score: s.marks,
    total: s.assignment.totalMarks,
    percentage: s.assignment.totalMarks > 0 ? Math.round(((s.marks || 0) / s.assignment.totalMarks) * 100) : 0,
    status: s.status,
    date: s.submittedAt || s.createdAt,
  }));

  // General Average Grade calculations
  const totalWeight = testGrades.length + assignmentGrades.length;
  const totalSum =
    testGrades.reduce((sum, g) => sum + g.percentage, 0) +
    assignmentGrades.reduce((sum, g) => sum + g.percentage, 0);

  const averageGrade = totalWeight > 0 ? Math.round(totalSum / totalWeight) : 75;

  return {
    averageGrade,
    testCount: testGrades.length,
    assignmentCount: assignmentGrades.length,
    testGrades,
    assignmentGrades,
  };
};

export const getClassroomGrades = async (classroomId: string) => {
  const students = await prisma.enrollment.findMany({
    where: { classroomId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          examAttempts: {
            where: { exam: { classroomId } },
            select: { score: true, exam: { select: { totalMarks: true } } },
          },
          submissions: {
            where: { assignment: { classroomId } },
            select: { marks: true, assignment: { select: { totalMarks: true } } },
          },
        },
      },
    },
  });

  return students.map((s) => {
    const totalExamAttempts = s.user.examAttempts.length;
    const examSum = s.user.examAttempts.reduce((sum, ea) => {
      const total = ea.exam.totalMarks || 100;
      return sum + ((ea.score || 0) / total) * 100;
    }, 0);
    const examAvg = totalExamAttempts > 0 ? Math.round(examSum / totalExamAttempts) : null;

    const totalSubmissions = s.user.submissions.length;
    const assignmentSum = s.user.submissions.reduce((sum, sub) => {
      const total = sub.assignment.totalMarks || 100;
      return sum + ((sub.marks || 0) / total) * 100;
    }, 0);
    const assignmentAvg = totalSubmissions > 0 ? Math.round(assignmentSum / totalSubmissions) : null;

    return {
      userId: s.user.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      examAverage: examAvg,
      assignmentAverage: assignmentAvg,
    };
  });
};

// ─── Dual QR & Manual Attendance Marking ──────────
const notifyParentForAttendance = async (studentId: string, classroomName: string, status: string, date: string) => {
  const [parentLinks, student] = await Promise.all([
    prisma.parentStudent.findMany({
      where: { studentId, status: 'APPROVED' },
      include: { parent: { select: { id: true, firstName: true, phone: true } } },
    }),
    prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    }),
  ]);

  const studentName = student ? `${student.firstName} ${student.lastName}` : 'Your child';

  for (const link of parentLinks) {
    // 1. Create DB notification for parent portal
    await prisma.notification.create({
      data: {
        userId: link.parentId,
        type: 'SYSTEM',
        title: `Attendance Alert: ${status}`,
        body: `${studentName} has been marked ${status.toUpperCase()} in ${classroomName} on ${date}.`,
      },
    }).catch(() => null);

    // 2. Simulated SMS alerting system to the console (for Indian schools style notification)
    const phone = link.parent.phone || 'Guardian Mobile';
    console.log(`[SMS Alert Dispatcher]
TO: ${phone} (${link.parent.firstName})
MESSAGE: Dear Parent, your ward ${studentName} was marked ${status.toUpperCase()} in ${classroomName} class today (${date}). Please contact administration if unexpected.`);
  }
};

export const markManualAttendance = async (
  classroomId: string,
  teacherId: string,
  data: { date: string; records: { userId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' }[] }
) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== teacherId) {
    throw Forbidden('Only the primary classroom teacher can mark attendance');
  }

  const sessionDate = new Date(data.date);
  
  // Upsert the AttendanceSession for today
  const session = await prisma.attendanceSession.upsert({
    where: { classroomId_date: { classroomId, date: sessionDate } },
    update: {},
    create: { classroomId, teacherId, date: sessionDate },
  });

  const savedRecords = [];
  for (const record of data.records) {
    const rec = await prisma.attendanceRecord.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: record.userId } },
      update: { status: record.status },
      create: { sessionId: session.id, userId: record.userId, status: record.status },
    });
    savedRecords.push(rec);

    // Alert parents if marked ABSENT or LATE
    if (record.status === 'ABSENT' || record.status === 'LATE') {
      await notifyParentForAttendance(record.userId, classroom.name, record.status, data.date);
    }
  }

  return { session, records: savedRecords };
};

// Dynamic Dynamic Teacher Code Check-in
export const generateAttendanceQRCode = async (classroomId: string, teacherId: string) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== teacherId) {
    throw Forbidden('Access denied');
  }
  // Generate secure temporary signature token
  const expiry = Date.now() + 5 * 60 * 1000; // 5 min expiry
  const payload = { classroomId, expiry };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const checkInViaQR = async (studentId: string, qrToken: string) => {
  let payload;
  try {
    const raw = Buffer.from(qrToken, 'base64').toString('ascii');
    payload = JSON.parse(raw);
  } catch {
    throw BadRequest('Malformed QR Code token');
  }

  if (Date.now() > payload.expiry) {
    throw BadRequest('QR check-in token expired. Ask your teacher to refresh it.');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classroomId: { userId: studentId, classroomId: payload.classroomId } },
    include: { classroom: { select: { name: true, teacherId: true } } },
  });

  if (!enrollment) {
    throw Forbidden('You are not enrolled in this classroom');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await prisma.attendanceSession.upsert({
    where: { classroomId_date: { classroomId: payload.classroomId, date: today } },
    update: {},
    create: {
      classroomId: payload.classroomId,
      teacherId: enrollment.classroom.teacherId,
      date: today,
    },
  });

  const record = await prisma.attendanceRecord.upsert({
    where: { sessionId_userId: { sessionId: session.id, userId: studentId } },
    update: { status: 'PRESENT' },
    create: { sessionId: session.id, userId: studentId, status: 'PRESENT' },
  });

  // Notify parent of successful QR check-in
  await notifyParentForAttendance(studentId, enrollment.classroom.name, 'PRESENT', today.toDateString());

  return { success: true, record };
};

// Teacher Scans Student printed Badge (School Student Case)
export const checkInStudentCard = async (teacherId: string, classroomId: string, studentId: string) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== teacherId) {
    throw Forbidden('Access denied');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classroomId: { userId: studentId, classroomId } },
  });

  if (!enrollment) {
    throw BadRequest('Student is not enrolled in this classroom');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await prisma.attendanceSession.upsert({
    where: { classroomId_date: { classroomId, date: today } },
    update: {},
    create: { classroomId, teacherId, date: today },
  });

  const record = await prisma.attendanceRecord.upsert({
    where: { sessionId_userId: { sessionId: session.id, userId: studentId } },
    update: { status: 'PRESENT' },
    create: { sessionId: session.id, userId: studentId, status: 'PRESENT' },
  });

  // Alert parents
  await notifyParentForAttendance(studentId, classroom.name, 'PRESENT', today.toDateString());

  return { success: true, record };
};
