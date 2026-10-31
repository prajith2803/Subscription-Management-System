import { Router } from 'express';
import { planController } from '../controllers/plan.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF', 'CUSTOMER'), planController.list);
router.post('/', authorize('ADMIN'), planController.create);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), planController.getById);
router.patch('/:id', authorize('ADMIN'), planController.update);
router.post('/:id/products', authorize('ADMIN', 'STAFF'), planController.addProduct);
router.delete('/:id/products/:planProductId', authorize('ADMIN'), planController.removeProduct);

export default router;
