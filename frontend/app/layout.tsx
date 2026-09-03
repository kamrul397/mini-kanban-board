import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Providers from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mini Kanban Board',
  description: 'Full-Stack Real-Time Collaborative Kanban Board',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster
            richColors
            closeButton
            duration={2000}
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: '#0f172a',
                border: '1px solid #1e293b',
                color: '#f8fafc',
              },
            }}
          />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
