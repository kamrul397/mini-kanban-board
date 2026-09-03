'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Layout, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck, Zap, Users } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 lg:p-8 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl -top-32 -left-32 pointer-events-none animate-pulse" />
            <div className="absolute w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl -bottom-32 -right-32 pointer-events-none animate-pulse" />

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-slate-900/80 backdrop-blur-2xl shadow-2xl border border-slate-800/90 overflow-hidden relative z-10 animate-modal">
                
                {/* Left Side: Showcase Feature Panel */}
                <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950/90 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
                    <div>
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Real-Time Kanban Platform</span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Mini Kanban</span>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed mb-8">
                            Experience effortless task coordination with instant drag-and-drop, role permissions, and live collaborator updates.
                        </p>

                        <div className="space-y-3.5">
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Smooth fractional-index drag & drop</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Editor & Viewer collaboration roles</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Live search & custom workflow stages</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Protected by JWT & secure session tokens</span>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
                        <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your workspaces</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer z-10"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-indigo-400" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group cursor-pointer text-sm"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Continue to Dashboard</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
                        <p className="text-xs text-slate-400">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


