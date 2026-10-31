import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', auditLogController.list);

export default router;
