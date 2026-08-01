import express from 'express';
import { getDuplicateAuditController } from '../../controllers/duplicateAudit.controller';
import { isAdmin } from '../../middleware/auth';

const router = express.Router();

// GET /api/duplicate-audit?type=url&page=1&limit=20
// Protected: Admin only, read-only duplicate audit over Books.
router.get('/', isAdmin, getDuplicateAuditController);

export { router as duplicateAuditRouter };
