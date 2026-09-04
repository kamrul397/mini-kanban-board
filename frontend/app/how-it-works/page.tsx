'use client';

import Link from 'next/link';
import {
    Layout,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    User,
    Users,
    Eye,
    CheckSquare,
    Columns3,
    Search,
    Shield
} from 'lucide-react';

export default function HowItWorksPage() {
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
                            href="/about"
                            className="text-xs sm:text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
                        >
                            About Project
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

            {/* Hero Section */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 space-y-16">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Platform Guide & Workflow</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        How Mini Kanban Works
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                        A practical guide to managing personal to-dos alone, tracking group projects with teammates as Editors, and showcasing live milestones safely to Viewers.
                    </p>
                </div>

                {/* 3 Interaction Modes Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">1. Solo Mode</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">Manage Daily Life Alone</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Organize your personal tasks, errands, and study routines in a private board with complete focus and zero noise.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">2. Group Editor Mode</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">Track Tasks with Your Team</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Invite your squad or study group as Editors to simultaneously create cards, drag tasks, and coordinate shared work.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">3. Viewer Showcase Mode</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">Show Progress to Stakeholders</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Add clients, managers, or teachers as Viewers so they inspect live deliverables with zero risk of accidental changes.
                        </p>
                    </div>
                </div>

                {/* 4 Core Workflow Stages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1 */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                            01
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                                Create Workspaces for Solo or Team Goals
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Start by creating a board for your specific goal — whether a solo daily habit tracker, student course planner, or team sprint. Every new board automatically generates default workflow columns: <strong className="text-white">To Do</strong>, <strong className="text-white">In Progress</strong>, and <strong className="text-white">Done</strong>.
                            </p>
                        </div>
                        <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Pre-configured with one-click starter suggestions</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Customizable board titles, descriptions, and workflow stages</span>
                            </li>
                        </ul>
                    </div>

                    {/* Step 2 */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-lg">
                            02
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                                Add & Drag Tasks Interactively
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Create task cards with detailed descriptions. Grab any card and drag it smoothly between columns as your work progresses. The system calculates fractional ordering indices behind the scenes to guarantee rock-solid positioning without race conditions.
                            </p>
                        </div>
                        <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Smooth reordering within the same column</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Cross-column movement with instant visual feedback</span>
                            </li>
                        </ul>
                    </div>

                    {/* Step 3 */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                            03
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                                Solo Privacy, Group Work & Showcases
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                By default, your boards are 100% private to you. Whenever you wish to share, invite collaborators with tailored permissions:
                            </p>
                        </div>
                        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>Editor Role (Group Task Tracking)</span>
                                </div>
                                <p className="text-slate-300 text-[11px] leading-relaxed pl-3.5">
                                    Invite teammates, sprint partners, or family as Editors. Everyone can create, edit, move, and complete tasks simultaneously on the shared board.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span>Viewer Role (Showcase Progress Safely)</span>
                                </div>
                                <p className="text-slate-300 text-[11px] leading-relaxed pl-3.5">
                                    Invite clients, managers, or instructors as Viewers. They gain complete real-time visibility into finished tasks and deliverables with zero risk of edits.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-lg">
                            04
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                                Real-Time Search & Instant UI Sync
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Use the search bar to perform instant keyword filtering across board titles and task card contents without page reloads. All modifications update the UI in 0ms using optimistic caching, keeping the interface snappy and responsive.
                            </p>
                        </div>
                        <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Zero-delay optimistic updates with rollback protection</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Instant keyword search across all cards</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom CTA Card */}
                <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-violet-950/60 border border-indigo-500/30 text-center space-y-4 shadow-2xl">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Ready to organize your workflow?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                        Start managing your daily personal tasks, collaborate with your working squad as Editors, or showcase live deliverables to Viewers.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                        <Link
                            href="/boards"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/30 active:scale-95"
                        >
                            <span>Go to My Workspace</span>
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
