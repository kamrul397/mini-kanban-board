# Mini Kanban Board — Full-Stack Engineering Challenge

A full-stack, real-time collaborative Kanban board application engineered for **solo task management**, **group team execution (Editors)**, and **safe stakeholder progress showcases (Viewers)**.

Built with **Next.js 16 (React 19)**, **Node.js & Express with TypeScript**, **PostgreSQL & Prisma ORM**, and containerized with **Docker**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features & Collaboration Model](#key-features--collaboration-model)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Environment Variables](#environment-variables)
6. [Local Setup Instructions (Manual)](#local-setup-instructions-manual)
7. [Docker Setup Instructions (Automated)](#docker-setup-instructions-automated)
8. [Database Schema & Data Architecture](#database-schema--data-architecture)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Access Control & Permission Matrix](#access-control--permission-matrix)

---

## Project Overview

Modern productivity tools are often overloaded with confusing settings, steep onboarding, and slow interfaces. **Mini Kanban** eliminates clutter and brings visual clarity to work.

### 3 Core Interaction Modes
1. **Solo Personal Management**: An individual managing daily errands, study schedules, fitness routines, and personal projects in a private, distraction-free space.
2. **Group Task Tracking (Editor Role)**: An agile sprint squad, study group, or working team collaborating on a shared board. All editors can create cards, drag tasks between workflow columns, and track progress together in real time.
3. **Stakeholder Progress Showcase (Viewer Role)**: Demonstrate project momentum and deliverables to clients, managers, instructors, or outside observers safely with read-only visibility and zero risk of accidental modifications.

---

## Key Features & Collaboration Model

* **Token-Based Authentication**: Secure JWT user registration and login with bcrypt salted password hashing.
* **Granular Role-Based Access Control (RBAC)**:
  - **Owner**: Full administrative control over the board, members, settings, and deletion.
  - **Editor**: Working group members who can create, edit, move, and delete tasks and columns.
  - **Viewer**: Read-only access to inspect cards and observe progress safely.
* **Interactive Drag-and-Drop Task Movement**:
  - Drag tasks smoothly within the same column or across different columns.
  - Rock-solid order consistency using fractional indexing (midpoint position calculation).
* **Customizable Workflow Columns**: Add, rename, and delete workflow stages (e.g. *Backlog*, *In Progress*, *QA Testing*, *Done*) with one-click presets.
* **Instant Search & Real-Time Sync**: Filter boards and task cards in 0ms with optimistic UI caching.
* **Clean Dark Glassmorphism UI**: High-end modern design built with Tailwind CSS and Lucide icons.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, `@hello-pangea/dnd`, TanStack Query, Sonner |
| **Backend** | Node.js, Express 5, TypeScript, Zod validation, CORS |
| **Database & ORM** | PostgreSQL 16, Prisma ORM (relational modeling, migrations, referential integrity) |
| **DevOps & Containers** | Docker, Docker Compose, Multi-stage builds |

---

## Repository Structure

```
mini-kanban/
├── docker-compose.yml           # Multi-container orchestration (Postgres, Backend, Frontend)
├── README.md                    # Project documentation and setup guide
├── backend/
│   ├── Dockerfile               # Production Docker image for backend API
│   ├── .dockerignore            # Build ignore rules
│   ├── .env.example             # Sample environment variables for backend
│   ├── package.json             # Backend dependencies & scripts
│   ├── tsconfig.json            # TypeScript configuration
│   ├── prisma/
│   │   └── schema.prisma        # Prisma data models & relations
│   └── src/
│       ├── controllers/         # Request handlers (auth, boards, columns, tasks, members)
│       ├── middleware/          # Auth JWT verification & error middleware
│       ├── routes/              # Express route definitions
│       └── index.ts             # Express server entrypoint
└── frontend/
    ├── Dockerfile               # Production Docker image for Next.js frontend
    ├── .dockerignore            # Build ignore rules
    ├── .env.example             # Sample environment variables for frontend
    ├── package.json             # Frontend dependencies & scripts
    ├── next.config.ts           # Next.js configuration
    └── app/
        ├── about/               # Dedicated About & Architecture page
        ├── how-it-works/        # Dedicated Platform Guide page
        ├── login/               # Authentication sign-in page
        ├── register/            # Account registration page
        └── boards/              # Workspace dashboard & interactive Kanban boards
```

---

## Environment Variables

### Backend (`backend/.env`)
Copy the sample file:
```bash
cp backend/.env.example backend/.env
```
Contents:
```env
PORT=4000
DATABASE_URL="postgresql://kanban:kanban_password@localhost:5432/kanban_db?schema=public"
JWT_SECRET="your-super-secret-kanban-jwt-key"
```

### Frontend (`frontend/.env.local`)
Copy the sample file:
```bash
cp frontend/.env.example frontend/.env.local
```
Contents:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Local Setup Instructions (Manual)

### Prerequisites
* **Node.js**: v20.x or later
* **npm**: v10.x or later
* **PostgreSQL**: v14.x or later running locally (or via Docker)

### 1. Database Setup
Ensure your PostgreSQL server is running and create the database:
```sql
CREATE DATABASE kanban_db;
```
*(Alternatively, use Docker to spin up just the database: `docker compose up postgres -d`)*

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client & push schema to database
npx prisma generate
npx prisma db push

# Start the backend development server
npm run dev
```
The backend API will run on `http://localhost:4000/api`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
The frontend web application will run on `http://localhost:3000`.

---

## Docker Setup Instructions (Automated)

You can run the complete platform (PostgreSQL database, Node.js backend, and Next.js frontend) with a single command using Docker Compose.

### Prerequisites
* Install and open **Docker Desktop** (or have Docker Engine running).

### 1. Start All Services
From the root directory:
```bash
docker compose up --build
```

### 2. Access the Application
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:4000/api](http://localhost:4000/api)
* **PostgreSQL Database**: Port `5432`

### 3. Stop All Services
```bash
docker compose down
```
To remove persistent database volumes as well:
```bash
docker compose down -v
```

---

## Database Schema & Data Architecture

```prisma
model User {
  id        String        @id @default(uuid())
  email     String        @unique
  password  String
  name      String?
  boards    Board[]       @relation("BoardOwner")
  members   BoardMember[]
  tasks     Task[]        @relation("TaskAssignee")
  createdAt DateTime      @default(now())
}

model Board {
  id          String        @id @default(uuid())
  title       String
  description String?
  ownerId     String
  owner       User          @relation("BoardOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  columns     Column[]
  members     BoardMember[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model BoardMember {
  id        String   @id @default(uuid())
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @default(VIEWER) // OWNER, EDITOR, VIEWER
  createdAt DateTime @default(now())

  @@unique([boardId, userId])
}

model Column {
  id        String   @id @default(uuid())
  title     String
  order     Float
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  order       Float
  columnId    String
  column      Column   @relation(fields: [columnId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?    @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}
```

---

## API Endpoints Reference

### Authentication
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Sign in and receive JWT token
* `GET /api/auth/me` — Retrieve current authenticated user profile

### Boards
* `GET /api/boards` — List all boards owned by or shared with the user
* `POST /api/boards` — Create a new board (auto-generates *To Do*, *In Progress*, *Done* columns)
* `GET /api/boards/:id` — Get full board details (columns, tasks, members)
* `PATCH /api/boards/:id` — Update board title or description (Owner & Editors)
* `DELETE /api/boards/:id` — Delete a board (Owner only)

### Board Sharing & Members
* `GET /api/boards/:id/members` — List board collaborators and user directory
* `POST /api/boards/:id/share` — Invite a registered user as Editor or Viewer
* `PATCH /api/boards/:id/members/:memberId` — Change member role (Owner only)
* `DELETE /api/boards/:id/members/:memberId` — Remove member or leave board

### Columns & Workflow Stages
* `POST /api/boards/:id/columns` — Create a new workflow stage
* `PATCH /api/boards/:id/columns/:colId` — Rename a column
* `DELETE /api/boards/:id/columns/:colId` — Delete a column and its tasks

### Tasks & Fractional Drag Reordering
* `POST /api/boards/:id/columns/:colId/tasks` — Create a new task
* `PATCH /api/boards/:id/tasks/:taskId` — Update task details
* `PATCH /api/boards/:id/tasks/:taskId/move` — Move task within or across columns
  * **Payload**: `{ "targetColumnId": "uuid", "newOrder": 2048.5 }`
* `DELETE /api/boards/:id/tasks/:taskId` — Delete a task card

---

## Access Control & Permission Matrix

| Capability | Board Owner 👑 | Team Editor 🛡️ | Stakeholder Viewer 👁️ |
|---|:---:|:---:|:---:|
| View Board, Columns & Tasks | ✅ | ✅ | ✅ |
| Click to Read Task Details | ✅ | ✅ | ✅ |
| Drag & Drop Task Movement | ✅ | ✅ | ❌ |
| Create, Edit & Delete Tasks | ✅ | ✅ | ❌ |
| Add & Delete Workflow Columns | ✅ | ✅ | ❌ |
| Invite Registered Collaborators | ✅ | ✅ | ❌ |
| Change Member Roles / Remove Members | ✅ | ❌ | ❌ |
| Rename Board & Edit Description | ✅ | ✅ | ❌ |
| Permanently Delete Board | ✅ | ❌ | ❌ |

---

## License
Created for the **Webbriks Technical Assessment — Full-Stack Engineering Challenge**.
