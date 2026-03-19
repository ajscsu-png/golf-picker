import type { Metadata } from 'next';
import Link from 'next/link';
import GolfJoke from '@/components/GolfJoke';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Major Picker',
  description: 'Snake draft and live leaderboard for the 4 major golf tournaments',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Golf Picker',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-green-700 px-4 py-3 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg hover:text-green-200 transition-colors">
              <span>⛳</span>
              <span>Golf Picker</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/stats" className="text-sm text-green-100 hover:text-white transition-colors">
                Stats
              </Link>
              <Link href="/admin" className="text-sm text-green-100 hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <GolfJoke />
          {children}
        </main>
      </body>
    </html>
  );
}
