import express from 'express';
import { body } from 'express-validator';
import {
  getDuplicateAuditController,
  markDuplicateController,
  unmarkDuplicateController,
} from '../../controllers/duplicateAudit.controller';
import { isAdmin } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';

const router = express.Router();

// GET /api/duplicate-audit?type=url&page=1&limit=20
// Protected: Admin only, read-only duplicate audit over Books.
router.get('/', isAdmin, getDuplicateAuditController);

// POST /api/duplicate-audit/mark
// Protected: Admin only. Soft-hides the given duplicate book ids under the
// canonical book id. Deeper business rules (ObjectId format, max 50, existence,
// self-mark, chain/cycle prevention) live in the mark service.
router.post(
  '/mark',
  isAdmin,
  [
    body('canonicalId').isString().trim().notEmpty().withMessage('canonicalId is required'),
    body('duplicateIds').isArray({ min: 1 }).withMessage('duplicateIds must be a non-empty array'),
    body('duplicateIds.*')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each duplicate book id must be a non-empty string'),
  ],
  validateRequest,
  markDuplicateController
);

// POST /api/duplicate-audit/unmark
// Protected: Admin only. Restores the given book ids to public visibility.
router.post(
  '/unmark',
  isAdmin,
  [
    body('duplicateIds').isArray({ min: 1 }).withMessage('duplicateIds must be a non-empty array'),
    body('duplicateIds.*')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each duplicate book id must be a non-empty string'),
  ],
  validateRequest,
  unmarkDuplicateController
);

export { router as duplicateAuditRouter };
