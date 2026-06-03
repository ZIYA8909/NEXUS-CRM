import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { Team } from '../models/Team';
import { Notification } from '../models/Notification';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise-crm';

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Vivaan', 'Arjun', 'Sai', 'Aditya', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv',
  'Ananya', 'Diya', 'Kavya', 'Isha', 'Riya', 'Shruti', 'Tanvi', 'Kiran', 'Vikram', 'Rohan',
  'Rahul', 'Pooja', 'Neha', 'Sanjay', 'Amit', 'Priya', 'Deepak', 'Rajesh', 'Suresh', 'Manish',
  'Vijay', 'Sunita', 'Geeta', 'Anil', 'Sunil', 'Preeti', 'Jyoti', 'Harish', 'Ramesh', 'Karan'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Mehta', 'Gupta', 'Kumar', 'Singh', 'Joshi', 'Iyer', 'Nair',
  'Rao', 'Reddy', 'Choudhury', 'Sen', 'Das', 'Banerjee', 'Chatterjee', 'Dubey', 'Trivedi', 'Pandey',
  'Mishra', 'Saxena', 'Deshmukh', 'Kulkarni', 'Jadhav', 'Shinde', 'Pillai', 'Menon', 'Shetty', 'Bhat'
];

const COMPANIES = [
  'CloudScale Systems', 'Fintech Alpha', 'Stripe Global Services', 'Retool Software', 'Snowflake Analytics',
  'HashiCorp Tech', 'Datadog Systems', 'Vercel Apps', 'Scale AI Labs', 'Linear Ventures',
  'Supabase Devs', 'LogRocket Agency', 'Sentry Security', 'CrowdStrike Intelligence', 'Figma Studios',
  'Webflow Labs', 'Segment Intelligence', 'Auth0 Security', 'Databricks Cloud', 'Elastic Labs',
  'Okta Platform', 'Postman Devs', 'Zapier Labs', 'Miro Agency', 'Notion Workspaces',
  'Slack Enterprise', 'Zoom Tech', 'GitHub Repos', 'Atlassian Solutions', 'Docker Containers',
  'Kubernetes Scale', 'Apollo GraphQL', 'Prisma DB', 'Vite Bundlers', 'Tailwind Designs',
  'Intercom Chat', 'HubSpot Hub', 'Salesforce Cloud', 'Pipedrive Pipeline', 'ActiveCampaign',
  'Mailchimp Send', 'SendGrid Mail', 'Twilio Comms', 'Asana Operations', 'Monday Management',
  'Jira Pipelines', 'Trello Cards', 'Confluence Docs', 'Framer Sites', 'Webflow Core'
];

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Other'] as const;
const SOURCES = ['Website', 'Referral', 'Cold Outreach', 'LinkedIn', 'Partner', 'Event', 'Other'] as const;
const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;

const TASK_TITLES = [
  'Follow up with procurement team',
  'Send updated contract agreement',
  'Review Q3 sales objectives',
  'Schedule introductory presentation',
  'Provide API developer docs',
  'Complete security audit questionnaire',
  'Confirm onboarding schedule',
  'Prepare product demonstration video',
  'Conduct pricing negotiation review',
  'Discuss custom feature request with product',
  'Email pricing details sheet',
  'Organize technical alignment call',
  'Perform client account check-in',
  'Draft custom scope of work'
];

const ACTIVITY_CONTENTS = [
  'Sent introductory email outlining CRM integration services.',
  'Had 15-minute phone call to review product requirements and scaling objectives.',
  'Conducted detailed Webex demonstration showing dashboard analytics and roles management.',
  'Emailed pricing plan sheet and security compliance whitepaper.',
  'Left a voice message asking to reschedule the technical alignment call.',
  'Negotiated contract length and bulk pricing rates for enterprise seats.',
  'Logged internal notes about lead shifting toward a different tech stack.',
  'Discussed implementation timeline and support expectations with target champion.'
];

const selectRandom = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSeedData = async () => {
  try {
    console.log('Seeding Database... connecting to Mongo');
    await mongoose.connect(MONGODB_URI);
    console.log('Database Connected.');

    // Clear existing data
    console.log('Flushing existing CRM collections...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Customer.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await Team.deleteMany({});
    await Notification.deleteMany({});
    console.log('Collections cleared.');

    // 1. Create Users (50 Total: 1 Admin, 4 Managers, 45 Executives)
    console.log('Creating 50 Users...');
    const usersData: any[] = [];
    
    // Admin
    usersData.push({
      name: 'Aarav Sharma (Admin)',
      email: 'admin@enterprise.com',
      passwordHash: 'admin123', // Pre-save hook hashes this
      role: 'admin',
      status: 'active',
      phone: '+91 98765 43210'
    });

    // 4 Managers
    for (let i = 1; i <= 4; i++) {
      const first = selectRandom(FIRST_NAMES);
      const last = selectRandom(LAST_NAMES);
      usersData.push({
        name: `${first} ${last} (Manager)`,
        email: `manager${i}@enterprise.com`,
        passwordHash: 'manager123',
        role: 'manager',
        status: 'active',
        phone: `+1 (555) 010-000${i+1}`
      });
    }

    // 45 Executives
    for (let i = 1; i <= 45; i++) {
      const first = selectRandom(FIRST_NAMES);
      const last = selectRandom(LAST_NAMES);
      usersData.push({
        name: `${first} ${last}`,
        email: `exec${i}@enterprise.com`,
        passwordHash: 'exec123',
        role: 'executive',
        status: i % 15 === 0 ? 'inactive' : 'active', // a couple of inactive users
        phone: `+1 (555) 010-00${i + 5}`
      });
    }

    const insertedUsers = await User.create(usersData);
    console.log(`Created ${insertedUsers.length} Users.`);

    // Group active users to make assignments
    const activeExecs = insertedUsers.filter(u => u.role === 'executive' && u.status === 'active');
    const managers = insertedUsers.filter(u => u.role === 'manager');
    const admin = insertedUsers.find(u => u.role === 'admin')!;

    // Create a Sales Team
    console.log('Creating Sales Teams...');
    await Team.create({
      name: 'Mumbai Enterprise Sales',
      manager: managers[0]._id,
      members: activeExecs.slice(0, 15).map(u => u._id)
    });
    await Team.create({
      name: 'Bengaluru Tech Sales',
      manager: managers[1]._id,
      members: activeExecs.slice(15, 30).map(u => u._id)
    });

    // 2. Create 1000 Leads
    console.log('Generating 1000 Leads...');
    const leadsData: any[] = [];
    
    for (let i = 0; i < 1000; i++) {
      const first = selectRandom(FIRST_NAMES);
      const last = selectRandom(LAST_NAMES);
      const company = selectRandom(COMPANIES);
      const assignee = selectRandom(activeExecs);

      // Distribute stages: mostly open deals, some Closed Won, some Closed Lost
      const randStageVal = Math.random();
      let stage: typeof STAGES[number] = 'New';
      if (randStageVal < 0.15) stage = 'New';
      else if (randStageVal < 0.35) stage = 'Contacted';
      else if (randStageVal < 0.55) stage = 'Qualified';
      else if (randStageVal < 0.70) stage = 'Proposal Sent';
      else if (randStageVal < 0.80) stage = 'Negotiation';
      else if (randStageVal < 0.92) stage = 'Closed Won';
      else stage = 'Closed Lost';

      const estValue = randomRange(50000, 1800000); // Higher values in INR
      const notesArray = [
        `Lead created via ${selectRandom(SOURCES)}.`,
        `Estimated contract value: ₹${estValue.toLocaleString()}`
      ];
      if (Math.random() > 0.5) notesArray.push('CTO seems highly interested, requesting a product sandbox.');

      leadsData.push({
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+91 98230 ${randomRange(10000, 99999)}`,
        company: company,
        industry: selectRandom(INDUSTRIES),
        leadSource: selectRandom(SOURCES),
        estimatedDealValue: estValue,
        assignedUser: assignee._id,
        leadStage: stage,
        notes: notesArray,
        lastActivityAt: new Date(Date.now() - randomRange(0, 30) * 24 * 60 * 60 * 1000)
      });
    }

    const insertedLeads = await Lead.insertMany(leadsData);
    console.log(`Created ${insertedLeads.length} Leads.`);

    // 3. Create 300 Customers
    console.log('Generating 300 Customers...');
    const customersData: any[] = [];
    const closedWonLeads = insertedLeads.filter(l => l.leadStage === 'Closed Won');

    for (let i = 0; i < 300; i++) {
      const first = selectRandom(FIRST_NAMES);
      const last = selectRandom(LAST_NAMES);
      const company = selectRandom(COMPANIES);
      const manager = selectRandom(insertedUsers.filter(u => u.role !== 'admin' && u.status === 'active'));

      // If we have Closed Won leads, link some of them directly
      const leadLink = i < closedWonLeads.length ? closedWonLeads[i] : null;

      customersData.push({
        leadId: leadLink ? leadLink._id : undefined,
        name: leadLink ? leadLink.name : `${first} ${last}`,
        company: leadLink ? leadLink.company : company,
        email: leadLink ? leadLink.email : `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: leadLink ? leadLink.phone : `+91 98450 ${randomRange(10000, 99999)}`,
        address: {
          street: `${randomRange(100, 999)} ${selectRandom(['MG Road', 'Linking Road', 'Hitech City Phase 2', 'Electronic City Phase 1', 'Sector 62', 'Park Street', 'Anna Salai'])}`,
          city: selectRandom(['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Noida']),
          state: selectRandom(['MH', 'DL', 'KA', 'TS', 'TN', 'MH', 'WB', 'UP']),
          zip: randomRange(110001, 800001).toString(),
          country: 'India'
        },
        industry: leadLink ? leadLink.industry : selectRandom(INDUSTRIES),
        revenueGenerated: leadLink ? leadLink.estimatedDealValue : randomRange(10000, 250000),
        customerSince: new Date(Date.now() - randomRange(30, 365) * 24 * 60 * 60 * 1000),
        assignedManager: leadLink ? leadLink.assignedUser : manager._id,
        notes: leadLink ? leadLink.notes : ['Converted from direct sales pipeline. Account active.']
      });
    }

    const insertedCustomers = await Customer.insertMany(customersData);
    console.log(`Created ${insertedCustomers.length} Customers.`);

    // 4. Create 2000 Activities (grouped on leads or customers)
    console.log('Generating 2000 Activities...');
    const activitiesData: any[] = [];
    const usersList = insertedUsers.filter(u => u.status === 'active');

    for (let i = 0; i < 2000; i++) {
      const isLead = Math.random() > 0.4;
      const targetObj = isLead ? selectRandom(insertedLeads) : selectRandom(insertedCustomers);
      const modelType = isLead ? 'Lead' : 'Customer';
      
      const type = selectRandom(['Call', 'Meeting', 'Email', 'Note', 'Status Change', 'Task Completed']);
      const performedBy = selectRandom(usersList);

      activitiesData.push({
        type,
        content: `${selectRandom(ACTIVITY_CONTENTS)} Performed by representative: ${performedBy.name}`,
        performedBy: performedBy._id,
        relatedTo: { modelType, modelId: targetObj._id },
        timestamp: new Date(Date.now() - randomRange(0, 45) * 24 * 60 * 60 * 1000)
      });
    }

    await Activity.insertMany(activitiesData);
    console.log('Created 2000 Activity History records.');

    // 5. Create 500 Tasks
    console.log('Generating 500 Tasks...');
    const tasksData: any[] = [];

    for (let i = 0; i < 500; i++) {
      const isLead = Math.random() > 0.5;
      const targetObj = isLead ? selectRandom(insertedLeads) : selectRandom(insertedCustomers);
      const modelType = isLead ? 'Lead' : 'Customer';

      const assignee = selectRandom(usersList);
      
      // Due dates: some past, some future
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + randomRange(-10, 20));

      tasksData.push({
        title: selectRandom(TASK_TITLES),
        description: `Ensure prompt followup regarding this ${modelType.toLowerCase()} to align key requirements.`,
        priority: selectRandom(PRIORITIES),
        dueDate,
        assignedUser: assignee._id,
        status: selectRandom(TASK_STATUSES),
        relatedTo: { modelType, modelId: targetObj._id }
      });
    }

    await Task.insertMany(tasksData);
    console.log('Created 500 Tasks.');

    // Send a couple of notifications to user roles
    console.log('Sending seed notifications...');
    await Notification.create({
      recipient: admin._id,
      title: 'Database Seeding Complete',
      message: 'All collections (Users, Leads, Customers, Tasks, Activities) have been fully seeded with enterprise-grade data.',
      type: 'Customer Added'
    });

    console.log('SUCCESS: Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('ERROR during seeding:', error);
    process.exit(1);
  }
};

generateSeedData();
