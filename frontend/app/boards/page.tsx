'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Board, User, apiFetch } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Layout, LogOut, Users, Search, FolderKanban, Sparkles, ArrowUpRight, Edit2, Trash2, Settings, X, Info, Shield, Eye, CheckCircle2, Columns3, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function BoardsPage() {
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit Board state
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [editBoardTitle, setEditBoardTitle] = useState('');
    const [editBoardDesc, setEditBoardDesc] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Members Modal state
    const [selectedBoardForMembers, setSelectedBoardForMembers] = useState<Board | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    // Email format validator: must match user@domain.tld
    const isValidShareEmail = useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(shareEmail.trim());
    }, [shareEmail]);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/login');
        }
    }, [token, authLoading, router]);

    // TanStack Query: instant 0ms cached retrieval with background sync
    const {
        data: boards = [],
        isLoading: loading,
        refetch: fetchBoards,
    } = useQuery<Board[]>({
        queryKey: ['boards', user?.id],
        queryFn: () => apiFetch<Board[]>('/boards'),
        enabled: !!token && !!user?.id,
    });

    const [userDirectorySearch, setUserDirectorySearch] = useState('');
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

    // TanStack Query: fetch and cache all registered users
    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['users', user?.id],
        queryFn: () => apiFetch<User[]>('/users'),
        enabled: !!token && !!user?.id,
    });

    // Available users who are not yet on the selected board
    const availableUsers = useMemo(() => {
        if (!selectedBoardForMembers) return [];
        const existingUserIds = new Set([
            selectedBoardForMembers.ownerId,
            ...(selectedBoardForMembers.members?.map((m) => m.userId) || []),
        ]);
        const uninvited = allUsers.filter((u) => !existingUserIds.has(u.id));
        if (!userDirectorySearch.trim()) return uninvited;
        const q = userDirectorySearch.toLowerCase();
        return uninvited.filter(
            (u) =>
                (u.name && u.name.toLowerCase().includes(q)) ||
                u.email.toLowerCase().includes(q)
        );
    }, [allUsers, selectedBoardForMembers, userDirectorySearch]);

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            const newBoard = await apiFetch<Board>('/boards', {
                method: 'POST',
                body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
            });
            setShowModal(false);
            setTitle('');
            setDescription('');
            toast.success(`Board "${newBoard.title}" created!`);
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            router.push(`/boards/${newBoard.id}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create board');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEditBoard = (e: React.MouseEvent, board: Board) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBoard(board);
        setEditBoardTitle(board.title);
        setEditBoardDesc(board.description || '');
    };

    const handleUpdateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBoard || !editBoardTitle.trim()) return;
        setEditSubmitting(true);

        const trimmedTitle = editBoardTitle.trim();
        const trimmedDesc = editBoardDesc.trim();
        const boardId = editingBoard.id;

        // Optimistic cache update in TanStack Query (0ms)
        queryClient.setQueryData<Board[]>(['boards'], (prev = []) =>
            prev.map((b) =>
                b.id === boardId ? { ...b, title: trimmedTitle, description: trimmedDesc || null } : b
            )
        );
        setEditingBoard(null);
        toast.success('Board updated!');

        try {
            await apiFetch(`/boards/${boardId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: trimmedTitle,
                    description: trimmedDesc || null,
                }),
            });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            toast.error(err.message || 'Failed to update board');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardTitle: string) => {
        e.preventDefault();
        e.stopPropagation();

        const previousBoards = queryClient.getQueryData<Board[]>(['boards']) || [];
        queryClient.setQueryData<Board[]>(['boards'], (prev = []) =>
            prev.filter((b) => b.id !== boardId)
        );

        let isUndone = false;
        toast.success(`Board "${boardTitle}" deleted`, {
            action: {
                label: 'Undo',
                onClick: () => {
                    isUndone = true;
                    queryClient.setQueryData(['boards'], previousBoards);
                },
            },
        });

        try {
            await apiFetch(`/boards/${boardId}`, { method: 'DELETE' });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            if (!isUndone) {
                queryClient.setQueryData(['boards'], previousBoards);
                toast.error(err.message || 'Failed to delete board');
            }
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBoardForMembers || !shareEmail.trim()) return;
        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string; membership: any }>(
                `/boards/${selectedBoardForMembers.id}/share`,
                {
                    method: 'POST',
                    body: JSON.stringify({ email: shareEmail.trim(), role: shareRole }),
                }
            );
            toast.success(`Board shared with ${shareEmail}!`);
            setShareEmail('');
            const updatedMembership = res.membership;
            setSelectedBoardForMembers((prev) => {
                if (!prev) return null;
                const existing = prev.members || [];
                const updatedList = existing.some((m) => m.id === updatedMembership.id)
                    ? existing.map((m) => (m.id === updatedMembership.id ? updatedMembership : m))
                    : [...existing, updatedMembership];
                return { ...prev, members: updatedList };
            });
            fetchBoards();
        } catch (err: any) {
            toast.error(err.message || 'Failed to share board');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleQuickInvite = async (targetEmail: string, role: 'EDITOR' | 'VIEWER') => {
        if (!selectedBoardForMembers) return;
        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string; membership: any }>(
                `/boards/${selectedBoardForMembers.id}/share`,
                {
                    method: 'POST',
                    body: JSON.stringify({ email: targetEmail, role }),
                }
            );
            toast.success(res.message || `Board shared with ${targetEmail}!`);
            const updatedMembership = res.membership;
            if (updatedMembership) {
                setSelectedBoardForMembers((prev) => {
                    if (!prev) return null;
                    const existing = prev.members || [];
                    const updatedList = existing.some((m) => m.id === updatedMembership.id)
                        ? existing.map((m) => (m.id === updatedMembership.id ? updatedMembership : m))
                        : [...existing, updatedMembership];
                    return { ...prev, members: updatedList };
                });
            }
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            fetchBoards();
        } catch (err: any) {
            toast.error(err.message || 'Failed to invite user');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleUpdateMemberRole = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
        if (!selectedBoardForMembers || updatingMemberId === memberId) return;
        setUpdatingMemberId(memberId);

        // Optimistic update
        setSelectedBoardForMembers((prev) => {
            if (!prev || !prev.members) return prev;
            return {
                ...prev,
                members: prev.members.map((m) =>
                    m.id === memberId ? { ...m, role: newRole } : m
                ),
            };
        });

        try {
            await apiFetch(`/boards/${selectedBoardForMembers.id}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });
            toast.success(`Role updated to ${newRole === 'EDITOR' ? 'Editor' : 'Viewer'}`);
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update member role');
            fetchBoards();
        } finally {
            setUpdatingMemberId(null);
        }
    };

    const handleRemoveMember = async (memberId: string, identifier: string) => {
        if (!selectedBoardForMembers) return;
        try {
            const isSelf = selectedBoardForMembers.members?.find((m) => m.id === memberId)?.userId === user?.id;
            await apiFetch(`/boards/${selectedBoardForMembers.id}/members/${memberId}`, {
                method: 'DELETE',
            });
            if (isSelf) {
                toast.success('You have left the board');
                setSelectedBoardForMembers(null);
                queryClient.invalidateQueries({ queryKey: ['boards'] });
                return;
            }
            toast.success(`Removed ${identifier} from board`);
            setSelectedBoardForMembers((prev) => {
                if (!prev || !prev.members) return prev;
                return {
                    ...prev,
                    members: prev.members.filter((m) => m.id !== memberId),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            toast.error(err.message || 'Failed to remove member');
        }
    };


    const filteredBoards = useMemo(() => {
        if (!searchQuery.trim()) return boards;
        const q = searchQuery.toLowerCase();
        return boards.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                (b.description && b.description.toLowerCase().includes(q))
        );
    }, [boards, searchQuery]);

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col justify-between">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-800/80">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                            <Layout className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                Kanban Workspace
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                                Signed in as <span className="text-slate-200 font-medium">{user?.name || user?.email}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <Link
                            href="/how-it-works"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs sm:text-sm"
                            title="Learn how this Kanban board works"
                        >
                            <HelpCircle className="w-4 h-4 text-indigo-400" />
                            <span>How it Works</span>
                        </Link>
                        <Link
                            href="/about"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs sm:text-sm"
                            title="About this project & architecture"
                        >
                            <Info className="w-4 h-4 text-violet-400" />
                            <span>About</span>
                        </Link>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-3.5 py-2 rounded-xl font-semibold text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer text-xs sm:text-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> New Board
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl font-medium text-slate-300 hover:text-white transition cursor-pointer text-xs sm:text-sm"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </header>

                {/* Filter & Search Bar (Only shown when boards exist or when searching) */}
                {(boards.length > 0 || searchQuery) && (
                    <div className="my-4 sm:my-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search boards by name or details..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                        <div className="text-xs text-slate-500 self-end sm:self-center font-medium">
                            {filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'} available
                        </div>
                    </div>
                )}

                {/* Skeleton Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 my-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 animate-pulse flex flex-col justify-between h-44"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="h-5 w-32 bg-slate-800 rounded-lg" />
                                        <div className="h-5 w-14 bg-slate-800 rounded-full" />
                                    </div>
                                    <div className="h-4 w-full bg-slate-800/60 rounded-md mb-2" />
                                    <div className="h-4 w-2/3 bg-slate-800/60 rounded-md" />
                                </div>
                                <div className="h-4 w-20 bg-slate-800/40 rounded pt-3 border-t border-slate-800/50" />
                            </div>
                        ))}
                    </div>
                ) : filteredBoards.length === 0 ? (
                    /* Responsive 1-Page Centered Empty State with Workflow Guide */
                    <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 max-w-3xl mx-auto w-full">
                        {/* Main Empty Welcome Card */}
                        <div className="w-full text-center mb-6 sm:mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 mb-3 text-indigo-400 shadow-md shadow-indigo-500/20">
                                <FolderKanban className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                {searchQuery ? 'No matching boards found' : 'Welcome to your Agile Workspace'}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                                {searchQuery
                                    ? `We couldn't find any boards matching "${searchQuery}". Try a different keyword.`
                                    : 'A simple, real-time board to organize your workflows from backlog to done.'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-4 sm:mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 rounded-xl font-semibold text-white transition shadow-lg shadow-indigo-600/25 text-xs sm:text-sm cursor-pointer active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Create Your First Board
                                </button>
                            )}
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer"
                                >
                                    Clear search filter
                                </button>
                            )}
                        </div>

                        {/* 3-Step Guided Overview (Compact & One-Page Friendly) */}
                        {!searchQuery && (
                            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5 text-left group hover:border-slate-700 transition">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
                                        1
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                                            Create a Board
                                        </h4>
                                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
                                            Set up a project workspace with title & purpose.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5 text-left group hover:border-slate-700 transition">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 font-bold text-xs">
                                        2
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                                            Add & Move Tasks
                                        </h4>
                                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
                                            Add cards and drag them across Todo, In Progress & Done.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5 text-left group hover:border-slate-700 transition">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                                        3
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                                            Invite & Collaborate
                                        </h4>
                                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
                                            Share your board with team members and assign tasks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                /* Boards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBoards.map((b) => {
                        const isOwner = b.ownerId === user?.id;
                        return (
                            <div
                                key={b.id}
                                className="group relative p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <Link href={`/boards/${b.id}`} className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition line-clamp-1 flex items-center gap-1.5">
                                                {b.title}
                                                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-indigo-400" />
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span
                                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                                                    isOwner
                                                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                }`}
                                            >
                                                {isOwner ? 'Owner' : 'Shared'}
                                            </span>
                                            <div className="flex items-center gap-1 pl-1">
                                                <Link
                                                    href={`/boards/${b.id}/details`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer shadow-sm"
                                                    title="View Board Details"
                                                >
                                                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span>Details</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/boards/${b.id}`}>
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
                                            {b.description || 'No description provided'}
                                        </p>
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedBoardForMembers(b);
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-800 hover:text-indigo-300 transition text-slate-400 cursor-pointer"
                                        title="Click to view board members"
                                    >
                                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="font-medium underline underline-offset-2 decoration-slate-700 hover:decoration-indigo-400">
                                            {b.members?.length ? `${b.members.length} ${b.members.length === 1 ? 'member' : 'members'}` : 'Private'}
                                        </span>
                                    </button>
                                    <Link
                                        href={`/boards/${b.id}`}
                                        className="text-slate-500 group-hover:text-slate-400 transition text-[11px]"
                                    >
                                        View Board →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Create Board */}
            {showModal && (
                <div 
                    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !submitting) setShowModal(false);
                    }}
                >
                    <div className="w-full max-w-lg bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-indigo-950/40 animate-modal relative overflow-hidden flex flex-col">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 mb-6 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Create New Board</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Setup a kanban workspace to plan and track tasks</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer disabled:opacity-50"
                                title="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Starter Templates */}
                        <div className="mb-5">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Quick Suggestions
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: '🚀 Product Launch', desc: 'Manage MVP milestones, features, and release schedule' },
                                    { label: '🐛 Bug Tracker', desc: 'Log, prioritize, and resolve application bugs' },
                                    { label: '✨ Sprint Backlog', desc: 'Track sprint user stories, in-progress tasks, and review' },
                                    { label: '📋 Daily Tasks', desc: 'Personal productivity board for daily goals and todos' },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => {
                                            setTitle(preset.label.replace(/^[\p{Emoji}\s]+/u, ''));
                                            setDescription(preset.desc);
                                        }}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition cursor-pointer"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateBoard} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Board Title <span className="text-indigo-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">{title.length}/60</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength={60}
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                                    placeholder="e.g. Mobile App Redesign"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">{description.length}/200</span>
                                </div>
                                <textarea
                                    rows={3}
                                    maxLength={200}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition resize-none"
                                    placeholder="Brief goals, context, and focus areas for this board..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80 mt-6">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-95"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating Board...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            <span>Create Board</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Board */}
            {editingBoard && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-900/90 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal relative">
                        <h2 className="text-xl font-bold text-white mb-1">Edit Board</h2>
                        <p className="text-xs text-slate-400 mb-6">Update board title and description</p>
                        
                        <form onSubmit={handleUpdateBoard} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Board Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={editBoardTitle}
                                    onChange={(e) => setEditBoardTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={editBoardDesc}
                                    onChange={(e) => setEditBoardDesc(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                                    placeholder="Brief goals and summary for this project..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingBoard(null)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                                >
                                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View & Manage Board Members */}
            {selectedBoardForMembers && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-lg bg-slate-900/95 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-indigo-400" /> {selectedBoardForMembers.title}
                            </h2>
                            <button
                                onClick={() => setSelectedBoardForMembers(null)}
                                className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Board details, collaborators, and access permissions</p>

                        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
                            {/* Board Overview & Description */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Board Description
                                    </span>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            selectedBoardForMembers.ownerId === user?.id
                                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                    >
                                        {selectedBoardForMembers.ownerId === user?.id ? 'You are the Owner' : 'Shared with you'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {selectedBoardForMembers.description || 'No description provided for this board.'}
                                </p>
                            </div>

                            {/* How Sharing Works Guide */}
                            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                                    <Info className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left min-w-0">
                                    <h4 className="text-xs font-semibold text-white">How Board Sharing Works</h4>
                                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                        Only registered users can be invited. Assign <strong className="text-emerald-300 font-semibold">Editor</strong> (working team members actively tracking tasks) or <strong className="text-amber-300 font-semibold">Viewer</strong> (safely showcase live progress to stakeholders).
                                    </p>
                                </div>
                            </div>
                            {/* Invite Section (Owner & Editors) */}
                            {(selectedBoardForMembers.ownerId === user?.id || selectedBoardForMembers.members?.some(m => m.userId === user?.id && m.role === 'EDITOR')) && (
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Invite Collaborator
                                        </h3>
                                        <span className="text-[11px] text-slate-400">
                                            {availableUsers.length} available to invite
                                        </span>
                                    </div>

                                    {/* Registered Users Quick-Pick List */}
                                    <div>
                                        <div className="relative mb-2.5">
                                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={userDirectorySearch}
                                                onChange={(e) => setUserDirectorySearch(e.target.value)}
                                                placeholder="Search registered users by name or email..."
                                                className="w-full pl-8.5 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                                            />
                                            {userDirectorySearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setUserDirectorySearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                            {availableUsers.length > 0 ? (
                                                availableUsers.map((u) => (
                                                    <div
                                                        key={u.id}
                                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800/60 hover:border-indigo-500/40 transition gap-2"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                                                                {(u.name || u.email).charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium text-white truncate">
                                                                    {u.name || u.email.split('@')[0]}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                disabled={shareSubmitting}
                                                                onClick={() => handleQuickInvite(u.email, 'EDITOR')}
                                                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium transition cursor-pointer"
                                                                title="Invite as Editor"
                                                            >
                                                                + Editor
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={shareSubmitting}
                                                                onClick={() => handleQuickInvite(u.email, 'VIEWER')}
                                                                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-medium transition cursor-pointer"
                                                                title="Invite as Viewer"
                                                            >
                                                                + Viewer
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[11px] text-slate-500 text-center py-2 italic">
                                                    {userDirectorySearch
                                                        ? 'No users match your search.'
                                                        : 'All registered users are already members of this board!'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Or invite manually by direct email */}
                                    <div className="pt-2.5 border-t border-slate-800/80">
                                        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">
                                            Or invite by direct email:
                                        </p>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={shareEmail}
                                                    onChange={(e) => setShareEmail(e.target.value)}
                                                    className={`w-full pl-3 pr-7 py-2 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none text-xs transition ${
                                                        shareEmail.trim().length > 0 && !isValidShareEmail
                                                            ? 'border-amber-500/50 focus:border-amber-500'
                                                            : isValidShareEmail
                                                            ? 'border-emerald-500/50 focus:border-emerald-500'
                                                            : 'border-slate-800 focus:border-indigo-500'
                                                    }`}
                                                    placeholder="Enter colleague's email address..."
                                                />
                                                {shareEmail && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShareEmail('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                                        title="Clear email"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Hint when typing an incomplete email */}
                                            {shareEmail.trim().length > 0 && !isValidShareEmail && (
                                                <p className="text-[11px] text-amber-400/80 pl-1 flex items-center gap-1">
                                                    Please enter a valid email address (e.g. name@domain.com)
                                                </p>
                                            )}

                                            {/* Role action buttons - active and visible only when a VALID email is entered */}
                                            {isValidShareEmail && (
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 animate-fade-in shadow-sm shadow-emerald-500/5">
                                                    <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Invite as:
                                                    </span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={shareSubmitting}
                                                            onClick={() => handleQuickInvite(shareEmail.trim(), 'EDITOR')}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                                                            title="Invite as Editor (can create and move tasks)"
                                                        >
                                                            <Shield className="w-3 h-3 text-emerald-400" />
                                                            <span>+ Editor</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={shareSubmitting}
                                                            onClick={() => handleQuickInvite(shareEmail.trim(), 'VIEWER')}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                                                            title="Invite as Viewer (read-only access)"
                                                        >
                                                            <Eye className="w-3 h-3 text-amber-300" />
                                                            <span>+ Viewer</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Current Members List */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                    <span>Members ({1 + (selectedBoardForMembers.members?.length || 0)})</span>
                                    {selectedBoardForMembers.ownerId === user?.id && (
                                        <span className="text-[10px] text-indigo-400 lowercase font-normal">you can edit roles & remove</span>
                                    )}
                                </h3>

                                <div className="space-y-2">
                                    {/* Board Owner */}
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm">
                                                {(selectedBoardForMembers.owner?.name || selectedBoardForMembers.owner?.email || 'O').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {selectedBoardForMembers.owner?.name || selectedBoardForMembers.owner?.email?.split('@')[0]}
                                                    {selectedBoardForMembers.ownerId === user?.id && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{selectedBoardForMembers.owner?.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider shrink-0">
                                            Owner
                                        </span>
                                    </div>

                                    {/* Invited Members */}
                                    {selectedBoardForMembers.members?.map((m) => {
                                        const isOwner = selectedBoardForMembers.ownerId === user?.id;
                                        const isCurrentUser = m.userId === user?.id;
                                        return (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/80 transition"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 uppercase shrink-0">
                                                        {(m.user.name || m.user.email).charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-white truncate">
                                                            {m.user.name || m.user.email.split('@')[0]}
                                                            {isCurrentUser && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isOwner ? (
                                                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                                                            <button
                                                                type="button"
                                                                disabled={updatingMemberId === m.id}
                                                                onClick={() => handleUpdateMemberRole(m.id, 'EDITOR')}
                                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                                    m.role === 'EDITOR'
                                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                                                }`}
                                                                title={m.role === 'EDITOR' ? 'Active: Editor' : 'Click to make Editor'}
                                                            >
                                                                <Shield className="w-3 h-3 text-emerald-400" />
                                                                <span>Editor</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={updatingMemberId === m.id}
                                                                onClick={() => handleUpdateMemberRole(m.id, 'VIEWER')}
                                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                                    m.role === 'VIEWER'
                                                                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                                                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                                                }`}
                                                                title={m.role === 'VIEWER' ? 'Active: Viewer' : 'Click to make Viewer'}
                                                            >
                                                                <Eye className="w-3 h-3 text-sky-400" />
                                                                <span>Viewer</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                                                                m.role === 'EDITOR'
                                                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                            }`}
                                                        >
                                                            {m.role}
                                                        </span>
                                                    )}

                                                    {isCurrentUser ? (
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveMember(m.id, m.user.name || m.user.email)
                                                            }
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition cursor-pointer"
                                                            title="Leave this board"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" />
                                                            <span>Leave</span>
                                                        </button>
                                                    ) : isOwner ? (
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveMember(m.id, m.user.name || m.user.email)
                                                            }
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                                            title="Remove Member"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!selectedBoardForMembers.members || selectedBoardForMembers.members.length === 0) && (
                                        <p className="text-xs text-slate-500 text-center py-4">
                                            No additional collaborators yet.
                                            {selectedBoardForMembers.ownerId === user?.id && ' Use the form above to invite team members!'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-4">
                            <button
                                type="button"
                                onClick={() => setSelectedBoardForMembers(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: How It Works Guide */}
            {showGuideModal && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowGuideModal(false);
                    }}
                >
                    <div className="w-full max-w-2xl bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-indigo-950/40 animate-modal relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">How It Works</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">A complete guide to managing agile boards and collaborating</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGuideModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto space-y-4 pr-1 text-left flex-1 custom-scrollbar">
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">1</span>
                                    <h3 className="text-sm font-semibold text-white">Create Workspaces & Boards</h3>
                                </div>
                                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                                    Organize tasks by project. Each board starts with default workflow columns (<strong className="text-white">To Do</strong>, <strong className="text-white">In Progress</strong>, <strong className="text-white">Done</strong>) that you can customize or extend at any time.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-300 font-bold text-xs flex items-center justify-center">2</span>
                                    <h3 className="text-sm font-semibold text-white">Interactive Drag-and-Drop Tasks</h3>
                                </div>
                                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                                    Click into any board to add task cards. Reorder tasks within the same column or drag them across different workflow stages. The backend keeps order consistency using fractional indexing.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">3</span>
                                    <h3 className="text-sm font-semibold text-white">Invite Registered Collaborators</h3>
                                </div>
                                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                                    Boards are private by default. Owners and Editors can invite registered colleagues by email or pick them directly from the directory with distinct permissions (<strong className="text-emerald-300">Editor</strong> or <strong className="text-amber-300">Viewer</strong>).
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center">4</span>
                                    <h3 className="text-sm font-semibold text-white">Real-Time Search & Instant Caching</h3>
                                </div>
                                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                                    Use the instant search bar to find cards or boards by keywords. All updates reflect optimistically in 0ms with TanStack Query.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowGuideModal(false)}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: About Project */}
            {showAboutModal && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowAboutModal(false);
                    }}
                >
                    <div className="w-full max-w-2xl bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-violet-950/40 animate-modal relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">About Mini Kanban</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Full-Stack Engineering Challenge Architecture & Tech Stack</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAboutModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto space-y-4 pr-1 text-left flex-1 custom-scrollbar">
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tech Stack</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                        <p className="text-xs font-bold text-white">Next.js 16</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Frontend App Router</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                        <p className="text-xs font-bold text-white">Node / Express</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">TypeScript REST API</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                        <p className="text-xs font-bold text-white">PostgreSQL</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Prisma ORM</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                        <p className="text-xs font-bold text-white">Tailwind CSS</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Modern Dark UI</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Capabilities</h3>
                                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                                    <li><strong className="text-white">Access Control:</strong> Strict database authorization checks preventing cross-board data leaks.</li>
                                    <li><strong className="text-white">Drag & Drop Movement:</strong> Smooth reordering within and between columns with position consistency.</li>
                                    <li><strong className="text-white">Collaboration:</strong> Multi-user permissions with Owner, Editor, and Viewer access tiers.</li>
                                    <li><strong className="text-white">Instant Feedback:</strong> 0ms optimistic cache mutation with TanStack Query and Sonner toast alerts.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowAboutModal(false)}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
}

