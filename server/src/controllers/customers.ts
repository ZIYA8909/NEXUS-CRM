import { Response } from 'express';
import { z } from 'zod';
import { Customer } from '../models/Customer';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Validation Schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  industry: z.string().optional(),
  revenueGenerated: z.number().optional(),
  assignedManager: z.string().optional(),
  notes: z.string().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      industry, 
      assignedManager,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query: any = {};

    // RBAC: Executive role views only assigned customers
    if (req.user?.role === 'executive') {
      query.assignedManager = req.user._id;
    } else if (assignedManager) {
      query.assignedManager = new mongoose.Types.ObjectId(assignedManager as string);
    }

    if (industry) query.industry = industry;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortField = sortBy as string;
    const sortVal = sortOrder === 'asc' ? 1 : -1;

    const totalCustomers = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .populate('assignedManager', 'name email avatar role')
      .sort({ [sortField]: sortVal })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      customers,
      pagination: {
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limitNum),
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedManager', 'name email avatar role');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user?.role === 'executive' && customer.assignedManager?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch activities for this customer
    const activities = await Activity.find({ 'relatedTo.modelId': customer._id })
      .populate('performedBy', 'name avatar')
      .sort({ timestamp: -1 });

    return res.json({ customer, activities });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customer profile', error: error.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    
    if (!data.assignedManager && req.user) {
      data.assignedManager = req.user._id;
    }

    const existingCustomer = await Customer.findOne({ email: data.email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer email already registered' });
    }

    const customer = new Customer({
      ...data,
      notes: data.notes ? [data.notes] : []
    });

    await customer.save();

    await Activity.create({
      type: 'Note',
      content: 'Customer record created directly.',
      performedBy: req.user!._id,
      relatedTo: { modelType: 'Customer', modelId: customer._id }
    });

    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user?.role === 'executive' && customer.assignedManager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = req.body;

    if (data.notes) {
      customer.notes.push(data.notes);
      delete data.notes;
    }

    Object.assign(customer, data);
    await customer.save();

    await Activity.create({
      type: 'Note',
      content: 'Customer account information updated.',
      performedBy: req.user!._id,
      relatedTo: { modelType: 'Customer', modelId: customer._id }
    });

    return res.json(customer);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating customer profile', error: error.message });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user?.role === 'executive') {
      return res.status(403).json({ message: 'Access denied: Managers/Admins only' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ 'relatedTo.modelId': customer._id });

    return res.json({ message: 'Customer and related records deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};
