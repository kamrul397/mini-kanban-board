'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 0, // Stale-while-revalidate: instant 0ms cached UI + instant background refresh
                        gcTime: 1000 * 60 * 5, // 5 minutes cache retention
                        refetchOnWindowFocus: true, // Automatically re-verify freshness
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
