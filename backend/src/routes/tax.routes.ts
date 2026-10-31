import { Router } from 'express';
import { taxController } from '../controllers/tax.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), taxController.list);
router.post('/', authorize('ADMIN'), taxController.create);
router.get('/:id', authorize('ADMIN', 'STAFF'), taxController.getById);
router.patch('/:id', authorize('ADMIN'), taxController.update);
router.delete('/:id', authorize('ADMIN'), taxController.remove);

export default router;
