# Mini Kanban Board — Full-Stack Engineering Challenge

A high-performance, real-time collaborative Kanban board platform engineered for **Solo Productivity**, **Group Team Execution (Editor Role)**, and **Safe Stakeholder Progress Showcases (Viewer Role)**.

Built with **Next.js 16 (React 19)**, **Node.js & Express with TypeScript**, **PostgreSQL & Prisma ORM**, and containerized with **Docker & Docker Compose**.

---

## Table of Contents

1. [Project Overview & Philosophy](#project-overview--philosophy)
2. [The 3 Core Pillars of Use](#the-3-core-pillars-of-use)
3. [Everyday Scenarios & Domain Use Cases](#everyday-scenarios--domain-use-cases)
4. [Platform Workflow Guide (How It Works)](#platform-workflow-guide-how-it-works)
5. [Technical Architecture & Stack](#technical-architecture--stack)
6. [Fractional Indexing & Order Consistency Algorithm](#fractional-indexing--order-consistency-algorithm)
7. [Repository Structure](#repository-structure)
8. [Environment Variables](#environment-variables)
9. [Getting Started & Setup Guide](#getting-started--setup-guide)
   * [Demo / Example Login Credentials](#demo--example-login-credentials)
   * [Option A: Automated Setup (Docker Compose)](#option-a-automated-setup-docker-compose-recommended)
   * [Option B: Manual Local Setup](#option-b-manual-local-setup)
10. [REST API Endpoints Reference](#rest-api-endpoints-reference)
11. [Role-Based Access Control (RBAC) Matrix](#role-based-access-control-rbac-matrix)
12. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Project Overview & Philosophy

Modern project management tools are frequently burdened with bloated configuration menus, steep learning curves, slow load times, and distracting clutter. **Mini Kanban** cuts through that noise to provide a fluid, visually calm, and laser-focused task tracking experience.

### Core Design Principles
* **Zero Friction**: Jump straight into productivity without cumbersome configuration or steep onboarding.
* **Granular Visibility**: Differentiate between who works on tasks and who simply monitors deliverables.
* **Instant Feedback**: 0ms optimistic UI updates backed by immediate background persistence and rollback resilience.
* **Rock-Solid Ordering**: Mathematical fractional indexing algorithm preventing task position collisions and race conditions.

---

## The 3 Core Pillars of Use

Mini Kanban is tailored for three distinct interaction paradigms:

```
                  ┌──────────────────────────────────────────────┐
                  │              MINI KANBAN MODES               │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 ╔══════════════════════╗  ╔══════════════════════════╗  ╔══════════════════════════════╗
 ║      1. SOLO         ║  ║        2. GROUP          ║  ║        3. STAKEHOLDER        ║
 ║  Personal Management ║  ║ Team Execution (Editors) ║  ║  Progress Showcase (Viewers) ║
 ╚══════════════════════╝  ╚══════════════════════════╝  ╚══════════════════════════════╝
 • Private personal hub    • Collaborative team sprint  • Safe read-only inspection
 • Habit & study tracking  • Multi-user task creation    • Accidental-edit protected
 • Zero noise, pure focus  • Drag & drop synchronization• Replaces status meetings/slides
```

### 1. Solo Personal Management (Private Workspace)
* **Who it's for**: Individuals organizing daily life, personal errands, study schedules, fitness goals, and hobby projects.
* **Experience**: Private by default. Break daunting goals into actionable steps and enjoy the momentum of moving cards across columns to completion with zero distractions.

### 2. Group Team Execution (Editor Role)
* **Who it's for**: Agile development squads, student project groups, design teams, or cross-functional working partners.
* **Experience**: Board owners invite collaborators as **Editors**. All editors can create cards, update task descriptions, reorder tasks across custom workflow stages, and maintain shared momentum in real time.

### 3. Stakeholder Progress Showcase (Viewer Role)
* **Who it's for**: Clients, managers, instructors, or outside observers who need transparency into project velocity without touching the board.
* **Experience**: Stakeholders receive **Viewer** access with read-only badges and disabled drag handles. They can inspect card details, review completed milestones, and track deadlines with zero risk of accidental modifications.

---

## Everyday Scenarios & Domain Use Cases

| Scenario | Mode | How Mini Kanban Fits |
|---|:---:|---|
| **Personal Habits & Errand Tracking** | Solo | Organize weekly chores, reading lists, fitness routines, and personal projects with clean visual progression. |
| **Academic & Study Plans** | Solo / Group | Coordinate team course assignments, manage thesis milestones, and track research deliverables stress-free. |
| **Freelance & Client Delivery** | Group + Showcase | Freelancers manage sprints internally, then share the board with the client as a **Viewer** for 100% transparent delivery status. |
| **Agile Software Sprints** | Group | Engineers move features and bug fixes across custom stages: *Backlog*, *In Progress*, *In Review*, *QA Testing*, and *Done*. |

---

## Platform Workflow Guide (How It Works)

### Step 01: Create Workspaces & Auto-Generated Stages
* Users create dedicated workspaces with titles and descriptions.
* Every board automatically initializes with three standard workflow stages: **To Do**, **In Progress**, and **Done**.
* Users can add unlimited custom columns with one-click presets (*Backlog*, *In Review*, *QA Testing*, *Blocked*, etc.).

### Step 02: Interactive Drag & Drop Task Movement
* Create task cards with detailed descriptions.
* Drag tasks smoothly within the same column or across columns.
* Powered by accessible sensors (`@hello-pangea/dnd`) with full keyboard, mouse, and touch support.
* Fractional indexing calculates exact midpoint orders behind the scenes.

### Step 03: Granular Collaboration & Permission Sharing
* Boards are 100% private upon creation.
* Owners and Editors can invite registered users by email.
* Role-based permissions strictly control access:
  * **Owner**: Full board governance, role assignment, and board deletion.
  * **Editor**: Full read/write/drag capability on columns and tasks.
  * **Viewer**: Read-only inspection with drag-and-drop handles locked.

### Step 04: Real-Time Keyword Search & 0ms UI Sync
* Instant client-side search filters boards and task cards across titles and descriptions with zero page reloads.
* TanStack Query manages cache invalidation and optimistic mutations for instantaneous UI responsiveness.

---

## Technical Architecture & Stack

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS 16 FRONTEND                           │
│  (React 19, Tailwind CSS, @hello-pangea/dnd, TanStack Query, Sonner)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        HTTP REST API (JWT Bearer)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         EXPRESS 5 BACKEND API                          │
│     (TypeScript, Zod Validation, Auth Middleware, Permission Engine)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                               Prisma ORM
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         POSTGRESQL 16 DATABASE                         │
│       (Relational Tables, Foreign Keys, Unique Indexes, Cascades)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Tier | Technology | Purpose & Implementation |
|---|---|---|
| **Frontend** | **Next.js 16 (App Router)** | Modern server/client component model, route handlers, optimized rendering. |
| **Frontend** | **React 19** | Concurrent UI rendering with hooks and optimistic UI patterns. |
| **Frontend** | **Tailwind CSS** | Dark glassmorphism aesthetics, responsive layouts, and micro-interactions. |
| **Frontend** | **@hello-pangea/dnd** | Drag-and-drop sensor toolkit (fully compatible with React 19 and mobile). |
| **Frontend** | **TanStack Query (v5)** | Client caching, automatic cache invalidation, and optimistic state synchronization. |
| **Frontend** | **Sonner** | Clean toast notifications replacing intrusive browser alerts. |
| **Backend** | **Node.js & Express 5** | High-throughput REST API with structured controllers and route handlers. |
| **Backend** | **TypeScript 6** | Strict end-to-end typing across controllers, middlewares, and services. |
| **Backend** | **Zod** | Runtime request payload validation with declarative schemas. |
| **Database** | **PostgreSQL 16** | Battle-tested relational database with ACID guarantees. |
| **ORM** | **Prisma 7** | Type-safe schema modeling, automatic migrations, and relational integrity. |
| **DevOps** | **Docker & Compose** | Containerized multi-service orchestration with health checks. |

---

## Fractional Indexing & Order Consistency Algorithm

To reorder tasks within a column or across columns without re-indexing every card in the database, Mini Kanban utilizes **Floating-Point Fractional Indexing**:

```
[Task A] order: 1000.0
         order: 1500.0  ◄── (1000.0 + 2000.0) / 2  (New dropped position)
[Task B] order: 2000.0
[Task C] order: 3000.0
```

1. **Insert Between**: When a task is dropped between two tasks with orders prevOrder and nextOrder, its new order is computed as:
   `order = (prevOrder + nextOrder) / 2`
2. **Append to Bottom**: When placed at the end of a column: `order = prevOrder + 1000.0`.
3. **Prepend to Top**: When placed at the top of a column: `order = nextOrder / 2`.
4. **Empty Column**: When dropped into an empty column: `order = 1000.0`.

### Why This Matters:
* **O(1) Time Complexity**: Only the moved task's row is updated in PostgreSQL. Neighboring tasks remain completely untouched.
* **Zero Race Conditions**: Concurrent moves by different editors in other parts of the column do not conflict or cause index drift.

---

## Repository Structure

```
mini-kanban/
├── docker-compose.yml           # Multi-container orchestration (Postgres, Backend, Frontend)
├── README.md                    # Project documentation, architecture & guide
├── backend/
│   ├── Dockerfile               # Production Docker image for Express API
│   ├── .dockerignore            # Docker build ignore rules
│   ├── .env.example             # Backend environment variable template
│   ├── package.json             # Backend dependencies & scripts
│   ├── tsconfig.json            # TypeScript compiler configuration
│   ├── prisma/
│   │   └── schema.prisma        # Prisma relational models & migrations
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.ts       # Register, Login & JWT generation
│       │   ├── board.controller.ts      # Board CRUD, members & sharing
│       │   ├── column.controller.ts     # Column CRUD & auto-default stages
│       │   ├── task.controller.ts       # Task CRUD & fractional movement
│       │   └── user.controller.ts       # User directory lookup
│       ├── middlewares/
│       │   ├── auth.middleware.ts       # Bearer JWT verification
│       │   └── permission.helper.ts     # RBAC (Owner, Editor, Viewer) engine
│       ├── routes/                      # Express route endpoints
│       ├── test-api.ts                  # Backend automated integration test suite
│       └── index.ts                     # Express server bootstrap & middleware
└── frontend/
    ├── Dockerfile               # Production Docker image for Next.js web app
    ├── .dockerignore            # Docker build ignore rules
    ├── .env.example             # Frontend environment variable template
    ├── package.json             # Frontend dependencies & scripts
    ├── next.config.ts           # Next.js configuration
    ├── context/
    │   └── AuthContext.tsx      # Auth state, login/register/logout & session
    ├── lib/
    │   └── api.ts               # Typed fetch client with bearer interceptor
    └── app/
        ├── layout.tsx           # Global root layout with Sonner & Providers
        ├── page.tsx             # Landing / workspace redirect
        ├── login/               # Sign-in page
        ├── register/            # Account registration page
        ├── about/               # Purpose, philosophy & architecture page
        ├── how-it-works/        # Interactive guide & 4-step workflow page
        └── boards/              # Workspace dashboard & interactive Kanban boards
            ├── page.tsx         # User's boards dashboard
            └── [id]/
                ├── page.tsx     # Interactive Kanban board view (Drag-and-Drop)
                └── details/     # Comprehensive board settings & member control
```

---

## Environment Variables

### Backend (`backend/.env`)
Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=4000
DATABASE_URL="postgresql://kanban:kanban_password@localhost:5432/kanban_db?schema=public"
JWT_SECRET="your-super-secret-kanban-jwt-key"
```

### Frontend (`frontend/.env.local`)
Create `frontend/.env.local` (or copy from `frontend/.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Getting Started & Setup Guide

### Demo / Example Login Credentials

To explore and test the application immediately with pre-existing boards and sample data without registering:

| Field | Demo Credentials |
|---|---|
| **Email** | `kamal123@gmail.com` |
| **Password** | `Piyel123` |

*(Alternatively, you can register any new account on the [Registration Page](http://localhost:3000/register)).*

---

### Option A: Automated Setup (Docker Compose) — *Recommended*

Run the entire platform (PostgreSQL, Backend API, and Next.js Frontend) with a single command:

#### 1. Start Services
From the root `mini-kanban/` folder:
```bash
docker compose up --build
```
*(Add `-d` to run containers in the background)*

#### 2. Access the Applications
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:4000/api](http://localhost:4000/api)
* **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
* **PostgreSQL Database**: Port `5432` (`kanban_db`)

#### 3. Stop Services
```bash
docker compose down
```
*(To remove database volumes for a clean slate: `docker compose down -v`)*

---

### Option B: Manual Local Setup

#### Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL**: v14.x or higher running locally (or via Docker)

#### 1. Database Setup
Create the PostgreSQL database:
```sql
CREATE DATABASE kanban_db;
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Push Prisma schema to the database & generate client
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```
The backend will be running on `http://localhost:4000/api`.

#### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
The frontend will be running on `http://localhost:3000`.

---

## REST API Endpoints Reference

All `/api/boards`, `/api/columns`, `/api/tasks`, and `/api/users` endpoints require a Bearer token: `Authorization: Bearer <JWT>`.

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`name`, `email`, `password`) | Public |
| `POST` | `/api/auth/login` | Sign in and retrieve JWT token | Public |

### Boards & Workspaces
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/boards` | List all boards owned by or shared with user | Authenticated |
| `POST` | `/api/boards` | Create a board (auto-generates *To Do*, *In Progress*, *Done*) | Authenticated |
| `GET` | `/api/boards/:id` | Get full board (columns, tasks, members) with order sorting | Owner / Member |
| `PATCH` | `/api/boards/:id` | Update board title and description | Owner / Editor |
| `DELETE` | `/api/boards/:id` | Permanently delete a board and its cascade items | Owner Only |

### Board Collaborators & Sharing
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/boards/:id/share` | Invite a user by email (`email`, `role: EDITOR \| VIEWER`) | Owner / Editor |
| `PATCH` | `/api/boards/:id/members/:memberId` | Update member role (`role: EDITOR \| VIEWER`) | Owner Only |
| `DELETE` | `/api/boards/:id/members/:memberId` | Remove collaborator from board or leave board | Owner / Member Self |

### Columns (Workflow Stages)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/columns` | Create new column (`boardId`, `title`) | Owner / Editor |
| `PATCH` | `/api/columns/:id` | Update column title or order | Owner / Editor |
| `DELETE` | `/api/columns/:id` | Delete column and its tasks | Owner / Editor |

### Tasks & Fractional Movement
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/tasks` | Create task in column (`columnId`, `title`, `description`) | Owner / Editor |
| `PATCH` | `/api/tasks/:id` | Update task title and description | Owner / Editor |
| `DELETE` | `/api/tasks/:id` | Delete task card | Owner / Editor |
| `PATCH` | `/api/tasks/:id/move` | Move task within or across columns (`targetColumnId`, `positionIndex` or `targetOrder` or `prevTaskId` & `nextTaskId`) | Owner / Editor |

### Users & Health
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List registered users for sharing autocompletion | Authenticated |
| `GET` | `/api/health` | API status and server diagnostics | Public |

---

## Role-Based Access Control (RBAC) Matrix

Server-side authorization is strictly verified on every single mutation and query:

| Capability | Board Owner 👑 | Team Editor 🛡️ | Stakeholder Viewer 👁️ |
|---|:---:|:---:|:---:|
| View Board, Columns & Tasks | ✅ | ✅ | ✅ |
| Inspect Task Details Modal | ✅ | ✅ | ✅ |
| Drag & Drop Task Movement | ✅ | ✅ | ❌ *(locked)* |
| Create, Edit & Delete Tasks | ✅ | ✅ | ❌ |
| Create, Rename & Delete Columns | ✅ | ✅ | ❌ |
| Invite Collaborators via Email | ✅ | ✅ | ❌ |
| Change Member Roles | ✅ | ❌ | ❌ |
| Remove Members | ✅ *(any member)* | ❌ | ❌ *(can leave)* |
| Edit Board Title & Description | ✅ | ✅ | ❌ |
| Permanently Delete Board | ✅ | ❌ | ❌ |

---

## Testing & Quality Assurance

### 1. Build Verification
Both applications compile cleanly with strict TypeScript type checks:

```bash
# Verify backend TypeScript compilation
cd backend && npm run build

# Verify frontend Next.js production build
cd frontend && npm run build
```

### 2. Backend Automated Integration Tests
An automated end-to-end integration test is provided in `backend/src/test-api.ts`. It executes:
1. User registration & login with JWT generation
2. Board creation with default *To Do*, *In Progress*, *Done* columns
3. Task creation in columns
4. Cross-column task movement with fractional indexing calculation
5. Full board retrieval with verified ordering

To run against a live server:
```bash
cd backend
npx tsx src/test-api.ts
```

---

## Summary of Assessment Deliverables

* **Single Repository**: Clean monorepo structure containing both `frontend` and `backend` directories.
* **Full CRUD & Drag-and-Drop**: Interactive board with `@hello-pangea/dnd` and fractional indexing.
* **Access Control & Permissions**: Rigorous Owner / Editor / Viewer RBAC with cross-board movement security checks.
* **Docker Support**: Ready-to-run `docker-compose.yml` with health checks and multi-stage container builds.
* **Documentation**: Full project overview, 3 core pillars, domain use cases, workflow guide, schema, and API reference.
