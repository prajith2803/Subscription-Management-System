import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/run', authorize('ADMIN'), billingController.runBilling);
router.get('/logs', authorize('ADMIN', 'STAFF'), billingController.getLogs);

export default router;
