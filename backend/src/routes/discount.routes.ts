import { Router } from 'express';
import { discountController } from '../controllers/discount.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), discountController.list);
router.post('/', authorize('ADMIN'), discountController.create);
router.get('/:id', authorize('ADMIN', 'STAFF'), discountController.getById);
router.patch('/:id', authorize('ADMIN'), discountController.update);
router.delete('/:id', authorize('ADMIN'), discountController.remove);
router.get('/:id/eligibility', authorize('ADMIN', 'STAFF'), discountController.checkEligibility);

export default router;
