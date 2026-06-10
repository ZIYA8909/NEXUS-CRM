# Nexus CRM 💼✨
> **Where relationships become growth.**

Nexus CRM is a high-fidelity, production-grade Enterprise Customer Relationship Management (CRM) platform. Designed for modern sales teams, it combines premium aesthetics, role-based workflows, and real-time business insights in a spacious, sidebar-free interface.

---

## 🎨 Design Philosophy & Aesthetics
* **Glassmorphic UI**: Sleek, transparent card elements with smooth animations, radial gradients, and responsive layouts.
* **Premium Dark Mode**: Native light/dark theme switching with customized HSL color tokens to protect eyes during long workflows.
* **Bento Navigation Hub**: A central hub deck featuring interactive flashcards that show real-time database KPIs and stats.

---

## ⚡ Core Features

### 🗂️ Central Navigation Deck
Instead of cluttered sidebars, users land on a clean, centralized workspace hub. The hub uses 7 responsive cards that display real-time preview data (such as active leads, pending tasks, and revenue status) fetched directly from the database APIs.

### 🔎 Spotlight Command Menu (`⌘K`)
Features a Raycast-style command menu triggered globally by pressing `⌘K`. Users can search leads, tasks, and team members simultaneously with real-time indexing, arrow key navigation, and quick-action commands (like theme toggle).

### 🎯 Native Drag-and-Drop Pipelines
Both the **Leads Sales Funnel** and the **Tasks Kanban Board** utilize native HTML5 Drag and Drop event parameters. This delivers smooth, library-free card dragging that instantly syncs status changes with the database.

### 📊 Analytics & Reporting
* Dynamic bento-grid charts representing active pipelines, win rates, and monthly revenues.
* A spreadsheet export engine that converts report audits into clean CSV formats for instant download.

### 🔒 Enterprise RBAC & Security
* **Role-Based Access Control (RBAC)**: Enforces capabilities across Admins, Sales Managers, and Sales Executives.
* **Security**: Secured using JWT (JSON Web Tokens), password hashing, Zod schema validation, and rate limiters to protect endpoints.

---

## 🛠️ The Tech Stack

### Frontend (Client)
* **Framework**: React 18, Vite, TypeScript
* **Styling**: Tailwind CSS (with custom spacing extensions), Lucide Icons
* **Charts**: Recharts

### Backend (Server)
* **Runtime**: Node.js, Express, TypeScript
* **Database**: MongoDB (Mongoose ODM)
* **Security & Auth**: JWT, Bcrypt.js, Express-Rate-Limit, Zod

---

## 🔑 Demo Access Credentials
For test runs, the system supports role-based access:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@enterprise.com` | `admin123` |
| **Sales Manager** | `manager1@enterprise.com` | `manager123` |
| **Sales Executive** | `exec1@enterprise.com` | `exec123` |

---

## 🚀 Deployed Environments
* **Frontend Site**: Deployed on [Vercel](https://vercel.com/)
* **Backend API Server**: Deployed on [Render](https://render.com/)
* **Database**: Hosted on [MongoDB Atlas Cloud](https://www.mongodb.com/products/platform/atlas-database)

## Try it out - https://nexus-crm-snowy-tau.vercel.app/

<img width="1918" height="1028" alt="Image" src="https://github.com/user-attachments/assets/0fbd5102-0f0c-4887-baa7-b841c42a1989" />
