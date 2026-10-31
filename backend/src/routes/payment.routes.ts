import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), paymentController.list);
router.post('/', authorize('ADMIN', 'STAFF'), paymentController.record);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), paymentController.getById);

export default router;
