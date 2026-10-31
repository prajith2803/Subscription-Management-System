import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), customerController.list);
router.post('/', authorize('ADMIN', 'STAFF'), customerController.create);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), customerController.getById);
router.patch('/:id', authorize('ADMIN', 'STAFF'), customerController.update);
router.delete('/:id/deactivate', authorize('ADMIN'), customerController.deactivate);

export default router;
