import type { ButtonHTMLAttributes } from 'react';

const TONES = {
  green: 'bg-neon-green/15 border-neon-green text-neon-green hover:bg-neon-green/25',
  cyan: 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/25',
  pink: 'bg-neon-pink/15 border-neon-pink text-neon-pink hover:bg-neon-pink/25',
  yellow: 'bg-neon-yellow/15 border-neon-yellow text-neon-yellow hover:bg-neon-yellow/25',
  ghost: 'bg-navy-800 border-navy-600 text-slate-300 hover:bg-navy-700',
} as const;

export function PixelButton({
  tone = 'ghost', className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof TONES }) {
  return <button {...props} className={`arcade-button focus-ring ${TONES[tone]} ${className}`} />;
}
