import { Router } from 'express';
import { quotationTemplateController } from '../controllers/quotationTemplate.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), quotationTemplateController.list);
router.post('/', authorize('ADMIN'), quotationTemplateController.create);
router.get('/:id', authorize('ADMIN', 'STAFF'), quotationTemplateController.getById);
router.patch('/:id', authorize('ADMIN'), quotationTemplateController.update);

export default router;
