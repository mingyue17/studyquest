import type { Metadata } from 'next';
import { Press_Start_2P, Inter } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { Toasts } from '@/components/ui/Toasts';
import { AuthProvider } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import './globals.css';

// Display face: an actual 8-bit face, used only for headings and stats.
const pixel = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel' });
// Body face: kept plain, because reading a deadline shouldn't be a puzzle.
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'StudyQuest — Academic command centre',
  description: 'Deadlines from SNAPP, PoliteMall and Teams in one place, with a study plan that actually fits your week.',
};

// Runs before React hydrates so the correct theme is set on first paint —
// no flash of dark-then-light (or vice versa) on load.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('studyquest-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${pixel.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>
          <AuthGate>
            <Nav />
            <main className="lg:pl-60">
              <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </main>
            <Toasts />
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
