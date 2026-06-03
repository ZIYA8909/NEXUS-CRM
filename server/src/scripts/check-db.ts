import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Lead } from '../models/Lead';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise-crm';

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    const userCount = await User.countDocuments({});
    const customerCount = await Customer.countDocuments({});
    const leadCount = await Lead.countDocuments({});
    
    console.log('User count:', userCount);
    console.log('Customer count:', customerCount);
    console.log('Lead count:', leadCount);
    
    if (userCount > 0) {
      console.log('Sample Users:');
      const users = await User.find({}).limit(5);
      console.log(users.map(u => ({ name: u.name, email: u.email, role: u.role, status: u.status })));
    }
    
    if (customerCount > 0) {
      console.log('Sample Customers:');
      const customers = await Customer.find({}).limit(5).populate('assignedManager', 'name');
      console.log(customers.map(c => ({ name: c.name, company: c.company, revenue: c.revenueGenerated, manager: c.assignedManager })));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
