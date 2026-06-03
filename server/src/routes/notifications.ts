import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Secure all notification routes

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
