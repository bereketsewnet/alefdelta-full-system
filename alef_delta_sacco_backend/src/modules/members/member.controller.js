import httpError from '../../core/utils/httpError.js';
import {
  createMemberSchema,
  updateMemberSchema,
  beneficiarySchema,
  resetMemberPasswordSchema
} from './member.validators.js';
import {
  getMembers,
  getMemberById,
  createNewMember,
  updateExistingMember,
  saveMemberUploads,
  addMemberBeneficiary,
  removeMember,
  activateMember,
  suspendMember,
  resetMemberPasswordById
} from './member.service.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListMembers(req, res, next) {
  try {
    const result = await getMembers({
      search: req.query.search,
      status: req.query.status,
      limit: req.query.limit,
      offset: req.query.offset
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMember(req, res, next) {
  try {
    const member = await getMemberById(req.params.id);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateMember(req, res, next) {
  try {
    const payload = validate(createMemberSchema, req.body);
    const member = await createNewMember(payload);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateMember(req, res, next) {
  try {
    const payload = validate(updateMemberSchema, req.body);
    const member = await updateExistingMember(req.params.id, payload);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleUpload(req, res, next) {
  try {
    console.log('Upload request - Member ID:', req.params.id);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`  ${key}:`, req.files[key].map(f => ({ 
          fieldname: f.fieldname, 
          originalname: f.originalname, 
          filename: f.filename,
          path: f.path,
          mimetype: f.mimetype 
        })));
      });
    }
    const member = await saveMemberUploads(req.params.id, req.files || {});
    res.json(member);
  } catch (error) {
    console.error('Upload handler error:', error);
    next(error);
  }
}

export async function handleAddBeneficiary(req, res, next) {
  try {
    const payload = validate(beneficiarySchema, req.body);
    const beneficiaries = await addMemberBeneficiary(req.params.id, payload, req.files || {});
    res.status(201).json({ data: beneficiaries });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteMember(req, res, next) {
  try {
    const result = await removeMember(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleActivateMember(req, res, next) {
  try {
    const member = await activateMember(req.params.id, req.user);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleSuspendMember(req, res, next) {
  try {
    const member = await suspendMember(req.params.id, req.user, req.body.reason);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleResetMemberPassword(req, res, next) {
  try {
    if (!req.user.isAdmin) {
      throw httpError(403, 'Only admins can reset member passwords');
    }
    const payload = validate(resetMemberPasswordSchema, req.body);
    const result = await resetMemberPasswordById(req.params.id, payload.new_password, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleReactivateMember(req, res, next) {
  try {
    const { reactivateMember } = await import('./member-lifecycle-processor.js');
    const notes = req.body.notes || '';
    const result = await reactivateMember(req.params.id, notes, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetInactiveReport(req, res, next) {
  try {
    const { getInactiveMembersReport } = await import('./member-lifecycle-processor.js');
    const report = await getInactiveMembersReport();
    res.json({ data: report });
  } catch (error) {
    next(error);
  }
}

