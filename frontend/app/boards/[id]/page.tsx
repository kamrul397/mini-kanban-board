'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board, Column, Task, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import { Plus, Trash2, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BoardDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');

    useEffect(() => {
        if (id) fetchBoard();
    }, [id]);

    const fetchBoard = async () => {
        try {
            const data = await apiFetch<Board>(`/boards/${id}`);
            setBoard(data);
            setColumns(data.columns || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
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

        const sourceTasks = Array.from(sourceCol.tasks);
        const [movedTask] = sourceTasks.splice(source.index, 1);

        // Optimistic Update
        const newColumns = [...columns];
        if (sourceCol.id === destCol.id) {
            sourceTasks.splice(destination.index, 0, movedTask);
            newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
        } else {
            const destTasks = Array.from(destCol.tasks);
            destTasks.splice(destination.index, 0, movedTask);
            newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
            newColumns[destColIndex] = { ...destCol, tasks: destTasks };
        }
        setColumns(newColumns);

        // Calculate neighboring task IDs for backend fractional order calculation
        const targetTasks =
            sourceCol.id === destCol.id ? sourceTasks : newColumns[destColIndex].tasks;
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
        } catch (err: any) {
            alert(err.message || 'Failed to move task. Reverting...');
            fetchBoard(); // Revert on failure
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskColumnId || !taskTitle.trim()) return;

        try {
            const newTask = await apiFetch<Task>('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    columnId: newTaskColumnId,
                    title: taskTitle,
                    description: taskDesc,
                }),
            });

            setColumns((prev) =>
                prev.map((c) =>
                    c.id === newTaskColumnId ? { ...c, tasks: [...c.tasks, newTask] } : c
                )
            );
            setNewTaskColumnId(null);
            setTaskTitle('');
            setTaskDesc('');
        } catch (err: any) {
            alert(err.message || 'Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId: string, columnId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
            setColumns((prev) =>
                prev.map((c) =>
                    c.id === columnId
                        ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
                        : c
                )
            );
        } catch (err: any) {
            alert(err.message || 'Failed to delete task');
        }
    };

    const handleShareBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch(`/boards/${id}/share`, {
                method: 'POST',
                body: JSON.stringify({ email: shareEmail, role: shareRole }),
            });
            alert('Board shared successfully!');
            setShowShareModal(false);
            setShareEmail('');
            fetchBoard();
        } catch (err: any) {
            alert(err.message || 'Failed to share board');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading board...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950">
            {/* Board Header */}
            <header className="p-4 px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link
                        href="/boards"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">{board?.title}</h1>
                        <p className="text-xs text-slate-400">{board?.description}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium border border-slate-700 transition"
                >
                    <Share2 className="w-4 h-4 text-indigo-400" /> Share Board
                </button>
            </header>

            {/* Kanban Board Columns Container */}
            <div className="flex-1 p-8 overflow-x-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex items-start gap-6 h-full min-w-max">
                        {columns.map((column) => (
                            <div
                                key={column.id}
                                className="w-80 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col max-h-[80vh]"
                            >
                                {/* Column Title */}
                                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-200">{column.title}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                            {column.tasks.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setNewTaskColumnId(column.id)}
                                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Droppable Task List */}
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`p-3 flex-1 overflow-y-auto space-y-3 transition min-h-[120px] ${snapshot.isDraggingOver ? 'bg-indigo-950/20' : ''
                                                }`}
                                        >
                                            {column.tasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-md group transition ${snapshot.isDragging ? 'rotate-2 shadow-indigo-500/20 ring-2 ring-indigo-500' : ''
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="font-medium text-slate-200 text-sm">
                                                                    {task.title}
                                                                </h4>
                                                                <button
                                                                    onClick={() => handleDeleteTask(task.id, column.id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {task.description && (
                                                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* Add Task Modal */}
            {newTaskColumnId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-white">Add New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                    placeholder="Task title..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                    placeholder="Details..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setNewTaskColumnId(null)}
                                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                                >
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Board Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-white">Share Board</h2>
                        <form onSubmit={handleShareBoard} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Collaborator Email</label>
                                <input
                                    type="email"
                                    required
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                    placeholder="teammate@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Role</label>
                                <select
                                    value={shareRole}
                                    onChange={(e) => setShareRole(e.target.value as 'EDITOR' | 'VIEWER')}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                                >
                                    <option value="EDITOR">Editor (Can edit & move tasks)</option>
                                    <option value="VIEWER">Viewer (Read-only)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                                >
                                    Share
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
