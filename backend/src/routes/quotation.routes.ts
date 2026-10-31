import { Router } from 'express';
import { quotationController } from '../controllers/quotation.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), quotationController.list);
router.post('/', authorize('ADMIN', 'STAFF'), quotationController.create);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), quotationController.getById);
router.patch('/:id', authorize('ADMIN', 'STAFF'), quotationController.update);
router.post('/:id/confirm', authorize('ADMIN', 'STAFF'), quotationController.confirm);
router.post('/:id/cancel', authorize('ADMIN', 'STAFF'), quotationController.cancel);

export default router;
