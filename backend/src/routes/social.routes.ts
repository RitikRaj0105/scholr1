import { Router } from 'express';
import * as ctrl from '../controllers/social.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();
router.use(requireAuth);

// ─── Image uploads ────────────────────────
router.post('/upload/avatar', uploadMiddleware.single('image'), asyncHandler(ctrl.uploadAvatar));
router.post('/upload/post-image', uploadMiddleware.single('image'), asyncHandler(ctrl.uploadPostImage));

// ─── Feed ─────────────────────────────────
router.get('/feed', asyncHandler(ctrl.getFeed));

// ─── Posts ────────────────────────────────
router.post('/posts', asyncHandler(ctrl.createPost));
router.get('/posts/:id', asyncHandler(ctrl.getPost));
router.delete('/posts/:id', asyncHandler(ctrl.deletePost));

// ─── Likes ────────────────────────────────
router.post('/posts/:id/like', asyncHandler(ctrl.toggleLike));

// ─── Comments ─────────────────────────────
router.get('/posts/:id/comments', asyncHandler(ctrl.listComments));
router.post('/posts/:id/comments', asyncHandler(ctrl.addComment));
router.delete('/comments/:commentId', asyncHandler(ctrl.deleteComment));

// ─── Shares ───────────────────────────────
router.post('/posts/:id/share', asyncHandler(ctrl.sharePost));

// ─── Reports (any user can report a post) ───────
router.post('/posts/:id/report', asyncHandler(ctrl.reportPost));

// ─── Profile ──────────────────────────────
router.patch('/me/profile', asyncHandler(ctrl.updateMyProfile));
router.get('/users/:userId', asyncHandler(ctrl.getUserProfile));
router.get('/users/:userId/posts', asyncHandler(ctrl.getUserPosts));

// ─── Follow / Unfollow ────────────────────
router.post('/follow/:userId', asyncHandler(ctrl.follow));
router.delete('/follow/:userId', asyncHandler(ctrl.unfollow));

// ─── Search ───────────────────────────────
router.get('/search', asyncHandler(ctrl.searchUsers));

// ─── Block / Unblock (safety) ────────────
router.post('/block/:userId', asyncHandler(ctrl.blockUser));
router.delete('/block/:userId', asyncHandler(ctrl.unblockUser));

export default router;
