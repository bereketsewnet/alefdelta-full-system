import crypto from 'node:crypto';
import { query, execute } from '../db.js';
import { removeFile } from '../utils/fileStorage.js';

function uploadedFiles(req) {
  const files = [];
  if (req.file?.path) files.push(req.file.path);
  for (const group of Object.values(req.files || {})) {
    for (const file of Array.isArray(group) ? group : [group]) {
      if (file?.path) files.push(file.path);
    }
  }
  return files;
}

function buildRequestHash(key, userId, endpoint, body) {
  return crypto
    .createHash('sha256')
    .update(`${key}:${userId ?? 'ANON'}:${endpoint}:${JSON.stringify(body || {})}`)
    .digest('hex');
}

export function idempotencyMiddleware(endpoint) {
  return async (req, res, next) => {
    const key = req.header('Idempotency-Key');
    if (!key) {
      return res.status(400).json({ message: 'Idempotency-Key header is required' });
    }
    const userId = req.user?.userId || null;
    const requestHash = buildRequestHash(key, userId, endpoint, req.body);
    const existing = await query(
      'SELECT status_code, response_json, request_hash FROM idempotency_keys WHERE idempotency_key = ?',
      [key]
    );

    if (existing.length) {
      const record = existing[0];
      if (record.request_hash !== requestHash) {
        await Promise.allSettled(uploadedFiles(req).map((filePath) => removeFile(filePath)));
        return res.status(400).json({ message: 'Idempotency key already used with a different payload' });
      }
      const cached = JSON.parse(record.response_json);
      // Multipart parsing happens before this middleware so remove only the
      // newly uploaded retry files; the original posted evidence remains.
      await Promise.allSettled(uploadedFiles(req).map((filePath) => removeFile(filePath)));
      return res.status(record.status_code).json(cached);
    }

    req.idempotency = {
      key,
      userId,
      endpoint,
      requestHash,
      async save(status, payload) {
        await execute(
          `INSERT INTO idempotency_keys
          (idempotency_key, user_id, endpoint, request_hash, response_json, status_code, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [key, userId, endpoint, requestHash, JSON.stringify(payload), status]
        );
      }
    };

    return next();
  };
}
