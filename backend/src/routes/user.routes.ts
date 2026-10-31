import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

// All user management is ADMIN only
router.get('/', authorize('ADMIN', 'STAFF'), userController.list);
router.post('/', authorize('ADMIN'), userController.create);
router.get('/:id', authorize('ADMIN', 'STAFF'), userController.getById);
router.patch('/:id', authorize('ADMIN'), userController.update);
router.delete('/:id/deactivate', authorize('ADMIN'), userController.deactivate);

export default router;
