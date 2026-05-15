import httpError from '../../core/utils/httpError.js';
import {
  createLoanRequest,
  listLoanRequestsByMember,
  listAllLoanRequests,
  approveLoanRequest,
  rejectLoanRequest,
} from './loan-request.service.js';

export async function handleCreateLoanRequest(req, res, next) {
  try {
    // Can be called by authenticated member or public (with phone)
    const memberId = req.user?.memberId || null;
    // Prioritize phone from request body (allows editing), fallback to user phone, then null
    const phone = req.body.phone || (req.user?.phone_primary || req.user?.phone) || null;
    
    if (!memberId && !phone) {
      throw httpError(400, 'Phone number is required for non-authenticated users');
    }
    
    // For authenticated users, phone is still required (from body or profile)
    if (memberId && !phone) {
      throw httpError(400, 'Phone number is required');
    }

    const request = await createLoanRequest(memberId, phone, {
      loan_purpose: req.body.loan_purpose,
      other_purpose: req.body.other_purpose,
      requested_amount: req.body.requested_amount,
    });

    res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLoanRequests(req, res, next) {
  try {
    // If user is staff/admin, return all requests; otherwise return member's own requests
    if (req.user.subjectType === 'MEMBER') {
      const requests = await listLoanRequestsByMember(req.user.memberId);
      res.json({ data: requests });
    } else {
      // Staff/admin can see all requests with optional filters
      const requests = await listAllLoanRequests({
        status: req.query.status,
        member_id: req.query.member_id,
      });
      res.json({ data: requests });
    }
  } catch (error) {
    next(error);
  }
}

export async function handleApproveLoanRequest(req, res, next) {
  try {
    const request = await approveLoanRequest(
      req.params.requestId,
      req.user.userId,
      req.body.notes
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectLoanRequest(req, res, next) {
  try {
    const request = await rejectLoanRequest(
      req.params.requestId,
      req.user.userId,
      req.body.reason,
      req.body.notes
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

