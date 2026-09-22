import { getFinancialReferenceAvailability } from './financial-reference.service.js';

export async function handleCheckFinancialReference(req, res, next) {
  try {
    res.json(await getFinancialReferenceAvailability(req.query.reference));
  } catch (error) {
    next(error);
  }
}

