import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.patch('/read-all', notificationController.readAll);
router.patch('/:id/read', notificationController.markRead);

export default router;
