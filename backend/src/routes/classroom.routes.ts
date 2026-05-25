import { Router } from 'express';
import * as ctrl from '../controllers/classroom.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// My classrooms
router.get('/my', asyncHandler(ctrl.myClassrooms));

// Join via code
router.post('/join', asyncHandler(ctrl.joinByCode));

// CRUD
router.post('/', asyncHandler(ctrl.createClassroom));
router.get('/:id', asyncHandler(ctrl.getClassroom));
router.patch('/:id', asyncHandler(ctrl.updateClassroom));
router.delete('/:id', asyncHandler(ctrl.deleteClassroom));
router.post('/:id/archive', asyncHandler(ctrl.archiveClassroom));
router.post('/:id/regenerate-code', asyncHandler(ctrl.regenerateCode));

// Roster
router.get('/:id/roster', asyncHandler(ctrl.getRoster));
router.delete('/:id/students/:userId', asyncHandler(ctrl.removeStudent));
router.post('/:id/leave', asyncHandler(ctrl.leaveClassroom));

// Announcements
router.get('/:id/announcements', asyncHandler(ctrl.listAnnouncements));
router.post('/:id/announcements', asyncHandler(ctrl.createAnnouncement));
router.patch('/:id/announcements/:announcementId', asyncHandler(ctrl.updateAnnouncement));
router.delete('/:id/announcements/:announcementId', asyncHandler(ctrl.deleteAnnouncement));

// Materials
router.get('/:id/materials', asyncHandler(ctrl.listMaterials));
router.post('/:id/materials', asyncHandler(ctrl.createMaterial));
router.delete('/:id/materials/:materialId', asyncHandler(ctrl.deleteMaterial));

// Attendance
router.post('/:id/attendance', asyncHandler(ctrl.markAttendance));
router.get('/:id/attendance', asyncHandler(ctrl.listAttendance));
router.get('/:id/attendance/stats', asyncHandler(ctrl.attendanceStats));

export default router;
