import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/kpis', dashboardController.getKpis);
router.get('/charts', dashboardController.getCharts);

export default router;
