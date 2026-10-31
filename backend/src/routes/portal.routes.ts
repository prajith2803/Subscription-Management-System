import { Router } from 'express';
import { portalController } from '../controllers/portal.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.use(authorize('CUSTOMER'));

router.get('/dashboard', portalController.getDashboard);
router.get('/subscriptions', portalController.getSubscriptions);
router.get('/subscriptions/:id', portalController.getSubscriptionById);
router.get('/invoices', portalController.getInvoices);
router.get('/invoices/:id', portalController.getInvoiceById);
router.get('/invoices/:id/pdf', portalController.getInvoicePdf);
router.get('/payments', portalController.getPayments);
router.get('/profile', portalController.getProfile);
router.patch('/profile', portalController.updateProfile);

export default router;
