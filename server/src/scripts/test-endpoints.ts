import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import express from 'express';
import { getCustomers } from '../controllers/customers';
import { getUsers } from '../controllers/users';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise-crm';

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. Get the admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found.');
      return;
    }
    console.log('Admin user found:', adminUser.email);

    // 2. Let's mock req/res for getCustomers as admin
    const mockReqCustomersAdmin = {
      user: adminUser,
      query: { page: '1', limit: '10' }
    } as any;

    const mockResCustomers = {
      json: (data: any) => {
        console.log('Customers count returned for Admin:', data.customers?.length);
        console.log('Pagination:', data.pagination);
        return { status: 200, data };
      },
      status: (code: number) => {
        console.log('Status code:', code);
        return mockResCustomers;
      }
    } as any;

    console.log('Testing getCustomers for admin...');
    await getCustomers(mockReqCustomersAdmin, mockResCustomers);

    // 3. Get the first executive user
    const execUser = await User.findOne({ role: 'executive' });
    if (execUser) {
      console.log('Executive user found:', execUser.email, execUser._id);
      
      const mockReqCustomersExec = {
        user: execUser,
        query: { page: '1', limit: '10' }
      } as any;

      const mockResCustomersExec = {
        json: (data: any) => {
          console.log('Customers count returned for Executive:', data.customers?.length);
          console.log('Pagination:', data.pagination);
          return { status: 200, data };
        },
        status: (code: number) => {
          console.log('Status code:', code);
          return mockResCustomersExec;
        }
      } as any;

      console.log('Testing getCustomers for executive...');
      await getCustomers(mockReqCustomersExec, mockResCustomersExec);
    } else {
      console.log('No executive user found.');
    }

    // 4. Test getUsers for admin
    const mockReqUsersAdmin = {
      user: adminUser
    } as any;

    const mockResUsers = {
      json: (data: any) => {
        console.log('Users count returned for Admin:', data?.length);
        return { status: 200, data };
      },
      status: (code: number) => {
        console.log('Status code:', code);
        return mockResUsers;
      }
    } as any;

    console.log('Testing getUsers for admin...');
    await getUsers(mockReqUsersAdmin, mockResUsers);

    // 5. Test getUsers for executive
    if (execUser) {
      const mockReqUsersExec = {
        user: execUser
      } as any;

      const mockResUsersExec = {
        json: (data: any) => {
          console.log('Users count returned for Executive:', data?.length);
          return { status: 200, data };
        },
        status: (code: number) => {
          console.log('Status code:', code);
          return mockResUsersExec;
        }
      } as any;

      console.log('Testing getUsers for executive...');
      await getUsers(mockReqUsersExec, mockResUsersExec);
    }

  } catch (err) {
    console.error('Error running endpoint tests:', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
