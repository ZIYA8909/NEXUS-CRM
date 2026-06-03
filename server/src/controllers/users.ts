import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { AuthRequest } from '../middleware/auth';

// Validation Schemas
export const createUserAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'executive']),
  phone: z.string().optional()
});

export const updateUserAdminSchema = createUserAdminSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }).optional()
});

// Admin Controllers
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    // List all users. Executives can only list names/avatars/roles (no emails/phones)
    const isExecutive = req.user?.role === 'executive';
    const selection = isExecutive 
      ? 'name role avatar status' 
      : 'name email role phone status createdAt';

    const users = await User.find({}, selection).sort({ name: 1 });
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const createUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email,
      passwordHash: password, // pre-save will hash it
      role,
      phone
    });

    await user.save();
    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

export const updateUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, phone, status, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (status) user.status = status;

    if (password && password.trim() !== '') {
      user.passwordHash = password; // Pre-save hook will auto-hash this
    }

    await user.save();
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
};

export const deleteUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow deleting self
    if (user._id.toString() === req.user!._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Profile settings (Settings module)
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, password, notificationPreferences } = req.body;
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (notificationPreferences) {
      user.notificationPreferences = notificationPreferences;
    }

    if (password && password.trim() !== '') {
      user.passwordHash = password; // Trigger pre-save hash hook
    }

    await user.save();
    
    return res.json({
      message: 'Profile settings updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};
