// duplicateAudit.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { DuplicateAuditType } from '../services/duplicateAudit/duplicateAudit.service';
import {
  DUPLICATE_AUDIT_TYPES,
  runDuplicateAuditService,
} from '../services/duplicateAudit/duplicateAudit.service';
import {
  markDuplicateService,
  unmarkDuplicateService,
} from '../services/duplicateAudit/duplicateMark.service';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

const isDuplicateAuditType = (value: string): value is DuplicateAuditType =>
  (DUPLICATE_AUDIT_TYPES as string[]).includes(value);

const queryString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const parseBoundedInt = (value: unknown, min: number, max: number): number | null => {
  const raw = queryString(value);
  if (raw === undefined) return null;
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

export const getDuplicateAuditController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const typeValue = queryString(req.query.type) ?? 'url';
    if (!isDuplicateAuditType(typeValue)) {
      return res.status(400).json({ errors: [{ message: 'Invalid type', field: 'type' }] });
    }

    const page = parseBoundedInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    if (page === null && req.query.page !== undefined) {
      return res.status(400).json({ errors: [{ message: 'Invalid page', field: 'page' }] });
    }

    const limit = parseBoundedInt(req.query.limit, 1, MAX_LIMIT);
    if (limit === null && req.query.limit !== undefined) {
      return res.status(400).json({ errors: [{ message: 'Invalid limit', field: 'limit' }] });
    }

    const result = await runDuplicateAuditService({
      type: typeValue,
      page: page ?? 1,
      limit: limit ?? DEFAULT_LIMIT,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const markDuplicateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await markDuplicateService(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const unmarkDuplicateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await unmarkDuplicateService(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
