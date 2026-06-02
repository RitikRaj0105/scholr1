import { Router } from 'express';
import * as ctrl from '../controllers/lms.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

// Timetable schedule
router.get('/schedule', asyncHandler(ctrl.getSchedule));
router.post('/classrooms/:classroomId/timetable', asyncHandler(ctrl.createSlot));
router.get('/classrooms/:classroomId/timetable', asyncHandler(ctrl.getSlots));
router.delete('/classrooms/:classroomId/timetable/:slotId', asyncHandler(ctrl.deleteSlot));

// Grades and report cards
router.get('/students/report', asyncHandler(ctrl.getStudentReport));
router.get('/students/:studentId/report', asyncHandler(ctrl.getStudentReport));
router.get('/classrooms/:classroomId/grades', asyncHandler(ctrl.getClassroomGrades));

// Attendance
router.post('/classrooms/:classroomId/attendance/manual', asyncHandler(ctrl.markAttendance));
router.get('/classrooms/:classroomId/attendance/qr-code', asyncHandler(ctrl.generateQRCode));
router.post('/attendance/qr-checkin', asyncHandler(ctrl.checkInQR));
router.post('/classrooms/:classroomId/attendance/card-checkin', asyncHandler(ctrl.checkInCard));

export default router;
