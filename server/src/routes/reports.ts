import { Router } from 'express';
import { 
  getDashboardStats, 
  getRevenueTrend, 
  getConversionFunnel, 
  getLeadSources, 
  getTeamPerformance, 
  exportReport,
  getRecentActivities
} from '../controllers/reports';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Secure all reports routes

router.get('/dashboard-stats', getDashboardStats);
router.get('/revenue-trend', getRevenueTrend);
router.get('/conversion-funnel', getConversionFunnel);
router.get('/lead-sources', getLeadSources);
router.get('/team-performance', getTeamPerformance);
router.get('/recent-activities', getRecentActivities);
router.get('/export/:type', exportReport);


export default router;
