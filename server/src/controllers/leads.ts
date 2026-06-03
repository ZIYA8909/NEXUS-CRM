import { Response } from 'express';
import { z } from 'zod';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { Activity } from '../models/Activity';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Validation Schemas
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  industry: z.enum(['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Other']).optional(),
  leadSource: z.enum(['Website', 'Referral', 'Cold Outreach', 'LinkedIn', 'Partner', 'Event', 'Other']).optional(),
  estimatedDealValue: z.number().min(0).optional(),
  assignedUser: z.string().optional(),
  leadStage: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost']).optional(),
  notes: z.string().optional()
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateStageSchema = z.object({
  leadStage: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'])
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string())
});

export const bulkUpdateStageSchema = z.object({
  ids: z.array(z.string()),
  leadStage: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'])
});

// Helper: Log Activity
const logActivity = async (type: string, content: string, performedBy: mongoose.Types.ObjectId, leadId: mongoose.Types.ObjectId) => {
  await Activity.create({
    type,
    content,
    performedBy,
    relatedTo: { modelType: 'Lead', modelId: leadId }
  });
};

// Controllers
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      stage, 
      industry, 
      source, 
      assignedUser, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query: any = {};

    // RBAC: Sales executives see only their own leads, managers & admins see all
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    } else if (assignedUser) {
      query.assignedUser = new mongoose.Types.ObjectId(assignedUser as string);
    }

    // Filters
    if (stage) query.leadStage = stage;
    if (industry) query.industry = industry;
    if (source) query.leadSource = source;

    // Search
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

    // Sort mapping
    const sortField = sortBy as string;
    const sortVal = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [sortField]: sortVal };

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedUser', 'name email avatar role')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    return res.json({
      leads,
      pagination: {
        total: totalLeads,
        pages: Math.ceil(totalLeads / limitNum),
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

export const getLeadById = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedUser', 'name email avatar role');
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC check
    if (req.user?.role === 'executive' && lead.assignedUser?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this lead' });
    }

    // Fetch activities for this lead
    const activities = await Activity.find({ 'relatedTo.modelId': lead._id })
      .populate('performedBy', 'name avatar')
      .sort({ timestamp: -1 });

    return res.json({ lead, activities });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching lead details', error: error.message });
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    
    // Assign to self if not specified and role is executive
    if (!data.assignedUser && req.user?.role === 'executive') {
      data.assignedUser = req.user._id;
    }

    const lead = new Lead({
      ...data,
      notes: data.notes ? [data.notes] : []
    });

    await lead.save();

    const performedById = req.user!._id as mongoose.Types.ObjectId;
    const leadIdObj = lead._id as mongoose.Types.ObjectId;

    await logActivity('Note', 'Lead created in CRM system.', performedById, leadIdObj);

    // Notify assignee
    if (lead.assignedUser && lead.assignedUser.toString() !== req.user!._id.toString()) {
      await Notification.create({
        recipient: lead.assignedUser,
        title: 'New Lead Assigned',
        message: `Lead ${lead.name} from ${lead.company} has been assigned to you by ${req.user!.name}.`,
        type: 'Lead Assigned',
        relatedTo: { modelType: 'Lead', modelId: lead._id }
      });
    }

    return res.status(201).json(lead);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating lead', error: error.message });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC check
    if (req.user?.role === 'executive' && lead.assignedUser?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStage = lead.leadStage;
    const oldAssignee = lead.assignedUser?.toString();
    const data = req.body;

    // Handle new note addition
    if (data.notes) {
      lead.notes.push(data.notes);
      delete data.notes;
    }

    Object.assign(lead, data);
    lead.lastActivityAt = new Date();
    await lead.save();

    const performedById = req.user!._id as mongoose.Types.ObjectId;
    const leadIdObj = lead._id as mongoose.Types.ObjectId;

    // Activity log for stage change
    if (data.leadStage && data.leadStage !== oldStage) {
      await logActivity('Status Change', `Stage updated from "${oldStage}" to "${data.leadStage}"`, performedById, leadIdObj);
    } else {
      await logActivity('Note', 'Lead details updated.', performedById, leadIdObj);
    }

    // Notify new assignee if changed
    if (lead.assignedUser && lead.assignedUser.toString() !== oldAssignee && lead.assignedUser.toString() !== req.user!._id.toString()) {
      await Notification.create({
        recipient: lead.assignedUser,
        title: 'Lead Assigned',
        message: `Lead ${lead.name} from ${lead.company} has been reassigned to you.`,
        type: 'Lead Assigned',
        relatedTo: { modelType: 'Lead', modelId: lead._id }
      });
    }

    return res.json(lead);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating lead', error: error.message });
  }
};

export const patchLeadStage = async (req: AuthRequest, res: Response) => {
  try {
    const { leadStage } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC
    if (req.user?.role === 'executive' && lead.assignedUser?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStage = lead.leadStage;
    lead.leadStage = leadStage;
    lead.lastActivityAt = new Date();
    await lead.save();

    const performedById = req.user!._id as mongoose.Types.ObjectId;
    const leadIdObj = lead._id as mongoose.Types.ObjectId;

    await logActivity('Status Change', `Pipeline stage updated from "${oldStage}" to "${leadStage}" via Drag & Drop`, performedById, leadIdObj);

    // Notify manager or admin if deals are won
    if (leadStage === 'Closed Won') {
      const managers = await User.find({ role: { $in: ['admin', 'manager'] } });
      for (const mgr of managers) {
        await Notification.create({
          recipient: mgr._id,
          title: 'Deal Won! 🚀',
          message: `Lead ${lead.name} from ${lead.company} (₹${lead.estimatedDealValue.toLocaleString()}) was successfully marked Closed Won by ${req.user!.name}.`,
          type: 'Deal Closed',
          relatedTo: { modelType: 'Lead', modelId: lead._id }
        });
      }
    }

    return res.json(lead);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating lead stage', error: error.message });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Restricted to Manager or Admin
    if (req.user?.role === 'executive') {
      return res.status(403).json({ message: 'Access denied: Only Managers or Admins can delete leads' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    // Delete cascading activities/tasks
    await Activity.deleteMany({ 'relatedTo.modelId': lead._id });
    
    return res.json({ message: 'Lead and related activities deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting lead', error: error.message });
  }
};

export const bulkDeleteLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (req.user?.role === 'executive') {
      return res.status(403).json({ message: 'Access denied: Only Managers/Admins can bulk delete leads' });
    }

    await Lead.deleteMany({ _id: { $in: ids } });
    await Activity.deleteMany({ 'relatedTo.modelId': { $in: ids } });

    return res.json({ message: 'Leads deleted successfully in bulk' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Bulk delete failed', error: error.message });
  }
};

export const bulkUpdateLeadsStage = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, leadStage } = req.body;

    const query: any = { _id: { $in: ids } };
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    await Lead.updateMany(query, { 
      $set: { leadStage, lastActivityAt: new Date() } 
    });

    const performedById = req.user!._id as mongoose.Types.ObjectId;

    // Log individual activities
    for (const id of ids) {
      await logActivity('Status Change', `Bulk stage update to "${leadStage}"`, performedById, new mongoose.Types.ObjectId(id));
    }

    return res.json({ message: 'Leads updated successfully in bulk' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Bulk update failed', error: error.message });
  }
};

export const convertLeadToCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (lead.leadStage !== 'Closed Won') {
      return res.status(400).json({ message: 'Only Closed Won leads can be converted to Customers' });
    }

    // Check if customer already exists for this email/company
    let existingCust = await Customer.findOne({ email: lead.email });
    if (existingCust) {
      return res.status(400).json({ message: 'Customer with this email address already exists' });
    }

    const customer = new Customer({
      leadId: lead._id,
      name: lead.name,
      company: lead.company,
      email: lead.email || `${lead.name.toLowerCase().replace(/\s+/g, '')}@example-crm.com`,
      phone: lead.phone,
      industry: lead.industry,
      revenueGenerated: lead.estimatedDealValue,
      assignedManager: lead.assignedUser || req.user!._id,
      notes: lead.notes,
      address: {
        street: '100 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States'
      }
    });

    await customer.save();

    const performedById = req.user!._id as mongoose.Types.ObjectId;
    const customerIdObj = customer._id as mongoose.Types.ObjectId;

    // Log Activity for Customer
    await Activity.create({
      type: 'Status Change',
      content: `Promoted from Lead (${lead.company}) to Customer profile.`,
      performedBy: performedById,
      relatedTo: { modelType: 'Customer', modelId: customerIdObj }
    });

    // Notify team
    await Notification.create({
      recipient: customer.assignedManager,
      title: 'Customer Added! 🎉',
      message: `${customer.name} from ${customer.company} is now active under your account management portfolio.`,
      type: 'Customer Added',
      relatedTo: { modelType: 'Customer', modelId: customer._id }
    });

    return res.status(201).json({ customer, message: 'Lead successfully converted to Customer!' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error converting lead to customer', error: error.message });
  }
};
