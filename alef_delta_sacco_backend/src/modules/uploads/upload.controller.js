import httpError from '../../core/utils/httpError.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';

export async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      throw httpError(400, 'No file uploaded');
    }

    const filePath = req.file.path || req.file.destination + '/' + req.file.filename;
    const publicUrl = toPublicUrl(filePath);

    res.json({
      url: publicUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    next(error);
  }
}

export async function handleMultipleUpload(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      throw httpError(400, 'No files uploaded');
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const results = files.map(file => {
      const filePath = file.path || file.destination + '/' + file.filename;
      const publicUrl = toPublicUrl(filePath);
      return {
        url: publicUrl,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };
    });

    res.json({
      files: results
    });
  } catch (error) {
    next(error);
  }
}

