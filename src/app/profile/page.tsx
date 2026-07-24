'use client';

import { PixelPanel } from '@/components/ui/PixelPanel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { Leaderboard } from '@/components/profile/Leaderboard';
import { useStore } from '@/store/useStore';
import { levelProgress, nextEvolutionLevel } from '@/lib/gamification';
import { BADGES } from '@/lib/quests';

const RANK_ORDER = [
  'Rookie', 'Learner', 'Scholar', 'Strategist',
  'Academic Knight', 'Master Planner', 'Semester Champion',
] as const;

const ITEM_TYPE_LABELS: Record<string, string> = {
  hat: 'Hats', outfit: 'Outfits', desk: 'Desk decorations',
  roomTheme: 'Room themes', frame: 'Profile frames', animation: 'Pet animations',
  legendaryForm: 'Legendary forms',
};

export default function ProfilePage() {
  const { user, petUnlocks, unlockedBadgeIds } = useStore();
  const equipItem = useStore((s) => s.equipItem);

  const progress = levelProgress(user.totalXp);
  const nextGate = nextEvolutionLevel(user.currentLevel);
  const rankIndex = RANK_ORDER.indexOf(user.currentRank);

  const groupedUnlocks = petUnlocks.reduce<Record<string, typeof petUnlocks>>((acc, item) => {
    (acc[item.itemType] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">Profile & Pet</h1>
        <p className="mt-2 text-sm text-slate-400">{user.name} · {user.currentRank}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PetDisplay size="lg" />

        <PixelPanel title="Progression" accent="cyan">
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="pixel-heading text-sm text-neon-cyan">Level {user.currentLevel}</p>
                <p className="font-pixel text-[9px] text-neon-yellow">{user.currentRank}</p>
              </div>
              <ProgressBar value={progress.percent} tone="cyan" showValue={false} />
              <p className="mt-2 text-xs text-slate-500">{progress.xpIntoLevel} / {progress.xpForNext} XP to next level</p>
            </div>

            {nextGate && (
              <div className="border-2 border-navy-700 bg-navy-950 p-3">
                <p className="text-xs text-slate-400">Byte evolves again at level <span className="text-neon-green">{nextGate}</span>.</p>
              </div>
            )}

            <div>
              <p className="mb-2 font-pixel text-[8px] uppercase text-slate-500">Rank ladder</p>
              <ol className="flex flex-wrap gap-1.5">
                {RANK_ORDER.map((rank, i) => (
                  <li key={rank}>
                    <span className={`border-2 px-2 py-1 font-pixel text-[7px] ${
                      i <= rankIndex ? 'border-neon-green text-neon-green' : 'border-navy-700 text-slate-600'
                    }`}>
                      {rank}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border-2 border-navy-700 bg-navy-950 p-3">
                <p className="text-slate-500">Total XP</p>
                <p className="mt-1 font-pixel text-sm text-neon-green">{user.totalXp.toLocaleString()}</p>
              </div>
              <div className="border-2 border-navy-700 bg-navy-950 p-3">
                <p className="text-slate-500">Streak</p>
                <p className="mt-1 font-pixel text-sm text-neon-yellow">{user.currentStreak}d</p>
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>

      <Leaderboard />

      <PixelPanel title="Cosmetic unlocks" accent="pink">
        {petUnlocks.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing unlocked yet — level up to earn cosmetics for Byte.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedUnlocks).map(([type, items]) => (
              <div key={type}>
                <p className="mb-2 font-pixel text-[8px] uppercase text-slate-500">{ITEM_TYPE_LABELS[type] ?? type}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <button
                      key={item.unlockId}
                      onClick={() => equipItem(item.unlockId)}
                      className={`focus-ring border-2 px-3 py-2 text-xs transition-colors ${
                        item.equipped
                          ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                          : 'border-navy-600 bg-navy-950 text-slate-300 hover:border-neon-pink/50'
                      }`}
                    >
                      {item.itemName}{item.equipped && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PixelPanel>

      <PixelPanel title="Badges" accent="yellow">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BADGES.map((badge) => {
            const unlocked = unlockedBadgeIds.includes(badge.badgeId);
            return (
              <div
                key={badge.badgeId}
                className={`border-2 p-3 text-center ${unlocked ? 'border-neon-yellow bg-neon-yellow/10' : 'border-navy-700 bg-navy-950 opacity-50'}`}
                title={badge.description}
              >
                <p className="text-2xl" aria-hidden>{badge.icon}</p>
                <p className={`mt-2 font-pixel text-[8px] ${unlocked ? 'text-neon-yellow' : 'text-slate-500'}`}>{badge.badgeName}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          {unlockedBadgeIds.length} of {BADGES.length} badges unlocked.
        </p>
      </PixelPanel>
    </div>
  );
}
