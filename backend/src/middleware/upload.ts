import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { BadRequest } from '../utils/errors.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOAD_DIR, 'avatars');
const POSTS_DIR = path.join(UPLOAD_DIR, 'posts');

// Ensure directories exist at startup
async function ensureDirs() {
  for (const d of [UPLOAD_DIR, AVATARS_DIR, POSTS_DIR]) {
    await fs.mkdir(d, { recursive: true });
  }
}
ensureDirs().catch(console.error);

// Allow only image MIME types
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// In-memory storage — Sharp will process buffer then write to disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

/** Generate a random unique filename */
function randomFilename(ext: string): string {
  return `${randomBytes(16).toString('hex')}.${ext}`;
}

/**
 * Process avatar: resize to 256x256, save as webp.
 * Returns the public URL path (relative).
 */
export async function saveAvatar(file: Express.Multer.File): Promise<string> {
  const filename = randomFilename('webp');
  const outPath = path.join(AVATARS_DIR, filename);
  await sharp(file.buffer)
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outPath);
  return `/uploads/avatars/${filename}`;
}

/**
 * Process post image: max 1200px width, save as webp.
 * Returns the public URL path (relative).
 */
export async function savePostImage(file: Express.Multer.File): Promise<string> {
  const filename = randomFilename('webp');
  const outPath = path.join(POSTS_DIR, filename);
  await sharp(file.buffer)
    .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);
  return `/uploads/posts/${filename}`;
}

/**
 * Delete an uploaded file from disk by its public URL path.
 * Safe — only deletes files within UPLOAD_DIR.
 */
export async function deleteUploadedFile(publicPath: string): Promise<void> {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const relPath = publicPath.replace(/^\/uploads\//, '');
  const fullPath = path.resolve(UPLOAD_DIR, relPath);
  // Safety check: ensure the resolved path is still within UPLOAD_DIR
  if (!fullPath.startsWith(UPLOAD_DIR)) return;
  try {
    await fs.unlink(fullPath);
  } catch {
    // File might not exist, ignore
  }
}

export const UPLOAD_PATH = UPLOAD_DIR;

const BANNERS_DIR = path.join(UPLOAD_DIR, 'banners');
const RESUMES_DIR = path.join(UPLOAD_DIR, 'resumes');

// Ensure new dirs exist
fs.mkdir(BANNERS_DIR, { recursive: true }).catch(console.error);
fs.mkdir(RESUMES_DIR, { recursive: true }).catch(console.error);

export async function saveBannerImage(file: Express.Multer.File): Promise<string> {
  const filename = randomFilename('webp');
  const outPath = path.join(BANNERS_DIR, filename);
  await sharp(file.buffer)
    .resize(1200, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outPath);
  return `/uploads/banners/${filename}`;
}

export async function saveResume(file: Express.Multer.File): Promise<string> {
  // Resume is PDF — store as-is (no processing)
  const filename = randomFilename('pdf');
  const outPath = path.join(RESUMES_DIR, filename);
  await fs.writeFile(outPath, file.buffer);
  return `/uploads/resumes/${filename}`;
}

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for PDF
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed for resumes'));
      return;
    }
    cb(null, true);
  },
});
