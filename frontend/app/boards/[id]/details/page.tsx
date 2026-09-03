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
    Kanban
} from 'lucide-react';
import { toast } from 'sonner';

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
    const currentMember = board?.members?.find((m) => m.userId === user?.id);
    const isEditor = !isOwner && currentMember?.role === 'EDITOR';
    const isViewer = !isOwner && currentMember?.role === 'VIEWER';
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
            toast.success(res.message || `Board shared with ${shareEmail}!`);
            setShareEmail('');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to share board');
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
        if (!isOwner) return;
        try {
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });
            toast.success('Collaborator role updated');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update member role');
        }
    };

    const handleRemoveOrLeave = async (memberId: string, identifier: string) => {
        const isSelf = board?.members?.find((m) => m.id === memberId)?.userId === user?.id;
        try {
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'DELETE',
            });
            if (isSelf) {
                toast.success('You have left the board');
                queryClient.invalidateQueries({ queryKey: ['boards'] });
                router.push('/boards');
                return;
            }
            toast.success(`Removed ${identifier} from board`);
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            fetchBoard();
        } catch (err: any) {
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
                                <Users className="w-5 h-5 text-indigo-400" /> Collaborator Directory
                            </h2>
                            <span className="text-xs text-slate-400">
                                {1 + (board.members?.length || 0)} active members
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {canShare ? 'Invite registered team members and manage their roles' : 'View members and their permission levels'}
                        </p>
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

                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                    {availableUsers.length > 0 ? (
                                        availableUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/60 hover:border-indigo-500/40 transition gap-2"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm">
                                                        {(u.name || u.email).charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-white truncate">
                                                            {u.name || u.email.split('@')[0]}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'EDITOR')}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                                                        title="Invite as Editor"
                                                    >
                                                        + Editor
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'VIEWER')}
                                                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
                                                        title="Invite as Viewer"
                                                    >
                                                        + Viewer
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-3 italic">
                                            {userDirectorySearch
                                                ? 'No registered users match your search.'
                                                : 'All registered users are already collaborators on this board!'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Direct Email Fallback */}
                            <div className="pt-3 border-t border-slate-800/80">
                                <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider mb-2">
                                    Or invite by direct email:
                                </p>
                                <form onSubmit={handleDirectInvite} className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        required
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                                        placeholder="colleague@example.com"
                                    />
                                    <select
                                        value={shareRole}
                                        onChange={(e) => setShareRole(e.target.value as 'EDITOR' | 'VIEWER')}
                                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs transition"
                                    >
                                        <option value="EDITOR">Editor (Can manage tasks & columns)</option>
                                        <option value="VIEWER">Viewer (Read-only access)</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={shareSubmitting}
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                                    >
                                        {shareSubmitting ? 'Inviting...' : 'Invite'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Current Members List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Current Collaborators
                        </h3>

                        <div className="space-y-2">
                            {/* Board Owner */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm">
                                        {(board.owner?.name || board.owner?.email || 'O').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">
                                            {board.owner?.name || board.owner?.email?.split('@')[0]}
                                            {board.ownerId === user?.id && <span className="text-slate-400 font-normal ml-1.5">(You)</span>}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">{board.owner?.email}</p>
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
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 uppercase shrink-0">
                                                {(m.user.name || m.user.email).charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {m.user.name || m.user.email.split('@')[0]}
                                                    {isCurrentUser && <span className="text-slate-400 font-normal ml-1.5">(You)</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            {isOwner ? (
                                                <select
                                                    value={m.role}
                                                    onChange={(e) =>
                                                        handleUpdateRole(m.id, e.target.value as 'EDITOR' | 'VIEWER')
                                                    }
                                                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                                >
                                                    <option value="EDITOR">Editor</option>
                                                    <option value="VIEWER">Viewer</option>
                                                </select>
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
