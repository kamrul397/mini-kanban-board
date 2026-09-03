'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Board, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Plus, Layout, LogOut, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BoardsPage() {
    const { user, token, logout, isLoading } = useAuth();
    const [boards, setBoards] = useState<Board[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !token) {
            router.push('/login');
            return;
        }
        if (token) {
            fetchBoards();
        }
    }, [token, isLoading]);

    const fetchBoards = async () => {
        try {
            const data = await apiFetch<Board[]>('/boards');
            setBoards(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBoard = await apiFetch<Board>('/boards', {
                method: 'POST',
                body: JSON.stringify({ title, description }),
            });
            setShowModal(false);
            setTitle('');
            setDescription('');
            router.push(`/boards/${newBoard.id}`);
        } catch (err: any) {
            alert(err.message || 'Failed to create board');
        }
    };

    return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Layout className="w-8 h-8 text-indigo-400" />
                        My Kanban Boards
                    </h1>
                    <p className="text-slate-400 mt-1">Welcome back, {user?.name || user?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-medium transition"
                    >
                        <Plus className="w-5 h-5" /> New Board
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-medium text-slate-300 transition"
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map((b) => {
                    const isOwner = b.ownerId === user?.id;
                    return (
                        <Link
                            key={b.id}
                            href={`/boards/${b.id}`}
                            className="group p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 transition duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition">
                                        {b.title}
                                    </h3>
                                    <span
                                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${isOwner
                                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}
                                    >
                                        {isOwner ? 'Owner' : 'Shared'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                    {b.description || 'No description provided'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-4 border-t border-slate-700/50">
                                <Users className="w-4 h-4" />
                                <span>{b.members?.length ? `${b.members.length} members` : 'Private'}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-white">Create New Board</h2>
                        <form onSubmit={handleCreateBoard} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                    placeholder="e.g. Q3 Roadmap"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                    placeholder="Brief summary..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                                >
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
