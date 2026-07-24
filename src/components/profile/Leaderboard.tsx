'use client';
import { useEffect, useState } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { useStore } from '@/store/useStore';
import { fetchLeaderboard } from '@/lib/sync';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { LeaderboardEntry } from '@/types';

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_TONE = ['border-neon-yellow text-neon-yellow', 'border-slate-300 text-slate-300', 'border-neon-pink text-neon-pink'];

export function Leaderboard() {
  const user = useStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchLeaderboard(50).then(setEntries);
  }, []);

  return (
    <PixelPanel title="Leaderboard" accent="yellow">
      {!isSupabaseConfigured ? (
        <p className="text-sm text-slate-400">
          Offline demo mode — connect Supabase (see README) so real accounts can rank against each other.
        </p>
      ) : entries === null ? (
        <p className="text-sm text-slate-400">Loading rankings…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400">No one on the board yet — be the first to earn XP.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.userId === user.userId;
            return (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 border-2 p-3 ${
                  isMe ? 'border-neon-cyan bg-neon-cyan/10' : 'border-navy-700 bg-navy-950'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 font-pixel text-[10px] ${
                  i < 3 ? RANK_TONE[i] : 'border-navy-600 text-slate-500'
                }`}>
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${isMe ? 'text-neon-cyan' : 'text-slate-200'}`}>
                    {entry.name}{isMe && ' (you)'}
                  </p>
                  <p className="text-[11px] text-slate-500">Level {entry.currentLevel} · {entry.currentRank}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-pixel text-xs text-neon-green">{entry.totalXp.toLocaleString()} XP</p>
                  {entry.currentStreak > 0 && (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                      <Flame className="h-3 w-3 text-neon-yellow" aria-hidden />{entry.currentStreak}d
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Trophy className="h-3 w-3" aria-hidden />Ranked by total XP across every StudyQuest account.
      </p>
    </PixelPanel>
  );
}
