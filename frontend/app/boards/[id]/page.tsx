'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board, Column, Task, User, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import {
    Plus,
    Trash2,
    Share2,
    ArrowLeft,
    Edit2,
    Eye,
    Search,
    GripVertical,
    Clock,
    X,
    Users,
    Sparkles,
    Calendar,
    Settings,
    Lock,
    Shield,
    Check,
    AlertCircle,
    LogOut,
    Mail,
    UserPlus,
    ExternalLink,
    CheckCircle2,
    Columns3
} from 'lucide-react';
import Link from 'next/link';
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

// Accent palettes for columns
const COLUMN_ACCENTS = [
    { border: 'border-t-indigo-500', dot: 'bg-indigo-400', badge: 'text-indigo-400' },
    { border: 'border-t-amber-500', dot: 'bg-amber-400', badge: 'text-amber-400' },
    { border: 'border-t-emerald-500', dot: 'bg-emerald-400', badge: 'text-emerald-400' },
    { border: 'border-t-purple-500', dot: 'bg-purple-400', badge: 'text-purple-400' },
    { border: 'border-t-sky-500', dot: 'bg-sky-400', badge: 'text-sky-400' },
];

export default function BoardDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals state
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [shareSubmitting, setShareSubmitting] = useState(false);

    // Email format validator: must match user@domain.tld
    const isValidShareEmail = useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(shareEmail.trim());
    }, [shareEmail]);

    // Edit Board state
    const [showEditBoardModal, setShowEditBoardModal] = useState(false);
    const [editBoardTitle, setEditBoardTitle] = useState('');
    const [editBoardDesc, setEditBoardDesc] = useState('');
    const [editBoardSubmitting, setEditBoardSubmitting] = useState(false);

    // Add Column state
    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    // Add Task state
    const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');

    // Edit Task state
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    // Determine current user's role on this board
    const isOwner = board?.ownerId === user?.id;
    const currentMember = board?.members?.find((m) => m.userId === user?.id);
    const isViewer = !isOwner && currentMember?.role === 'VIEWER';
    const queryClient = useQueryClient();

    // TanStack Query: instant 0ms cached retrieval + background sync
    const {
        data: boardData,
        isLoading: queryLoading,
        refetch: fetchBoard,
    } = useQuery<Board>({
        queryKey: ['board', id],
        queryFn: () => apiFetch<Board>(`/boards/${id}`),
        enabled: !!id,
    });

    const [userDirectorySearch, setUserDirectorySearch] = useState('');

    // TanStack Query: fetch and cache all registered users for quick inviting
    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['users', user?.id],
        queryFn: () => apiFetch<User[]>('/users'),
        enabled: !!user?.id,
    });

    // Available users who are not yet on the board
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

    useEffect(() => {
        if (boardData) {
            setBoard(boardData);
            setEditBoardTitle(boardData.title);
            setEditBoardDesc(boardData.description || '');
            setColumns(boardData.columns || []);
            setLoading(false);
        }
    }, [boardData]);

    const handleUpdateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBoardTitle.trim()) return;
        setEditBoardSubmitting(true);

        const trimmedTitle = editBoardTitle.trim();
        const trimmedDesc = editBoardDesc.trim();

        // 1. Optimistic update
        setBoard((prev) => (prev ? { ...prev, title: trimmedTitle, description: trimmedDesc || null } : null));
        setShowEditBoardModal(false);
        toast.success('Board updated!');

        // 2. Persist in background
        try {
            await apiFetch(`/boards/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: trimmedTitle,
                    description: trimmedDesc || null,
                }),
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update board');
        } finally {
            setEditBoardSubmitting(false);
        }
    };

    const handleDeleteBoard = async () => {
        if (!isOwner) return;
        toast.success(`Board "${board?.title}" deleted`);
        router.push('/boards');

        try {
            await apiFetch(`/boards/${id}`, { method: 'DELETE' });
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete board');
        }
    };


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter tasks per column based on search
    const filteredColumns = useMemo(() => {
        if (!searchQuery.trim()) return columns;
        const q = searchQuery.toLowerCase();
        return columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    (t.description && t.description.toLowerCase().includes(q))
            ),
        }));
    }, [columns, searchQuery]);

    // --- Drag & Drop Task Movement ---
    const handleDragEnd = async (result: DropResult) => {
        if (isViewer) return;
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
        const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);
        if (sourceColIndex === -1 || destColIndex === -1) return;

        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];

        // Find the actual task being dragged from the rendered list or column
        const currentSourceTasks = searchQuery.trim()
            ? filteredColumns[sourceColIndex].tasks
            : sourceCol.tasks;
        const movedTask = currentSourceTasks[source.index];
        if (!movedTask) return;

        // Construct new state
        const newColumns = [...columns];
        const newSourceTasks = sourceCol.tasks.filter((t) => t.id !== draggableId);

        if (sourceCol.id === destCol.id) {
            newSourceTasks.splice(destination.index, 0, movedTask);
            newColumns[sourceColIndex] = { ...sourceCol, tasks: newSourceTasks };
        } else {
            const newDestTasks = Array.from(destCol.tasks);
            newDestTasks.splice(destination.index, 0, movedTask);
            newColumns[sourceColIndex] = { ...sourceCol, tasks: newSourceTasks };
            newColumns[destColIndex] = { ...destCol, tasks: newDestTasks };
        }
        setColumns(newColumns);

        // Find adjacent tasks in destination column for fractional indexing
        const targetTasks =
            sourceCol.id === destCol.id ? newSourceTasks : newColumns[destColIndex].tasks;
        const prevTask = targetTasks[destination.index - 1] || null;
        const nextTask = targetTasks[destination.index + 1] || null;

        try {
            await apiFetch(`/tasks/${draggableId}/move`, {
                method: 'PATCH',
                body: JSON.stringify({
                    targetColumnId: destination.droppableId,
                    prevTaskId: prevTask?.id || null,
                    nextTaskId: nextTask?.id || null,
                }),
            });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            toast.error(err.message || 'Failed to move task. Reverting changes...');
            fetchBoard();
        }
    };


    // --- Column Actions ---
    const handleCreateColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = newColumnTitle.trim();
        if (!trimmedTitle) return;

        // 1. Close modal immediately and clear input (0ms delay)
        setShowAddColumnModal(false);
        setNewColumnTitle('');

        // 2. Optimistically append new column to UI immediately
        const tempId = 'temp-col-' + Date.now();
        const optimisticCol: Column = {
            id: tempId,
            boardId: id,
            title: trimmedTitle,
            order: columns.length + 1,
            tasks: [],
        };

        const previousColumns = [...columns];
        setColumns((prev) => [...prev, optimisticCol]);
        toast.success(`Column "${trimmedTitle}" created!`);


        // 3. Persist in background and replace temp ID
        try {
            const serverCol = await apiFetch<Column>('/columns', {
                method: 'POST',
                body: JSON.stringify({
                    boardId: id,
                    title: trimmedTitle,
                }),
            });

            setColumns((prev) =>
                prev.map((c) => (c.id === tempId ? { ...serverCol, tasks: [] } : c))
            );
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            setColumns(previousColumns);
            toast.error(err.message || 'Failed to create column');
        }
    };


    const handleDeleteColumn = async (columnId: string, columnTitle: string) => {
        // 1. Instantly remove from UI (0ms delay)
        const previousColumns = [...columns];
        const deletedColumn = columns.find((c) => c.id === columnId);
        setColumns((prev) => prev.filter((c) => c.id !== columnId));

        // 2. Show instant feedback with Undo option
        let isUndone = false;
        toast.success(`Column "${columnTitle}" deleted`, {
            action: {
                label: 'Undo',
                onClick: () => {
                    isUndone = true;
                    if (deletedColumn) setColumns(previousColumns);
                },
            },
        });

        // 3. Persist deletion in background if not undone
        try {
            await apiFetch(`/columns/${columnId}`, { method: 'DELETE' });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            if (!isUndone) {
                setColumns(previousColumns);
                toast.error(err.message || 'Failed to delete column');
            }
        }
    };


    // --- Task Actions ---
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetColId = newTaskColumnId;
        const trimmedTitle = taskTitle.trim();
        const trimmedDesc = taskDesc.trim();
        if (!targetColId || !trimmedTitle) return;

        // 1. Instant close and input clear (0ms delay)
        setNewTaskColumnId(null);
        setTaskTitle('');
        setTaskDesc('');

        // 2. Optimistically add temporary task to column
        const tempId = 'temp-' + Date.now();
        const optimisticTask: Task = {
            id: tempId,
            columnId: targetColId,
            title: trimmedTitle,
            description: trimmedDesc || null,
            order: 999999,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const previousColumns = [...columns];
        setColumns((prev) =>
            prev.map((c) =>
                c.id === targetColId ? { ...c, tasks: [...c.tasks, optimisticTask] } : c
            )
        );
        toast.success(`Task "${trimmedTitle}" created!`);

        // 3. Persist in background and replace temp ID
        try {
            const serverTask = await apiFetch<Task>('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    columnId: targetColId,
                    title: trimmedTitle,
                    description: trimmedDesc || undefined,
                }),
            });

            setColumns((prev) =>
                prev.map((c) =>
                    c.id === targetColId
                        ? {
                            ...c,
                            tasks: c.tasks.map((t) => (t.id === tempId ? serverTask : t)),
                        }
                        : c
                )
            );
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            setColumns(previousColumns);
            toast.error(err.message || 'Failed to create task');
        }
    };

    const handleOpenEditModal = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDesc(task.description || '');
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editTitle.trim()) return;

        const taskToUpdate = editingTask;
        const trimmedTitle = editTitle.trim();
        const trimmedDesc = editDesc.trim();

        // 1. Instant close
        setEditingTask(null);

        // 2. Optimistic update
        const previousColumns = [...columns];
        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) =>
                    t.id === taskToUpdate.id
                        ? { ...t, title: trimmedTitle, description: trimmedDesc || null }
                        : t
                ),
            }))
        );
        toast.success('Task updated!');

        // 3. Persist in background
        try {
            const updated = await apiFetch<Task>(`/tasks/${taskToUpdate.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: trimmedTitle,
                    description: trimmedDesc || null,
                }),
            });

            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
                }))
            );
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            setColumns(previousColumns);
            toast.error(err.message || 'Failed to update task');
        }
    };


    const handleDeleteTask = async (taskId: string, columnId: string) => {
        // 1. Instantly remove task from UI (0ms delay)
        const previousColumns = [...columns];
        setColumns((prev) =>
            prev.map((c) =>
                c.id === columnId
                    ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
                    : c
            )
        );

        toast.success('Task deleted');

        // 2. Persist in background
        try {
            await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            setColumns(previousColumns);
            toast.error(err.message || 'Failed to delete task');
        }
    };



    // --- Share Action ---
    const handleShareBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string }>(`/boards/${id}/share`, {
                method: 'POST',
                body: JSON.stringify({ email: shareEmail.trim(), role: shareRole }),
            });
            toast.success(res.message || `Board shared with ${shareEmail}!`);
            setShareEmail('');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to share board');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleQuickInvite = async (targetEmail: string, role: 'EDITOR' | 'VIEWER') => {
        setShareSubmitting(true);
        try {
            const res = await apiFetch<{ message: string }>(`/boards/${id}/share`, {
                method: 'POST',
                body: JSON.stringify({ email: targetEmail, role }),
            });
            toast.success(res.message || `Board shared with ${targetEmail}!`);
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            fetchBoard();
        } catch (err: any) {
            toast.error(err.message || 'Failed to invite user');
        } finally {
            setShareSubmitting(false);
        }
    };

    const handleUpdateMemberRole = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
        try {
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });
            toast.success('Member role updated');
            setBoard((prev) => {
                if (!prev || !prev.members) return prev;
                return {
                    ...prev,
                    members: prev.members.map((m) =>
                        m.id === memberId ? { ...m, role: newRole } : m
                    ),
                };
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update member role');
        }
    };

    const handleRemoveMember = async (memberId: string, identifier: string) => {
        try {
            const isSelf = board?.members?.find((m) => m.id === memberId)?.userId === user?.id;
            await apiFetch(`/boards/${id}/members/${memberId}`, {
                method: 'DELETE',
            });
            if (isSelf) {
                toast.success('You have left the board');
                router.push('/boards');
                return;
            }
            toast.success(`Removed ${identifier} from board`);
            setBoard((prev) => {
                if (!prev || !prev.members) return prev;
                return {
                    ...prev,
                    members: prev.members.filter((m) => m.id !== memberId),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        } catch (err: any) {
            toast.error(err.message || 'Failed to remove member');
        }
    };

    // Formatted time string
    const formatTaskDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    if (loading || !mounted) {
        return (
            <div className="min-h-screen flex flex-col">
                {/* Header Skeleton */}
                <div className="h-18 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                        <div>
                            <div className="h-5 w-40 bg-slate-800 rounded-md animate-pulse mb-2" />
                            <div className="h-3 w-24 bg-slate-800/60 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-9 w-24 bg-slate-800 rounded-xl animate-pulse" />
                        <div className="h-9 w-24 bg-slate-800 rounded-xl animate-pulse" />
                    </div>
                </div>

                {/* Columns Skeleton */}
                <div className="flex-1 p-8 flex gap-6 overflow-x-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-80 h-[500px] rounded-3xl bg-slate-900/40 border border-slate-800/60 p-4 animate-pulse flex flex-col gap-4">
                            <div className="h-6 w-32 bg-slate-800 rounded-md" />
                            <div className="h-24 w-full bg-slate-800/60 rounded-2xl" />
                            <div className="h-24 w-full bg-slate-800/60 rounded-2xl" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col">
            {/* Board Detail Header */}
            <header className="p-4 px-6 md:px-8 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        href="/boards"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Back to boards"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-white tracking-tight">{board?.title}</h1>
                            {isViewer ? (
                                <button
                                    onClick={() => setShowPermissionsModal(true)}
                                    className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-medium transition cursor-pointer"
                                    title="Click to view permissions"
                                >
                                    <Eye className="w-3 h-3" /> Viewer
                                </button>
                            ) : isOwner ? (
                                <button
                                    onClick={() => setShowPermissionsModal(true)}
                                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-medium transition cursor-pointer"
                                    title="Click to view permissions"
                                >
                                    Owner
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPermissionsModal(true)}
                                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium transition cursor-pointer"
                                    title="Click to view permissions"
                                >
                                    Editor
                                </button>
                            )}
                        </div>
                        {board?.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{board.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-3">
                    {/* Real-time Task Search Input */}
                    <div className="relative w-48 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter tasks in board..."
                            className="w-full pl-8.5 pr-7 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Collaborator Avatars */}
                    {board?.members && board.members.length > 0 && (
                        <div className="hidden sm:flex items-center -space-x-2 pl-2 border-l border-slate-800">
                            {board.members.slice(0, 4).map((m, idx) => (
                                <div
                                    key={m.id}
                                    title={`${m.user.name || m.user.email} (${m.role})`}
                                    className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm"
                                >
                                    {(m.user.name || m.user.email).charAt(0)}
                                </div>
                            ))}
                            {board.members.length > 4 && (
                                <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-300 font-medium">
                                    +{board.members.length - 4}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Column Button */}
                    {!isViewer && (
                        <button
                            onClick={() => setShowAddColumnModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium border border-slate-800 text-slate-200 transition cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Column
                        </button>
                    )}

                    {/* Share Board Button */}
                    {!isViewer && (
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition cursor-pointer"
                        >
                            <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Share
                        </button>
                    )}

                    {/* Board Details Link */}
                    <Link
                        href={`/boards/${id}/details`}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 hover:text-white transition cursor-pointer"
                        title="View Board Details, Members & Settings"
                    >
                        <Settings className="w-3.5 h-3.5 text-indigo-400" /> Board Details
                    </Link>
                </div>
            </header>

            {/* View-Only Alert Banner for Viewers */}
            {isViewer && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2 min-w-0">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                            <strong>View-Only Mode:</strong> You have read-only access. Drag-and-drop and edits are restricted to Editors & Owners.
                        </span>
                    </div>
                    <button
                        onClick={() => setShowPermissionsModal(true)}
                        className="underline hover:text-amber-200 font-medium cursor-pointer ml-4 shrink-0"
                    >
                        What can I do?
                    </button>
                </div>
            )}

            {/* Kanban Columns Canvas - 1-Page Layout without Horizontal Scrollbar */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-flow-col auto-cols-fr gap-4 md:gap-5 h-full items-start overflow-hidden">
                        {filteredColumns.map((column, colIdx) => {
                            const accent = COLUMN_ACCENTS[colIdx % COLUMN_ACCENTS.length];
                            return (
                                <div
                                    key={column.id}
                                    className="min-w-0 flex-1 max-h-[calc(100vh-140px)] rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col p-3 shadow-lg"
                                >
                                    {/* Column Header */}
                                    <div className="pb-3 flex items-center justify-between border-b border-slate-800 shrink-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent.dot}`} />
                                            <h3 className="font-semibold text-white text-sm truncate">{column.title}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono shrink-0">
                                                {column.tasks.length}
                                            </span>
                                        </div>
                                        {!isViewer && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => setNewTaskColumnId(column.id)}
                                                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                                                    title="Add Task"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteColumn(column.id, column.title)}
                                                    className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                                                    title="Delete Column"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Droppable Task List with Vertical Scrolling */}
                                    <Droppable droppableId={column.id} isDropDisabled={isViewer}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`py-3 flex-1 overflow-y-auto flex flex-col gap-2.5 min-h-[140px] pr-1 ${snapshot.isDraggingOver ? 'bg-slate-800/40' : ''
                                                    }`}
                                            >
                                                {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-24 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                                                        <p className="text-xs text-slate-500">No tasks here</p>
                                                        {!isViewer && (
                                                            <button
                                                                onClick={() => setNewTaskColumnId(column.id)}
                                                                className="text-xs text-indigo-400 hover:underline mt-1 cursor-pointer"
                                                            >
                                                                + Add a task
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {column.tasks.map((task, index) => (
                                                    <Draggable
                                                        key={task.id}
                                                        draggableId={task.id}
                                                        index={index}
                                                        isDragDisabled={isViewer}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={provided.draggableProps.style}
                                                                className={`p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left ${!isViewer ? 'cursor-grab active:cursor-grabbing' : ''
                                                                    } ${snapshot.isDragging ? 'bg-slate-800 shadow-xl border-indigo-500 z-50' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                                        {!isViewer && (
                                                                            <GripVertical className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                                        )}
                                                                        <span
                                                                            onClick={() => handleOpenEditModal(task)}
                                                                            className="font-medium text-slate-200 text-sm hover:text-indigo-400 cursor-pointer break-words leading-snug"
                                                                        >
                                                                            {task.title}
                                                                        </span>
                                                                    </div>

                                                                    {!isViewer && (
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleOpenEditModal(task);
                                                                                }}
                                                                                className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                                                                                title="Edit Task"
                                                                            >
                                                                                <Edit2 className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteTask(task.id, column.id);
                                                                                }}
                                                                                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                                                                                title="Delete Task"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {task.description && (
                                                                    <p
                                                                        onClick={() => handleOpenEditModal(task)}
                                                                        className="text-xs text-slate-400 mt-1.5 line-clamp-2 cursor-pointer break-words"
                                                                    >
                                                                        {task.description}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{formatTaskDate(task.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>


            {/* Modal: Add Column */}
            {showAddColumnModal && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowAddColumnModal(false);
                    }}
                >
                    <div className="w-full max-w-md bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-indigo-950/40 animate-modal relative overflow-hidden">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                                    <Columns3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Add Workflow Column</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Create a new stage in your Kanban board flow</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddColumnModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Preset Suggestions */}
                        <div className="mb-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Quick Suggestions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {['Backlog', 'In Review', 'QA Testing', 'Blocked', 'Done'].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setNewColumnTitle(preset)}
                                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                            newColumnTitle === preset
                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-medium'
                                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                        }`}
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleCreateColumn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Column Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newColumnTitle}
                                    onChange={(e) => setNewColumnTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                                    placeholder="e.g. In Review, QA Testing, Backlog"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={() => setShowAddColumnModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs sm:text-sm font-medium transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Stage</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Task */}
            {newTaskColumnId && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setNewTaskColumnId(null);
                    }}
                >
                    <div className="w-full max-w-md bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-indigo-950/40 animate-modal relative overflow-hidden">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Add New Task</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Define deliverables and actionable details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNewTaskColumnId(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                                    placeholder="What needs to be done?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition resize-none"
                                    placeholder="Additional context or acceptance criteria..."
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={() => setNewTaskColumnId(null)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs sm:text-sm font-medium transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Task</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Task Details (Read-only for Viewers, Editable for Editors/Owners) */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-900/95 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal">
                        {isViewer ? (
                            /* Viewer: Clean Read-Only Presentation */
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                                        <Lock className="w-3 h-3" /> Read-Only Task
                                    </span>
                                    <button
                                        onClick={() => setEditingTask(null)}
                                        className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <h2 className="text-lg font-bold text-white mb-3 break-words">
                                    {editingTask.title}
                                </h2>

                                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 min-h-[80px]">
                                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                        Description
                                    </label>
                                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
                                        {editingTask.description || 'No additional description provided.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Created {formatTaskDate(editingTask.createdAt)}</span>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>You have View-Only access. Only Editors and Owners can edit or delete tasks.</span>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTask(null)}
                                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Editor / Owner: Editable Form */
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Edit2 className="w-4 h-4 text-indigo-400" /> Edit Task
                                    </h2>
                                    <button
                                        onClick={() => setEditingTask(null)}
                                        className="text-slate-500 hover:text-slate-300 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateTask} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Task Title
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
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
                                            placeholder="Task details..."
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-8">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleDeleteTask(editingTask.id, editingTask.columnId);
                                                setEditingTask(null);
                                            }}
                                            className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                        <div className="flex gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setEditingTask(null)}
                                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Role & Access Permissions Matrix */}
            {showPermissionsModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-xl bg-slate-900/95 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" /> Board Role & Access Permissions
                            </h2>
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-6">
                            See what each collaborator tier can do on this Kanban board.
                        </p>

                        <div className="overflow-y-auto flex-1 pr-1">
                            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                                            <th className="py-3 px-4 font-semibold">Capability</th>
                                            <th className="py-3 px-3 text-center font-semibold">
                                                <span className={`px-2 py-0.5 rounded-full ${isViewer ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'}`}>
                                                    Viewer {isViewer && '(You)'}
                                                </span>
                                            </th>
                                            <th className="py-3 px-3 text-center font-semibold">
                                                <span className={`px-2 py-0.5 rounded-full ${!isOwner && !isViewer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'}`}>
                                                    Editor {!isOwner && !isViewer && '(You)'}
                                                </span>
                                            </th>
                                            <th className="py-3 px-3 text-center font-semibold">
                                                <span className={`px-2 py-0.5 rounded-full ${isOwner ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400'}`}>
                                                    Owner {isOwner && '(You)'}
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Browse Board & Filter Tasks</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Click to Read Full Task Details</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Drag & Drop Task Movement</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Create, Edit & Delete Tasks</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Add & Delete Workflow Columns</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Invite Collaborators</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Change Roles & Remove Members</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                        <tr className="hover:bg-slate-900/30">
                                            <td className="py-3 px-4 font-medium">Edit Board Settings & Delete Board</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-slate-500">✕</td>
                                            <td className="text-center text-emerald-400 font-bold">✓</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowPermissionsModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Share Board & Member Management */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-lg bg-slate-900/95 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal max-h-[92vh] flex flex-col">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Invite Collaborators</h2>
                                    <p className="text-[11px] text-slate-400">Invite as Editors (group task tracking) or Viewers (showcase progress)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar pr-1 space-y-4 flex-1 mt-3">
                            {/* Search bar */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={userDirectorySearch}
                                    onChange={(e) => setUserDirectorySearch(e.target.value)}
                                    placeholder="Search directory by name or email..."
                                    className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition shadow-inner"
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

                            {/* Available Members List */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider px-1">
                                    <span>Registered Users</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                        {availableUsers.length} available
                                    </span>
                                </div>

                                {/* Scrolls when exceeding 10 items (approx 520px height) */}
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 pr-1.5">
                                    {availableUsers.length > 0 ? (
                                        availableUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="group/user flex items-center justify-between p-2.5 px-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-150 gap-3 shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
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
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'EDITOR')}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/25 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                                                        title="Invite as Editor (can manage tasks & columns)"
                                                    >
                                                        <Shield className="w-3 h-3 text-emerald-400" />
                                                        <span>+ Editor</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={shareSubmitting}
                                                        onClick={() => handleQuickInvite(u.email, 'VIEWER')}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/25 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                                                        title="Invite as Viewer (read-only)"
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
                                        <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Direct Invite
                                    </p>
                                    <span className="text-[10px] text-slate-500">For colleagues by email</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            className={`w-full pl-9 pr-7 py-2 rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 focus:outline-none text-xs transition ${
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
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/90 border border-emerald-500/30 animate-fade-in shadow-sm shadow-emerald-500/5">
                                            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Invite as:
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={shareSubmitting}
                                                    onClick={() => handleQuickInvite(shareEmail.trim(), 'EDITOR')}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                                                    title="Invite as Editor (can manage tasks & columns)"
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

                            {/* Polished Link to Board Details */}
                            <div className="pt-2">
                                <Link
                                    href={`/boards/${id}/details`}
                                    onClick={() => setShowShareModal(false)}
                                    className="group/link flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition shadow-sm"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-xs font-medium text-slate-200 group-hover/link:text-indigo-300 transition truncate">
                                                Manage Existing Collaborators
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate">
                                                View member list, modify roles, or remove permissions in Board Details
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-indigo-400 group-hover/link:translate-x-0.5 transition shrink-0 ml-2" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Edit Board Settings (Owners only) */}
            {showEditBoardModal && isOwner && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-900/95 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl animate-modal">
                        <h2 className="text-xl font-bold mb-1 text-white">Board Settings</h2>
                        <p className="text-xs text-slate-400 mb-6">Modify board details or permanently remove this board</p>
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
                            <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={handleDeleteBoard}
                                    className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Board
                                </button>
                                <div className="flex gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditBoardModal(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editBoardSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                                    >
                                        {editBoardSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


