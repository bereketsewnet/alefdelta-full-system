import { resetPasswordForUser } from './admin.service.js';

export async function handleResetPassword(req, res, next) {
  try {
    const result = await resetPasswordForUser(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

