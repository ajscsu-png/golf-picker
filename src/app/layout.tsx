import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Major Picker',
  description: 'Snake draft and live leaderboard for the 4 major golf tournaments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg hover:text-green-700">
              <span>⛳</span>
              <span>Golf Picker</span>
            </Link>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Admin
            </Link>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
