import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Distill — AI Voice Recorder',
  description: 'Distill your voice recordings into summaries, action items, and mind maps.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile top bar */}
        <MobileHeader />

        {/* Main content: top padding on mobile (for header), left margin on desktop (for sidebar), bottom padding on mobile (for bottom nav) */}
        <main className="md:ml-60 pt-12 md:pt-0 pb-16 md:pb-0 min-h-screen bg-background">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <BottomNav />

        <Toaster position="top-right" />
      </body>
    </html>
  );
}
