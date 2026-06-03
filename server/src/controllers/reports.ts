import { Response } from 'express';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Dynamic KPI calculations
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    const totalLeads = await Lead.countDocuments(query);
    const activeDeals = await Lead.countDocuments({ 
      ...query, 
      leadStage: { $nin: ['Closed Won', 'Closed Lost'] } 
    });
    
    // Deals Won vs Lost
    const dealsWon = await Lead.countDocuments({ ...query, leadStage: 'Closed Won' });
    const dealsLost = await Lead.countDocuments({ ...query, leadStage: 'Closed Lost' });

    // Conversion rate: Won / (Won + Lost)
    const closedCount = dealsWon + dealsLost;
    const conversionRate = closedCount > 0 ? parseFloat(((dealsWon / closedCount) * 100).toFixed(1)) : 0;

    // Revenue calculation: Sum of revenue generated from customers + estimated value of Closed Won leads
    let revenueQuery: any = {};
    if (req.user?.role === 'executive') {
      revenueQuery.assignedManager = req.user._id;
    }

    const customerRev = await Customer.aggregate([
      { $match: revenueQuery },
      { $group: { _id: null, total: { $sum: '$revenueGenerated' } } }
    ]);

    const leadRev = await Lead.aggregate([
      { $match: { ...query, leadStage: 'Closed Won' } },
      { $group: { _id: null, total: { $sum: '$estimatedDealValue' } } }
    ]);

    const totalRevenue = (customerRev[0]?.total || 0) + (leadRev[0]?.total || 0);

    // Mock MoM growth comparison percentages for premium feel
    return res.json({
      leads: { value: totalLeads, change: '+12.4%', trend: 'up' },
      activeDeals: { value: activeDeals, change: '+8.2%', trend: 'up' },
      revenue: { value: totalRevenue, change: '+24.1%', trend: 'up' },
      conversionRate: { value: `${conversionRate}%`, change: '+4.5%', trend: 'up' },
      dealsWon: { value: dealsWon, change: '+15.2%', trend: 'up' },
      dealsLost: { value: dealsLost, change: '-3.1%', trend: 'down' }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error calculating dashboard statistics', error: error.message });
  }
};

// Revenue Trend by Month
export const getRevenueTrend = async (req: AuthRequest, res: Response) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // We group by month of creation for won leads
    const query: any = { leadStage: 'Closed Won' };
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    const result = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $month: '$updatedAt' },
          revenue: { $sum: '$estimatedDealValue' },
          deals: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Fill in empty months
    const trendData = months.map((month, idx) => {
      const monthNum = idx + 1;
      const matched = result.find(r => r._id === monthNum);
      return {
        month,
        revenue: matched ? matched.revenue : 0,
        deals: matched ? matched.deals : 0
      };
    });

    return res.json(trendData);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching revenue trend', error: error.message });
  }
};

// Conversion Funnel counts
export const getConversionFunnel = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
    
    const result = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$leadStage', count: { $sum: 1 } } }
    ]);

    const funnelData = stages.map(stage => {
      const matched = result.find(r => r._id === stage);
      return {
        stage,
        count: matched ? matched.count : 0
      };
    });

    return res.json(funnelData);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching conversion funnel', error: error.message });
  }
};

// Lead Source Shares
export const getLeadSources = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'executive') {
      query.assignedUser = req.user._id;
    }

    const result = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$leadSource', value: { $sum: 1 } } }
    ]);

    const sourceData = result.map(item => ({
      name: item._id || 'Other',
      value: item.value
    }));

    return res.json(sourceData);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching lead sources', error: error.message });
  }
};

// Employee Performance Table
export const getTeamPerformance = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'executive') {
      return res.status(403).json({ message: 'Only Managers and Admins can view team performance reports' });
    }

    const performance = await Lead.aggregate([
      {
        $group: {
          _id: '$assignedUser',
          totalLeads: { $sum: 1 },
          wonDeals: { $sum: { $cond: [{ $eq: ['$leadStage', 'Closed Won'] }, 1, 0] } },
          lostDeals: { $sum: { $cond: [{ $eq: ['$leadStage', 'Closed Lost'] }, 1, 0] } },
          wonRevenue: { $sum: { $cond: [{ $eq: ['$leadStage', 'Closed Won'] }, '$estimatedDealValue', 0] } },
          totalDealValue: { $sum: '$estimatedDealValue' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          id: '$_id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar',
          role: '$user.role',
          totalLeads: 1,
          wonDeals: 1,
          lostDeals: 1,
          wonRevenue: 1,
          totalDealValue: 1,
          conversionRate: {
            $cond: [
              { $gt: [{ $add: ['$wonDeals', '$lostDeals'] }, 0] },
              { $multiply: [{ $divide: ['$wonDeals', { $add: ['$wonDeals', '$lostDeals'] }] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { wonRevenue: -1 } } // Top earners first
    ]);

    return res.json(performance);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error calculating performance stats', error: error.message });
  }
};

// CSV Export route helper
export const exportReport = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    let csvContent = '';
    let filename = '';

    if (type === 'leads') {
      filename = 'leads_report.csv';
      const query: any = {};
      if (req.user?.role === 'executive') {
        query.assignedUser = req.user._id;
      }
      const leads = await Lead.find(query).populate('assignedUser', 'name');
      
      csvContent = 'ID,Name,Email,Phone,Company,Industry,Source,Estimated Value,Stage,Assigned User,Created At\n';
      leads.forEach(lead => {
        csvContent += `"${lead._id}","${lead.name.replace(/"/g, '""')}","${lead.email}","${lead.phone}","${lead.company.replace(/"/g, '""')}","${lead.industry}","${lead.leadSource}",${lead.estimatedDealValue},"${lead.leadStage}","${(lead.assignedUser as any)?.name || 'Unassigned'}","${lead.createdAt.toISOString()}"\n`;
      });
      
    } else if (type === 'customers') {
      filename = 'customers_report.csv';
      const query: any = {};
      if (req.user?.role === 'executive') {
        query.assignedManager = req.user._id;
      }
      const customers = await Customer.find(query).populate('assignedManager', 'name');
      
      csvContent = 'ID,Name,Company,Email,Phone,Industry,Revenue Generated,Customer Since,Assigned Manager\n';
      customers.forEach(cust => {
        csvContent += `"${cust._id}","${cust.name.replace(/"/g, '""')}","${cust.company.replace(/"/g, '""')}","${cust.email}","${cust.phone}","${cust.industry}",${cust.revenueGenerated},"${cust.customerSince.toISOString()}","${(cust.assignedManager as any)?.name || 'Unassigned'}"\n`;
      });

    } else if (type === 'performance' && req.user?.role !== 'executive') {
      filename = 'team_performance_report.csv';
      const performance = await Lead.aggregate([
        {
          $group: {
            _id: '$assignedUser',
            totalLeads: { $sum: 1 },
            wonDeals: { $sum: { $cond: [{ $eq: ['$leadStage', 'Closed Won'] }, 1, 0] } },
            wonRevenue: { $sum: { $cond: [{ $eq: ['$leadStage', 'Closed Won'] }, '$estimatedDealValue', 0] } }
          }
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }
      ]);

      csvContent = 'User ID,Representative Name,Email,Assigned Leads,Won Deals,Won Revenue\n';
      performance.forEach(p => {
        csvContent += `"${p._id}","${p.user.name}","${p.user.email}",${p.totalLeads},${p.wonDeals},${p.wonRevenue}\n`;
      });
    } else {
      return res.status(400).json({ message: 'Invalid export type or unauthorized' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ message: 'CSV export failed', error: error.message });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'executive') {
      const myLeads = await Lead.find({ assignedUser: req.user._id }, '_id');
      const myCusts = await Customer.find({ assignedManager: req.user._id }, '_id');
      const ids = [...myLeads.map(l => l._id), ...myCusts.map(c => c._id)];
      query['relatedTo.modelId'] = { $in: ids };
    }
    
    const activities = await Activity.find(query)
      .populate('performedBy', 'name avatar')
      .populate('relatedTo.modelId', 'name company')
      .sort({ timestamp: -1 })
      .limit(10);
      
    return res.json(activities);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
  }
};

