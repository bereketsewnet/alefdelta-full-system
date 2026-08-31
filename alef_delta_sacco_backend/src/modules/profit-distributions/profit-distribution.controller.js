import * as service from './profit-distribution.service.js';

export async function handleMasterSummary(req, res, next) { try { res.json({ data: await service.getMasterSummary() }); } catch (error) { next(error); } }
export async function handleMasterLedger(req, res, next) { try { res.json(await service.listMasterLedger(req.query)); } catch (error) { next(error); } }
export async function handleManualAdjustment(req, res, next) { try { res.status(201).json({ data: await service.createManualAdjustment(req.body, req.user) }); } catch (error) { next(error); } }
export async function handleCurrentPolicy(req, res, next) { try { res.json({ data: await service.getCurrentPolicy() }); } catch (error) { next(error); } }
export async function handlePolicies(req, res, next) { try { res.json({ data: await service.listPolicies() }); } catch (error) { next(error); } }
export async function handleCreatePolicy(req, res, next) { try { res.status(201).json({ data: await service.createPolicy(req.body, req.user) }); } catch (error) { next(error); } }
export async function handleActivatePolicy(req, res, next) { try { res.json({ data: await service.activatePolicy(req.params.id, req.user) }); } catch (error) { next(error); } }
export async function handleGenerate(req, res, next) { try { res.status(201).json({ data: await service.generateDistribution(req.body, req.user) }); } catch (error) { next(error); } }
export async function handleList(req, res, next) { try { res.json({ data: await service.listDistributions(req.query) }); } catch (error) { next(error); } }
export async function handleGet(req, res, next) { try { res.json({ data: await service.getDistributionById(req.params.id) }); } catch (error) { next(error); } }
export async function handleOverrideShares(req, res, next) { try { res.json({ data: await service.overrideMemberShares(req.params.id, req.params.memberId, req.body, req.user) }); } catch (error) { next(error); } }
export async function handleSubmit(req, res, next) { try { res.json({ data: await service.submitDistribution(req.params.id, req.user) }); } catch (error) { next(error); } }
export async function handleVote(req, res, next) { try { res.json({ data: await service.castBoardVote(req.params.id, req.body, req.user) }); } catch (error) { next(error); } }
export async function handleResolve(req, res, next) { try { res.json({ data: await service.resolveBoardRejection(req.params.id, req.params.voteId, req.body, req.user) }); } catch (error) { next(error); } }
export async function handleVoid(req, res, next) { try { res.json({ data: await service.voidDistribution(req.params.id, req.body, req.user) }); } catch (error) { next(error); } }
export async function handlePayout(req, res, next) { try { res.json({ data: await service.payoutDistribution(req.params.id, req.body, req.user) }); } catch (error) { next(error); } }
export async function handlePayoutValidation(req, res, next) { try { res.json({ data: await service.validatePayoutReadiness(req.params.id) }); } catch (error) { next(error); } }
export async function handleReconciliationPreview(req, res, next) { try { res.json({ data: await service.previewHistoricalReconciliation(req.query) }); } catch (error) { next(error); } }
export async function handleReconciliationImport(req, res, next) { try { res.json({ data: await service.importHistoricalReconciliation(req.body, req.user) }); } catch (error) { next(error); } }
