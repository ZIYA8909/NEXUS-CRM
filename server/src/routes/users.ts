import { Router } from 'express';
import { 
  getUsers, 
  createUserAdmin, 
  updateUserAdmin, 
  deleteUserAdmin, 
  updateMyProfile,
  createUserAdminSchema,
  updateUserAdminSchema,
  updateProfileSchema
} from '../controllers/users';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate); // Secure all user routes

// Profile configurations (Accessible by all logged in users)
router.put('/me', validate(updateProfileSchema), updateMyProfile);

// Admin-level Team management
router.get('/', getUsers);
router.post('/', requireRole(['admin']), validate(createUserAdminSchema), createUserAdmin);
router.put('/:id', requireRole(['admin']), validate(updateUserAdminSchema), updateUserAdmin);
router.delete('/:id', requireRole(['admin']), deleteUserAdmin);

export default router;
