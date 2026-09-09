import multer from 'multer';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — keeps a handful of photos well within Neon's free 0.5GB.

export class UploadError extends Error {}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new UploadError('Only JPEG, PNG, WEBP or GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});
