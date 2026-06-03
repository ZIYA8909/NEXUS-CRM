import { Router } from 'express';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  getTaskStats,
  createTaskSchema,
  updateTaskSchema
} from '../controllers/tasks';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate); // Secure all task routes

router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
