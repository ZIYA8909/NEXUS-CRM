import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise-crm';

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const exec = await User.findOne({ email: 'exec1@enterprise.com' });
    if (!exec) {
      console.log('exec1 not found');
      return;
    }
    const count = await Customer.countDocuments({ assignedManager: exec._id });
    console.log('exec1 has', count, 'assigned customers');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
