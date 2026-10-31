import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF', 'CUSTOMER'), productController.list);
router.post('/', authorize('ADMIN'), productController.create);
router.get('/:id', authorize('ADMIN', 'STAFF', 'CUSTOMER'), productController.getById);
router.patch('/:id', authorize('ADMIN'), productController.update);
router.get('/:id/variants', authorize('ADMIN', 'STAFF', 'CUSTOMER'), productController.listVariants);
router.post('/:id/variants', authorize('ADMIN'), productController.createVariant);
router.patch('/:id/variants/:variantId', authorize('ADMIN'), productController.updateVariant);

export default router;
