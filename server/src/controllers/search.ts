import { Response } from 'express';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q = '' } = req.query;
    const queryStr = q as string;

    if (!queryStr || queryStr.trim().length < 2) {
      return res.json([]);
    }

    const regex = new RegExp(queryStr, 'i');
    
    // RBAC limits executive scope
    const isExecutive = req.user?.role === 'executive';

    const leadsQuery: any = { 
      $or: [
        { name: regex },
        { company: regex }
      ]
    };
    if (isExecutive) leadsQuery.assignedUser = req.user!._id;

    const customersQuery: any = {
      $or: [
        { name: regex },
        { company: regex }
      ]
    };
    if (isExecutive) customersQuery.assignedManager = req.user!._id;

    const tasksQuery: any = { title: regex };
    if (isExecutive) tasksQuery.assignedUser = req.user!._id;

    const usersQuery: any = { name: regex };

    // Run parallel queries
    const [leads, customers, tasks, users] = await Promise.all([
      Lead.find(leadsQuery).limit(10),
      Customer.find(customersQuery).limit(10),
      Task.find(tasksQuery).limit(10),
      isExecutive ? [] : User.find(usersQuery).limit(5) // Executives can search users but let's restrict or keep it light
    ]);

    const results: Array<{
      type: 'lead' | 'customer' | 'task' | 'user';
      id: string;
      title: string;
      subtitle: string;
    }> = [];

    leads.forEach(l => {
      results.push({
        type: 'lead',
        id: l._id.toString(),
        title: l.name,
        subtitle: `Lead @ ${l.company} (${l.leadStage})`
      });
    });

    customers.forEach(c => {
      results.push({
        type: 'customer',
        id: c._id.toString(),
        title: c.name,
        subtitle: `Customer @ ${c.company} (${c.industry})`
      });
    });

    tasks.forEach(t => {
      results.push({
        type: 'task',
        id: t._id.toString(),
        title: t.title,
        subtitle: `Task: Due ${new Date(t.dueDate).toLocaleDateString()} (${t.status})`
      });
    });

    users.forEach(u => {
      results.push({
        type: 'user',
        id: u._id.toString(),
        title: u.name,
        subtitle: `Team Member (${u.role})`
      });
    });

    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ message: 'Global search error', error: error.message });
  }
};
