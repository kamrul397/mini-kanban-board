const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface User {
    id: string;
    name: string | null;
    email: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    order: number;
    columnId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Column {
    id: string;
    title: string;
    order: number;
    boardId: string;
    tasks: Task[];
}

export interface BoardMember {
    id: string;
    userId: string;
    role: 'VIEWER' | 'EDITOR';
    user: User;
}

export interface Board {
    id: string;
    title: string;
    description: string | null;
    ownerId: string;
    owner?: User;
    members?: BoardMember[];
    columns?: Column[];
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Only redirect to /login if 401 occurred on a protected route, NOT during login/register!
        if (res.status === 401 && typeof window !== 'undefined' && !endpoint.startsWith('/auth/')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        const errorMsg = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || data.error || `HTTP ${res.status}: ${res.statusText || 'API request failed'}`;
        throw new Error(errorMsg);
    }

    return data as T;
}
