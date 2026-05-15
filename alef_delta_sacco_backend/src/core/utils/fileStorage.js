import path from 'node:path';
import fs from 'node:fs/promises';
import config from '../config.js';

function sanitizeSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9-_]/g, '');
}

export async function ensureUploadPath(entity, entityId) {
  const safeEntity = sanitizeSegment(entity);
  const safeId = sanitizeSegment(entityId);
  const dir = path.join(config.uploads.root, safeEntity, safeId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function toPublicUrl(filePath) {
  const relative = path.relative(config.uploads.root, filePath);
  return `/uploads/${relative.replace(/\\\\/g, '/').replace(/\\/g, '/')}`;
}

export async function removeFile(targetPath) {
  if (!targetPath) return;
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

