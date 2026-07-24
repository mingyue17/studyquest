'use client';

import { useStore } from '@/store/useStore';
import { determinePetStage, nextEvolutionLevel } from '@/lib/gamification';
import type { PetMood, PetStage } from '@/types';

/**
 * The pet is drawn, not imported — one grid of pixels per stage, so it scales
 * cleanly and never 404s. It cannot get sick, die or leave; the worst it does
 * is look worried when a deadline is close.
 */
const STAGE_ART: Record<PetStage, { grid: string[]; palette: Record<string, string>; scale: number }> = {
  Egg: {
    scale: 1,
    grid: [
      '..CC..',
      '.CCCC.',
      'CCWWCC',
      'CCWWCC',
      '.CCCC.',
      '..CC..',
    ],
    palette: { C: '#22e0ff', W: '#e8fbff' },
  },
  Baby: {
    scale: 1.15,
    grid: [
      '..GG..',
      '.GGGG.',
      'GKGGKG',
      'GGGGGG',
      '.G..G.',
      '.G..G.',
    ],
    palette: { G: '#39ff6a', K: '#070b1f' },
  },
  Young: {
    scale: 1.3,
    grid: [
      '.G..G.',
      '.GGGG.',
      'GKGGKG',
      'GGPPGG',
      'GGGGGG',
      '.G..G.',
    ],
    palette: { G: '#39ff6a', K: '#070b1f', P: '#ff4fd8' },
  },
  Teen: {
    scale: 1.45,
    grid: [
      'C.GG.C',
      '.GGGG.',
      'GKGGKG',
      'GGPPGG',
      'CGGGGC',
      '.G..G.',
    ],
    palette: { G: '#39ff6a', K: '#070b1f', P: '#ff4fd8', C: '#22e0ff' },
  },
  Adult: {
    scale: 1.6,
    grid: [
      'Y.GG.Y',
      'CGGGGC',
      'GKGGKG',
      'GYPPYG',
      'CGGGGC',
      'Y.GG.Y',
    ],
    palette: { G: '#39ff6a', K: '#070b1f', P: '#ff4fd8', C: '#22e0ff', Y: '#ffd23f' },
  },
  Legendary: {
    scale: 1.75,
    grid: [
      'YPGGPY',
      'CYGGYC',
      'GKYYKG',
      'YPGGPY',
      'CYGGYC',
      'YPGGPY',
    ],
    palette: { G: '#39ff6a', K: '#070b1f', P: '#ff4fd8', C: '#22e0ff', Y: '#ffd23f' },
  },
};

const MOOD_CLASS: Record<PetMood, string> = {
  idle: 'animate-bob',
  happy: 'animate-pop',
  celebrating: 'animate-pop',
  sleeping: 'animate-blink opacity-70',
  worried: 'animate-wobble',
  evolving: 'animate-evolve',
};

const MOOD_LINE: Record<PetMood, string> = {
  idle: 'Byte is watching your deadlines.',
  happy: 'Byte liked that session.',
  celebrating: 'Byte is celebrating your submission!',
  sleeping: 'Byte is napping. Log a session to wake it.',
  worried: 'Byte looks worried — something is due soon.',
  evolving: 'Byte is evolving!',
};

export function PetDisplay({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const user = useStore((s) => s.user);
  const petMood = useStore((s) => s.petMood);
  const petUnlocks = useStore((s) => s.petUnlocks);

  const stage = determinePetStage(user.currentLevel);
  const art = STAGE_ART[stage];
  const nextGate = nextEvolutionLevel(user.currentLevel);

  const hat = petUnlocks.find((u) => u.itemType === 'hat' && u.equipped);
  const roomTheme = petUnlocks.find((u) => u.itemType === 'roomTheme' && u.equipped);

  const pixelSize = { sm: 8, md: 14, lg: 18 }[size] * art.scale;
  const cols = art.grid[0].length;

  return (
    <div
      className={`pixel-border relative overflow-hidden border-navy-600 p-5 ${
        roomTheme ? 'bg-gradient-to-b from-navy-800 to-navy-950' : 'bg-navy-900'
      }`}
    >
      {/* Room floor line */}
      <div className="absolute inset-x-0 bottom-10 h-[3px] bg-navy-700" aria-hidden />

      <div className="relative flex flex-col items-center gap-3">
        {hat && <p className="font-pixel text-[8px] text-neon-yellow">{hat.itemName}</p>}

        <svg
          className={MOOD_CLASS[petMood]}
          width={cols * pixelSize}
          height={art.grid.length * pixelSize}
          viewBox={`0 0 ${cols} ${art.grid.length}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={`Byte, ${stage} stage, currently ${petMood}`}
        >
          {art.grid.map((row, y) =>
            row.split('').map((ch, x) =>
              ch === '.' ? null : (
                <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={art.palette[ch]} />
              )))}
        </svg>

        <div className="text-center">
          <p className="pixel-heading text-[10px] text-neon-green">Byte · {stage}</p>
          <p className="mt-1.5 text-xs text-slate-400">{MOOD_LINE[petMood]}</p>
          {nextGate && (
            <p className="mt-1 text-[11px] text-slate-500">
              Next form at level {nextGate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
