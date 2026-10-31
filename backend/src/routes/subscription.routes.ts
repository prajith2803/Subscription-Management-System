import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF', 'CUSTOMER'), subscriptionController.list);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), subscriptionController.getById);
router.post('/:id/pause', authorize('ADMIN', 'STAFF'), subscriptionController.pause);
router.post('/:id/resume', authorize('ADMIN', 'STAFF'), subscriptionController.resume);
router.post('/:id/close', authorize('ADMIN', 'STAFF'), subscriptionController.close);
router.post('/:id/renew', authorize('ADMIN', 'STAFF'), subscriptionController.renew);

export default router;
