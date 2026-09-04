'use client';

import Link from 'next/link';
import {
    Layout,
    Sparkles,
    ArrowRight,
    Target,
    Heart,
    CheckCircle2,
    Code2,
    Server,
    Database,
    Shield,
    Users,
    User,
    Eye,
    Briefcase,
    GraduationCap,
    CheckSquare,
    Cpu,
    Columns3,
    Compass
} from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30">
            {/* Header / Navbar */}
            <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/boards"
                        className="flex items-center gap-2.5 text-slate-300 hover:text-white transition group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition">
                            <Layout className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-base tracking-tight text-white">Mini Kanban</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/how-it-works"
                            className="text-xs sm:text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
                        >
                            How It Works
                        </Link>
                        <Link
                            href="/boards"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20 active:scale-95"
                        >
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 space-y-20">
                {/* Hero / Purpose Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Purpose-Built for All Ways of Working</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        One Workspace for Solo Productivity, Team Sprints & Progress Showcases
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        Mini Kanban is designed to be effortlessly versatile. Whether you are an individual mastering daily habits, a group collaborating as <strong className="text-emerald-400 font-semibold">Editors</strong>, or sharing live milestones with clients as <strong className="text-amber-400 font-semibold">Viewers</strong>, we bring calm, clarity, and focus to your tasks.
                    </p>
                </div>

                {/* THE 3 CORE PILLARS OF USE */}
                <div className="space-y-6">
                    <div className="text-center max-w-xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                            How People Use Mini Kanban
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Tailored for individual focus, collaborative team delivery, and safe stakeholder reporting.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Solo / Personal Task Management */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition shadow-xl space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold uppercase tracking-wider">
                                    Solo Productivity
                                </div>
                                <h3 className="text-base font-bold text-white tracking-tight">
                                    Individual Daily Management
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Organize your personal to-dos, study routines, side projects, and errands without distraction. Break big goals into manageable steps and enjoy the satisfaction of dragging cards to Done.
                                </p>
                            </div>

                            <ul className="text-xs text-slate-400 space-y-2 pt-3 border-t border-slate-800/80">
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span>Private, clutter-free personal space</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span>Instant visual clarity for everyday routines</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span>Zero learning curve — start in seconds</span>
                                </li>
                            </ul>
                        </div>

                        {/* 2. Group / Team Execution (Editor Role) */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
                                    Working Teams &bull; Editor Role
                                </div>
                                <h3 className="text-base font-bold text-white tracking-tight">
                                    Group Task Tracking
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Invite colleagues, classmates, sprint squads, or family members as Editors. The entire group tracks tasks together, adjusts priorities, and keeps collective momentum synchronized.
                                </p>
                            </div>

                            <ul className="text-xs text-slate-400 space-y-2 pt-3 border-t border-slate-800/80">
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Multi-user task creation and reordering</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Custom workflow stages for any sprint</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Seamless real-time synchronization</span>
                                </li>
                            </ul>
                        </div>

                        {/* 3. Stakeholder & Client Showcase (Viewer Role) */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
                                    Stakeholders &bull; Viewer Role
                                </div>
                                <h3 className="text-base font-bold text-white tracking-tight">
                                    Live Progress Showcases
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Show outside stakeholders, clients, managers, or teachers what you have accomplished. Viewers inspect live deliverables in real time with complete safety against unintended changes.
                                </p>
                            </div>

                            <ul className="text-xs text-slate-400 space-y-2 pt-3 border-t border-slate-800/80">
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Read-only inspection of cards and columns</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Protected against accidental edits or moves</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Replaces tedious status emails and slides</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* POPULAR USE CASES ACROSS DOMAINS */}
                <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-2">
                            <Compass className="w-3.5 h-3.5 text-violet-400" />
                            <span>Everyday Scenarios</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Adapts Naturally to Any Workflow
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-1">
                            From personal checklists to professional deliveries, Mini Kanban provides structure without unnecessary complexity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                                <CheckSquare className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-white">Daily Personal Habits</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Keep track of chores, fitness routines, personal errands, and reading lists with clean visual progression.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-white">Academic & Study Plans</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Coordinate group assignments, track semester milestones, and manage research papers stress-free.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-white">Freelance & Client Work</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Execute deliverables internally, then add the client as a Viewer so they see live progress with 0 confusion.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                                <Columns3 className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-white">Software Sprints</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Track bugs, features, and code reviews across stages: Backlog, In Progress, QA Testing, and Deployed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* DEDICATED TECHNOLOGIES USED SECTION */}
                <div className="pt-8 border-t border-slate-800/80 space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium">
                            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Architecture & Stack</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Technologies Used in This Project
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Under the hood, Mini Kanban is engineered with modern, production-grade tools designed for reliability, responsiveness, and clean code architecture.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Frontend */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Frontend Architecture</h3>
                                    <p className="text-xs text-slate-400">Next.js & Modern UI Toolkit</p>
                                </div>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-300 space-y-2.5 pt-2 border-t border-slate-800">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Next.js 16 (App Router):</strong> Modern server and client components with fast hydration and optimized routing.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Tailwind CSS:</strong> Utility-first responsive design with dark mode styling and smooth micro-animations.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">@hello-pangea/dnd:</strong> Accessible, fluid drag-and-drop sensor toolkit supporting responsive card moves.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Lucide React:</strong> Consistent, lightweight iconography for intuitive visual cues.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Backend */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Backend & API</h3>
                                    <p className="text-xs text-slate-400">Node.js, Express & TypeScript</p>
                                </div>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-300 space-y-2.5 pt-2 border-t border-slate-800">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Node.js & Express:</strong> High-throughput RESTful API with structured controllers, route handlers, and middleware.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">TypeScript:</strong> Strict type safety across endpoints, data payloads, and validation schemas.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Fractional Reordering:</strong> Midpoint indexing algorithm for stable O(1) card positioning.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">CORS & Cookie Parser:</strong> Secure cross-origin resource sharing and cookie handling.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Database */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Database & ORM</h3>
                                    <p className="text-xs text-slate-400">PostgreSQL & Prisma</p>
                                </div>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-300 space-y-2.5 pt-2 border-t border-slate-800">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">PostgreSQL:</strong> Battle-tested relational database with ACID guarantees, foreign keys, and indexes.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Prisma ORM:</strong> Declarative schema migrations, relational querying, and auto-generated type definitions.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Relational Integrity:</strong> Cascade deletions and referential checks across Users, Boards, Columns, and Cards.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Security */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Security & Access Control</h3>
                                    <p className="text-xs text-slate-400">Authentication & Roles</p>
                                </div>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-300 space-y-2.5 pt-2 border-t border-slate-800">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">JWT & Session Tokens:</strong> Secure token-based authentication with expiration and verification.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">Bcrypt Hashing:</strong> Salted password hashing ensuring user credentials are never stored in plaintext.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                                    <span><strong className="text-white">RBAC Permissions:</strong> Strict server-side validation enforcing Owner, Editor, and Viewer privileges.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Conversion CTA */}
                <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-violet-950/70 border border-indigo-500/30 text-center space-y-4 shadow-2xl">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Organize Your Tasks — Solo or with a Team
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                        Whether tracking personal daily routines, collaborating with your sprint team as Editors, or presenting results to stakeholders as Viewers, start in seconds.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                        <Link
                            href="/boards"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/30 active:scale-95"
                        >
                            <span>Open My Workspace</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
                Mini Kanban Board &bull; Full-Stack Engineering Challenge
            </footer>
        </div>
    );
}
