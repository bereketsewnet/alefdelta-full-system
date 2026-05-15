import multer from 'multer';
import path from 'node:path';
import config from '../config.js';
import { ensureUploadPath } from '../utils/fileStorage.js';

function resolveContext(req) {
  return {
    entity: req.uploadEntity || 'misc',
    entityId: req.uploadEntityId || 'general'
  };
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const { entity, entityId } = resolveContext(req);
    ensureUploadPath(entity, entityId)
      .then((dir) => cb(null, dir))
      .catch((err) => cb(err));
  },
  filename(req, file, cb) {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  }
});

function fileFilter(_req, file, cb) {
  const mimeType = file.mimetype.toLowerCase();
  
  // Normalize image/jpg to image/jpeg for comparison
  const normalizedMime = mimeType.replace('image/jpg', 'image/jpeg');
  
  // Also check file extension as fallback
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
  
  // Check if MIME type is allowed (after normalization) OR extension is allowed
  const isMimeAllowed = config.uploads.allowedMimeTypes.some(allowed => {
    const normalizedAllowed = allowed.toLowerCase().replace('image/jpg', 'image/jpeg');
    return normalizedMime === normalizedAllowed;
  });
  
  if (!isMimeAllowed && !allowedExts.includes(ext)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${config.uploads.allowedMimeTypes.join(', ')}`));
  }
  return cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxFileSize },
  fileFilter
});

export function attachUploadContext(entity, resolver = (req) => req.params.id || 'general') {
  return (req, _res, next) => {
    req.uploadEntity = entity;
    req.uploadEntityId = resolver(req);
    next();
  };
}

