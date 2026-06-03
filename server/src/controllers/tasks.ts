import { Response } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Validation Schemas
export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().transform(str => new Date(str)),
  assignedUser: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  relatedTo: z.object({
    modelType: z.enum(['Lead', 'Customer']),
    modelId: z.string()
  }).optional()
});

export const updateTaskSchema = createTaskSchema.partial();

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, dueBefore, limit = 100 } = req.query;
    const query: any = {};

    // RBAC: executives view their own tasks, manager/admin view all or filtered
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    } else if (req.query.assignedUser) {
      query.assignedUser = new mongoose.Types.ObjectId(req.query.assignedUser as string);
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (dueBefore) {
      query.dueDate = { $lte: new Date(dueBefore as string) };
    }

    const tasks = await Task.find(query)
      .populate('assignedUser', 'name email avatar role')
      .populate('relatedTo.modelId', 'name company email')
      .sort({ dueDate: 1 }) // Closest deadline first
      .limit(parseInt(limit as string));

    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.assignedUser && req.user) {
      data.assignedUser = req.user._id;
    }

    const task = new Task(data);
    await task.save();

    // Check if task is due soon to immediately queue a notification preference
    const now = new Date();
    const diffTime = Math.abs(task.dueDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2 && task.status !== 'Completed') {
      await Notification.create({
        recipient: task.assignedUser,
        title: 'Task Due Soon',
        message: `Task: "${task.title}" is due by ${task.dueDate.toLocaleDateString()}.`,
        type: 'Task Due',
        relatedTo: { modelType: 'Task', modelId: task._id }
      });
    }

    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user?.role === 'executive' && task.assignedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = task.status;
    Object.assign(task, req.body);
    await task.save();

    // If marked Completed, log task completion on timeline if it relates to Lead/Customer
    if (task.status === 'Completed' && oldStatus !== 'Completed' && task.relatedTo?.modelId) {
      await Activity.create({
        type: 'Task Completed',
        content: `Completed task: "${task.title}"`,
        performedBy: req.user!._id,
        relatedTo: { 
          modelType: task.relatedTo.modelType, 
          modelId: task.relatedTo.modelId 
        }
      });
    }

    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user?.role === 'executive' && task.assignedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

export const getTaskStats = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    const total = await Task.countDocuments(query);
    const pending = await Task.countDocuments({ ...query, status: 'Pending' });
    const inProgress = await Task.countDocuments({ ...query, status: 'In Progress' });
    const completed = await Task.countDocuments({ ...query, status: 'Completed' });

    // Due soon: Due within next 48 hours and not completed
    const fortyEightHours = new Date();
    fortyEightHours.setHours(fortyEightHours.getHours() + 48);
    const dueSoon = await Task.countDocuments({
      ...query,
      status: { $ne: 'Completed' },
      dueDate: { $lte: fortyEightHours, $gte: new Date() }
    });

    return res.json({ total, pending, inProgress, completed, dueSoon });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error calculating task statistics', error: error.message });
  }
};
