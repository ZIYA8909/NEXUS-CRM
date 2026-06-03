# Aura CRM - Production-Grade Enterprise Sales SaaS

Aura CRM is a high-fidelity Enterprise Customer Relationship Management (CRM) system designed to replicate real-world workflows inside a sales organization. It implements complex layouts (Dashboard Charts, dynamic Kanban Opportunity Pipelines, Activity Timelines, and Task Reminders) backed by strict Role-Based Access Controls (RBAC), secure JWT sessions, and database structures.

This project is structured as a monorepo containing two workspaces:
- `/server`: Node.js, Express, TypeScript, Mongoose, Zod validations, Bcrypt, JWT.
- `/client`: React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons.

---

## 🔑 Test Credentials Matrix

For ease of testing, the database seed script generates 50 accounts with predefined credentials. Use these to log in and test role-based permissions:

| Business Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@enterprise.com` | `admin123` | Full access, user CRUD, settings, lead deletions, global reports |
| **Sales Manager** | `manager1@enterprise.com` | `manager123` | View team performance, assign leads, promote Closed Won deals |
| **Sales Executive** | `exec1@enterprise.com` | `exec123` | Manage assigned leads, drag-and-drop pipeline, log calls, complete tasks |

---

## 📂 Directory Layout

```
project/
├── client/                     # React Frontend
│   ├── index.html              # HTML shell importing Inter Font
│   ├── vite.config.ts          # Vite compilation & proxy config
│   ├── tailwind.config.js      # CSS variables & design extension
│   └── src/
│       ├── main.tsx            # DOM root mounting entry
│       ├── App.tsx             # Routing & React Query Client config
│       ├── context/
│       │   └── AuthContext.tsx # JWT verification, theme, login handlers
│       ├── lib/
│       │   └── api.ts          # Centralized fetch wrapper (token injection, downloads)
│       ├── components/
│       │   ├── ui/             # Reusable custom components (Button, Input, Select, Badge, Card, Dialog, Dropdown, Skeleton)
│       │   └── shared/
│       │       └── DashboardLayout.tsx # Sidebar nav, spotlight search, notifications dropdown
│       └── pages/              # Page modules (Dashboard, Leads, Customers, Tasks, Reports, Settings, Team, Login, Register, Recoveries)
│
└── server/                     # Express Backend
    ├── tsconfig.json           # TypeScript configuration
    ├── .env                    # Local environment config
    └── src/
        ├── server.ts           # Express boot, database binding & health checks
        ├── middleware/
        │   ├── auth.ts         # JWT decoding & role restriction
        │   └── validate.ts     # Zod payload schema checks
        ├── models/             # Mongoose schemas (User, Lead, Customer, Task, Activity, Notification, Team)
        ├── controllers/        # Route logical controllers (Auth, Leads, Customers, Tasks, Reports, Team, Search)
        ├── routes/             # Express routes configuration
        └── scripts/
            └── seed.ts         # High-fidelity DB seeding script
```

---

## ⚡ Setup & Run Instructions

### Prerequisites
- **Node.js**: v18 or later.
- **MongoDB**: A running local MongoDB service (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas Cloud connection URL.

### 1. Configure the Server & Database
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```
3. Open `.env` and verify the values. By default, it connects to a local MongoDB:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/enterprise-crm
   JWT_SECRET=supersecretkeyforproductioncrmsystem12345
   NODE_ENV=development
   ```

### 2. Seed the Database
Ensure MongoDB is running, then execute the seeding script to load the realistic business dataset (50 users, 1000 leads, 300 customers, 2000 activities, and 500 tasks):
```bash
npm run seed
```

### 3. Run the Backend API
Start the Node API server in development mode:
```bash
npm run dev
```
The server will bind to `http://localhost:5000`. You can inspect the health status at `http://localhost:5000/health`.

### 4. Run the Client App
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## 🛠️ Key Technical Implementations

### 🎨 Premium Dark Mode & Glassmorphism Design
The user interface supports instantaneous dark mode switching (state stored in `localStorage`). The styling uses harmonious, professional HSL custom variables (deep indigo accents, slate backgrounds, semantic status indicators) instead of generic bright tailwind colors, styled in a sleek card-based SaaS system.

### 🎯 Pure HTML5 Drag-and-Drop
To ensure compatibility in React 18 / strict mode (without bloating package size or using buggy libraries), both the **Kanban Sales Pipeline** and the **Tasks Status Columns** utilize native HTML5 Drag and Drop event parameters to trigger immediate database syncing and activity timeline logs.

### 🔎 Spotlight Command Search
Using a global command input in the top header, users can search across Leads, Customers, Tasks, and Users concurrently. Matches are returned in real-time, categorized, and allow immediate route redirects.

### 📥 Dynamic Excel/CSV Exporters
The reports interface handles direct spreadsheet formatting. The backend generates structured CSV data streams, and the frontend `/lib/api.ts` checks response headers, parses CSV objects, and launches dynamic, client-side downloading.
