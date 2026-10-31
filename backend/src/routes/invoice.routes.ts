import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF', 'CUSTOMER'), invoiceController.list);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), invoiceController.getById);
router.post('/:id/confirm', authorize('ADMIN', 'STAFF'), invoiceController.confirm);
router.post('/:id/cancel', authorize('ADMIN'), invoiceController.cancel);
router.get('/:id/pdf', authorize('ADMIN', 'STAFF', 'CUSTOMER'), invoiceController.getPdf);

export default router;
