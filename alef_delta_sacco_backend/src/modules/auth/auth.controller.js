import httpError from '../../core/utils/httpError.js';
import {
  login,
  refreshToken,
  requestOtp,
  verifyOtp,
  changePassword,
  getCurrentUser
} from './auth.service.js';
import {
  loginSchema,
  refreshSchema,
  otpRequestSchema,
  otpVerifySchema,
  changePasswordSchema
} from './auth.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleLogin(req, res, next) {
  try {
    console.log('Login attempt:', { ...req.body, password: '***' });
    const payload = validate(loginSchema, req.body);
    const result = await login(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRefresh(req, res, next) {
  try {
    const payload = validate(refreshSchema, req.body);
    const result = await refreshToken(payload.refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRequestOtp(req, res, next) {
  try {
    const payload = validate(otpRequestSchema, req.body);
    const result = await requestOtp(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyOtp(req, res, next) {
  try {
    const payload = validate(otpVerifySchema, req.body);
    const result = await verifyOtp(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleChangePassword(req, res, next) {
  try {
    const payload = validate(changePasswordSchema, req.body);
    const subjectType = req.user?.subjectType || 'STAFF';
    const subjectId = subjectType === 'STAFF' ? req.user.userId : req.user.memberId;
    const result = await changePassword({
      subjectType,
      subjectId,
      currentPassword: payload.current_password,
      newPassword: payload.new_password
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleMe(req, res, next) {
  try {
    const subjectType = req.user?.subjectType || 'STAFF';
    // req.user is set by resolveSubject() which returns userId (for STAFF) or memberId (for MEMBER)
    const userId = req.user.userId || req.user.memberId;
    if (!userId) {
      throw httpError(401, 'Invalid user context');
    }
    const result = await getCurrentUser({
      userId,
      role: req.user.role,
      subjectType
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
