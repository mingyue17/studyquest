'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Swords, CalendarRange, GraduationCap, Users,
  NotebookPen, Bot, Egg, Menu, X, Flame,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { levelProgress } from '@/lib/gamification';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quests', label: 'Quests', icon: Swords },
  { href: '/planner', label: 'AI Planner', icon: CalendarRange },
  { href: '/gpa', label: 'GPA Goal', icon: GraduationCap },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/reflection', label: 'Reflection', icon: NotebookPen },
  { href: '/assistant', label: 'Assistant', icon: Bot },
  { href: '/profile', label: 'Pet & Profile', icon: Egg },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useStore((s) => s.user);
  const progress = levelProgress(user.totalXp);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-navy-700 bg-navy-950/95 px-4 py-3 lg:hidden">
        <span className="pixel-heading text-[11px] text-neon-green">StudyQuest</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-pixel text-[9px] text-neon-yellow">
            <Flame className="h-3.5 w-3.5" aria-hidden />{user.currentStreak}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="focus-ring border-2 border-navy-600 p-1.5 text-slate-300"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <nav
        className={`${open ? 'block' : 'hidden'} border-b-4 border-navy-700 bg-navy-950 lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-60 lg:border-b-0 lg:border-r-4`}
        aria-label="Main"
      >
        <div className="hidden px-5 py-6 lg:block">
          <p className="pixel-heading text-sm text-neon-green">Study</p>
          <p className="pixel-heading text-sm text-neon-pink">Quest</p>
          <p className="mt-2 text-[11px] text-slate-500">Academic command centre</p>
        </div>

        <ul className="flex flex-col gap-1 p-3 lg:p-3">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`focus-ring flex items-center gap-3 border-2 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                      : 'border-transparent text-slate-400 hover:border-navy-600 hover:text-slate-200'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="font-pixel text-[9px] uppercase tracking-wide">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t-2 border-navy-700 p-4 lg:absolute lg:inset-x-0 lg:bottom-0">
          <p className="font-pixel text-[9px] text-slate-400">
            LV {user.currentLevel} · {user.currentRank}
          </p>
          <div className="mt-2 flex gap-[2px] border-2 border-navy-600 bg-navy-950 p-[2px]">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={`h-2 flex-1 ${i < Math.round(progress.percent / 100 * 12) ? 'bg-neon-green' : 'bg-navy-800'}`} />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {progress.xpRemaining} XP to level {user.currentLevel + 1}
          </p>
        </div>
      </nav>
    </>
  );
}
