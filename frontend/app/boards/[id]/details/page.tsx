'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board, User, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
    ArrowLeft,
    FolderKanban,
    Users,
    Search,
    Edit2,
    Trash2,
    Save,
    LogOut,
    Plus,
    Lock,
    Shield,
    Clock,
    Calendar,
    AlertTriangle,
    Check,
    X,
    Eye,
    Kanban,
    Mail,
    UserPlus,
    HelpCircle,
    Info,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

// Deterministic colorful avatar palette for realistic user display
const getAvatarGradient = (str: string = '') => {
    const gradients = [
        'from-indigo-600 to-violet-600 text-white shadow-indigo-500/25',
        'from-emerald-600 to-teal-600 text-white shadow-emerald-500/25',
        'from-rose-600 to-pink-600 text-white shadow-rose-500/25',
        'from-amber-600 to-orange-600 text-white shadow-amber-500/25',
        'from-sky-600 to-blue-600 text-white shadow-sky-500/25',
        'from-fuchsia-600 to-purple-600 text-white shadow-fuchsia-500/25',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
};

export default function BoardDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, token } = useAuth();
    const queryClient = useQueryClient();

    // Query board details with TanStack Query (0ms instant cache)
    const {
        data: board,
        isLoading: boardLoading,
        refetch: fetchBoard,
    } = useQuery<Board>({
        queryKey: ['board', id],
        queryFn: () => apiFetch<Board>(`/boards/${id}`),
        enabled: !!id,
    });

    // Query all registered users for collaborator invites
    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['users', user?.id],
        queryFn: () => apiFetch<User[]>('/users'),
        enabled: !!token && !!user?.id,
    });

    // Edit board state
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSavingBoard, setIsSavingBoard] = useState(false);

    // Invite state
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [userDirectorySearch, setUserDirectorySearch] = useState('');
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

    // Email format validator: must match user@domain.tld
    const isValidShareEmail = useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(shareEmail.trim());
    }, [shareEmail]);

    // Delete confirmation state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Populate form when board data arrives
    useEffect(() => {
        if (board) {
            setEditTitle(board.title);
            setEditDesc(board.description || '');
        }
    }, [board]);

    // Role identification
    const isOwner = board?.ownerId === user?.id;
    const isEditor = board?.members?.some((m) => m.userId === user?.id && m.role === 'EDITOR');
    const canShare = isOwner || isEditor;

    // Filter available users who can be invited (not owner, not already a member)
    const availableUsers = useMemo(() => {
        if (!board) return [];
        const existingUserIds = new Set([
            board.ownerId,
            ...(board.members?.map((m) => m.userId) || []),
        ]);
        const uninvited = allUsers.filter((u) => !existingUserIds.has(u.id));
        if (!userDirectorySearch.trim()) return uninvited;
        const q = userDirectorySearch.toLowerCase();
        return uninvited.filter(
            (u) =>
                (u.name && u.name.toLowerCase().includes(q)) ||
                u.email.toLowerCase().includes(q)
        );
    }, [allUsers, board, userDirectorySearch]);

    // Total tasks and columns calculation
    const totalColumns = board?.columns?.length || 0;
    const totalTasks = board?.columns?.reduce((acc, col) => acc + (col.tasks?.length || 0), 0) || 0;

    // --- Handlers ---

    const handleSaveBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwner || !editTitle.trim()) return;

        setIsSavingBoard(true);
        const trimmedTitle = editTitle.trim();
        const trimmedDesc = editDesc.trim();

        // Optimistic UI update in TanStack cache
        queryClient.setQueryData<Board>(['board', id], (old) =>
            old ? { ...old, title: trimmedTitle, description: trimmedDesc || null } : old
        );

        try {
            await apiFetch(`/boards/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: trimmedTitle,
                    description: trimmedDesc || null,
                }),
            });
            toast.success('Board details saved successfully');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update board');
            fetchBoard();
        } finally {
            setIsSavingBoard(false);
        }
    };

    const handleDirectInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canShare || !shareEmail.trim()) return;

        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string; membership: any }>(
                `/boards/${id}/share`,
                {
                    method: 'POST',
                    body: JSON.stringify({ email: shareEmail.trim(), role: shareRole }),
                }
            );
            toast.success(res.message || `Invited ${shareEmail}!`);
            setShareEmail('');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to invite user');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleQuickInvite = async (targetEmail: string, role: 'EDITOR' | 'VIEWER') => {
        if (!canShare) return;
        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string; membership: any }>(
                `/boards/${id}/share`,
                {
                    method: 'POST',
                    body: JSON.stringify({ email: targetEmail, role }),
                }
            );
            toast.success(res.message || `Invited ${targetEmail}!`);
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to invite user');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
        if (!isOwner || updatingMemberId === memberId) return;
        setUpdatingMemberId(memberId);

        // 1. Snapshot previous state for instant rollback if server fails
        const previousBoard = queryClient.getQueryData<Board>(['board', id]);

        // 2. Optimistically update local query cache (0ms instant visual change)
        queryClient.setQueryData<Board>(['board', id], (old) => {
            if (!old || !old.members) return old;
            return {
                ...old,
                members: old.members.map((m) =>
                    m.id === memberId ? { ...m, role: newRole } : m
                ),
            };
        });

        toast.success(`Role updated to ${newRole === 'EDITOR' ? 'Editor' : 'Viewer'}`);

        // 3. Persist in background
        try {
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            // Revert immediately if server rejects
            if (previousBoard) {
                queryClient.setQueryData(['board', id], previousBoard);
            }
            toast.error(err.message || 'Failed to update member role');
        } finally {
            setUpdatingMemberId(null);
        }
    };

    const handleRemoveOrLeave = async (memberId: string, identifier: string) => {
        const isSelf = board?.members?.find((m) => m.id === memberId)?.userId === user?.id;
        const previousBoard = queryClient.getQueryData<Board>(['board', id]);

        if (isSelf) {
            try {
                await apiFetch(`/boards/${id}/members/${memberId}`, {
                    method: 'DELETE',
                });
                toast.success('You have left the board');
                queryClient.invalidateQueries({ queryKey: ['boards'] });
                router.push('/boards');
            } catch (err: any) {
                toast.error(err.message || 'Failed to leave board');
            }
            return;
        }

        // Optimistically remove from list immediately (0ms)
        queryClient.setQueryData<Board>(['board', id], (old) => {
            if (!old || !old.members) return old;
            return {
                ...old,
                members: old.members.filter((m) => m.id !== memberId),
            };
        });
        toast.success(`Removed ${identifier} from board`);

        try {
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
        } catch (err: any) {
            if (previousBoard) {
                queryClient.setQueryData(['board', id], previousBoard);
            }
            toast.error(err.message || 'Failed to remove member');
        }
    };

    const handleDeleteBoard = async () => {
        if (!isOwner) return;
        setIsDeleting(true);
        try {
            await apiFetch(`/boards/${id}`, { method: 'DELETE' });
            toast.success(`Board "${board?.title}" deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            router.push('/boards');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete board');
            setIsDeleting(false);
        }
    };

    if (boardLoading && !board) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!board) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <FolderKanban className="w-16 h-16 text-slate-600 mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Board Not Found</h1>
                <p className="text-sm text-slate-400 mb-6">This board may have been deleted or you don't have permission.</p>
                <Link
                    href="/boards"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
                >
                    Return to Workspace
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 max-w-5xl mx-auto">
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
                <div className="flex items-center gap-3">
                    <Link
                        href="/boards"
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Back to All Boards"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-white tracking-tight">{board.title}</h1>
                            <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                                    isOwner
                                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                        : isEditor
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                            >
                                {isOwner ? '👑 Owner' : isEditor ? '✏️ Editor' : '👁️ Viewer'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Board Details & Collaborator Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href={`/boards/${id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20"
                    >
                        <Kanban className="w-4 h-4" /> Open Kanban Board
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Workflow Columns</p>
                        <p className="text-xl font-bold text-white">{totalColumns}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Active Tasks</p>
                        <p className="text-xl font-bold text-white">{totalTasks}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Members</p>
                        <p className="text-xl font-bold text-white">{1 + (board.members?.length || 0)}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* SECTION 1: Board Overview & Information */}
                <div className="p-6 md:p-8 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-indigo-400" /> General Information
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isOwner ? 'Edit your board name and description' : 'View board metadata and ownership'}
                            </p>
                        </div>
                    </div>

                    {isOwner ? (
                        <form onSubmit={handleSaveBoard} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Board Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                                    placeholder="e.g. Project Roadmap"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={4}
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                                    placeholder="Describe the purpose or team scope of this board..."
                                />
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSavingBoard}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSavingBoard ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    Board Title
                                </label>
                                <p className="text-base font-semibold text-white">{board.title}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    Description
                                </label>
                                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {board.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 2: Collaborators & Sharing */}
                <div className="p-6 md:p-8 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" /> Collaborator Directory & Access Control
                            </h2>
                            <span className="text-xs text-slate-400">
                                {1 + (board.members?.length || 0)} active members
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {canShare ? 'Invite registered team members and manage their roles' : 'View members and their permission levels'}
                        </p>
                    </div>

                    {/* How Sharing Works Guide Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                                <Info className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                                How Sharing & Collaboration Works
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-left">
                            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                                    1. User-Based Access
                                </span>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    Collaborators must have a registered account on the platform. They can sign up at any time via the register page.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                                    2. Group Task Tracking vs Stakeholder Showcases
                                </span>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    <strong className="text-emerald-300">Editor (Working Team):</strong> Invite a group of people to actively manage tasks, reorder cards, and coordinate everyday sprints together.<br />
                                    <strong className="text-amber-300">Viewer (Showcase Progress):</strong> Give stakeholders, managers, or clients safe real-time visibility to monitor delivery without risk of accidental changes.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
                                    3. Instant Synchronization
                                </span>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    Once invited, the board appears immediately on the collaborator's workspace dashboard with their assigned permissions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invite Section (for Owners & Editors) */}
                    {canShare && (
                        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5 text-indigo-400" /> Invite Collaborator
                                </h3>
                                <span className="text-[11px] text-slate-400">
                                    {availableUsers.length} registered users available
                                </span>
                            </div>

                            {/* Registered Users Quick-Pick List */}
                            <div>
                                <div className="relative mb-3">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={userDirectorySearch}
                                        onChange={(e) => setUserDirectorySearch(e.target.value)}
                                        placeholder="Search registered users by name or email..."
                                        className="w-full pl-9.5 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                                    />
                                    {userDirectorySearch && (
                                        <button
                                            type="button"
                                            onClick={() => setUserDirectorySearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 pr-1.5">
                                    {availableUsers.length > 0 ? (
                                        availableUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="group/user flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-150 gap-3 shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(u.email)} flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-md ring-2 ring-slate-900`}>
                                                        {(u.name || u.email).charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-100 group-hover/user:text-white transition truncate">
                                                            {u.name || u.email.split('@')[0]}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 group-hover/user:text-slate-300 transition truncate flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                                            <span>{u.email}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'EDITOR')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/25 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                                                        title="Invite as Editor"
                                                    >
                                                        <Shield className="w-3 h-3 text-emerald-400" />
                                                        <span>+ Editor</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'VIEWER')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/25 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                                                        title="Invite as Viewer"
                                                    >
                                                        <Eye className="w-3 h-3 text-sky-400" />
                                                        <span>+ Viewer</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                                            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
                                            <p className="text-xs text-slate-400 font-medium">
                                                {userDirectorySearch
                                                    ? 'No registered users match your search.'
                                                    : 'All registered users are already collaborators on this board!'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Direct Email Fallback */}
                            <div className="pt-4 border-t border-slate-800/80">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Direct Invite by Email
                                    </p>
                                    <span className="text-[10px] text-slate-500">For colleagues by email</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            className={`w-full pl-9 pr-7 py-2.5 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none text-xs transition ${
                                                shareEmail.trim().length > 0 && !isValidShareEmail
                                                    ? 'border-amber-500/50 focus:border-amber-500'
                                                    : isValidShareEmail
                                                    ? 'border-emerald-500/50 focus:border-emerald-500'
                                                    : 'border-slate-800 focus:border-indigo-500'
                                            }`}
                                            placeholder="Enter colleague's registered email address..."
                                        />
                                        {shareEmail && (
                                            <button
                                                type="button"
                                                onClick={() => setShareEmail('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                                title="Clear email"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Incomplete email hint */}
                                    {shareEmail.trim().length > 0 && !isValidShareEmail && (
                                        <p className="text-[11px] text-amber-400/80 pl-1 flex items-center gap-1">
                                            Please enter a valid email address (e.g. name@domain.com)
                                        </p>
                                    )}

                                    {/* Role action buttons - revealed only when a valid email is typed */}
                                    {isValidShareEmail && (
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 animate-fade-in shadow-sm shadow-emerald-500/5">
                                            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Invite as:
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={shareSubmitting}
                                                    onClick={() => handleQuickInvite(shareEmail.trim(), 'EDITOR')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                                                    title="Invite as Editor (can manage tasks & columns)"
                                                >
                                                    <Shield className="w-3 h-3 text-emerald-400" />
                                                    <span>+ Editor</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={shareSubmitting}
                                                    onClick={() => handleQuickInvite(shareEmail.trim(), 'VIEWER')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
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
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Current Collaborators
                        </h3>

                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 pr-1.5">
                            {/* Board Owner */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(board.owner?.email || '')} flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-md ring-2 ring-slate-900`}>
                                        {(board.owner?.name || board.owner?.email || 'O').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">
                                            {board.owner?.name || board.owner?.email?.split('@')[0]}
                                            {board.ownerId === user?.id && <span className="text-slate-400 font-normal ml-1.5">(You)</span>}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                            <Mail className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                            <span>{board.owner?.email}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider">
                                    👑 Owner
                                </span>
                            </div>

                            {/* Members */}
                            {board.members?.map((m) => {
                                const isCurrentUser = m.userId === user?.id;
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition gap-3 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(m.user.email)} flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-md ring-2 ring-slate-900`}>
                                                {(m.user.name || m.user.email).charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {m.user.name || m.user.email.split('@')[0]}
                                                    {isCurrentUser && <span className="text-slate-400 font-normal ml-1.5">(You)</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                                    <span>{m.user.email}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            {isOwner ? (
                                                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                                                    <button
                                                        type="button"
                                                        disabled={updatingMemberId === m.id}
                                                        onClick={() => handleUpdateRole(m.id, 'EDITOR')}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            m.role === 'EDITOR'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                                        }`}
                                                        title={m.role === 'EDITOR' ? 'Active: Editor' : 'Click to change to Editor'}
                                                    >
                                                        <Shield className="w-3 h-3 text-emerald-400" />
                                                        <span>Editor</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={updatingMemberId === m.id}
                                                        onClick={() => handleUpdateRole(m.id, 'VIEWER')}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            m.role === 'VIEWER'
                                                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                                        }`}
                                                        title={m.role === 'VIEWER' ? 'Active: Viewer' : 'Click to change to Viewer'}
                                                    >
                                                        <Eye className="w-3 h-3 text-sky-400" />
                                                        <span>Viewer</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                                                        m.role === 'EDITOR'
                                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                    }`}
                                                >
                                                    {m.role === 'EDITOR' ? '✏️ Editor' : '👁️ Viewer'}
                                                </span>
                                            )}

                                            {isCurrentUser ? (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveOrLeave(m.id, m.user.name || m.user.email)
                                                    }
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition cursor-pointer"
                                                    title="Leave this board"
                                                >
                                                    <LogOut className="w-3.5 h-3.5" />
                                                    <span>Leave</span>
                                                </button>
                                            ) : isOwner ? (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveOrLeave(m.id, m.user.name || m.user.email)
                                                    }
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Danger Zone (Owner Only) */}
                {isOwner && (
                    <div className="p-6 md:p-8 rounded-3xl bg-red-950/20 border border-red-900/30 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-400" /> Danger Zone
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Permanently delete this board and all of its workflow columns, tasks, and member memberships.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition cursor-pointer shrink-0"
                            >
                                Delete This Board
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Confirm Board Deletion */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 md:p-8 border border-red-900/40 shadow-2xl animate-modal">
                        <div className="flex items-center gap-3 text-red-400 mb-4">
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Delete Board</h2>
                        </div>
                        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                            Are you sure you want to permanently delete <strong className="text-white underline">{board.title}</strong>? All workflow columns, tasks, and member access will be permanently deleted. This action <strong>cannot be undone</strong>.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDeleteBoard}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-lg shadow-red-600/20 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
