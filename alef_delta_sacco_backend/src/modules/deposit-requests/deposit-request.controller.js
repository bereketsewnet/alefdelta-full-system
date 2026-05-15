import httpError from '../../core/utils/httpError.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import {
  createDepositRequest,
  listDepositRequestsByMember,
  listAllDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
} from './deposit-request.service.js';

export async function handleCreateDepositRequest(req, res, next) {
  try {
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    
    const request = await createDepositRequest(req.user.memberId, {
      account_id: req.body.account_id,
      amount: req.body.amount,
      reference_number: req.body.reference_number,
      receipt_photo_url: receiptPhotoUrl,
      description: req.body.description,
    });

    res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleGetDepositRequests(req, res, next) {
  try {
    // If user is staff/admin, return all requests; otherwise return member's own requests
    if (req.user.subjectType === 'MEMBER') {
      const requests = await listDepositRequestsByMember(req.user.memberId);
      res.json({ data: requests });
    } else {
      // Staff/admin can see all requests with optional filters
      const requests = await listAllDepositRequests({
        status: req.query.status,
        member_id: req.query.member_id,
      });
      res.json({ data: requests });
    }
  } catch (error) {
    next(error);
  }
}

export async function handleApproveDepositRequest(req, res, next) {
  try {
    const request = await approveDepositRequest(
      req.params.requestId,
      req.user.userId
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectDepositRequest(req, res, next) {
  try {
    const request = await rejectDepositRequest(
      req.params.requestId,
      req.user.userId,
      req.body.reason
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

