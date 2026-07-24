import type { Config } from 'tailwindcss';

// Colors read from CSS variables (set in globals.css) so the whole app can
// swap dark/light theme by flipping one attribute on <html>. The variable
// stores "R G B" so Tailwind opacity modifiers (e.g. bg-navy-900/80) still work.
const withOpacity = (varName: string) => `rgb(var(${varName}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Arcade cabinet palette — dark navy by default, swaps to light in globals.css
        navy: {
          950: withOpacity('--c-navy-950'),
          900: withOpacity('--c-navy-900'),
          800: withOpacity('--c-navy-800'),
          700: withOpacity('--c-navy-700'),
          600: withOpacity('--c-navy-600'),
        },
        slate: {
          100: withOpacity('--c-slate-100'),
          200: withOpacity('--c-slate-200'),
          300: withOpacity('--c-slate-300'),
          400: withOpacity('--c-slate-400'),
          500: withOpacity('--c-slate-500'),
          600: withOpacity('--c-slate-600'),
          700: withOpacity('--c-slate-700'),
        },
        neon: {
          green: withOpacity('--c-neon-green'),
          cyan: withOpacity('--c-neon-cyan'),
          pink: withOpacity('--c-neon-pink'),
          yellow: withOpacity('--c-neon-yellow'),
          red: withOpacity('--c-neon-red'),
        },
      },
      fontFamily: {
        pixel: ['var(--font-pixel)', 'monospace'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pixel: '4px 4px 0 0 rgba(0,0,0,0.6)',
        'pixel-sm': '2px 2px 0 0 rgba(0,0,0,0.6)',
        glow: '0 0 12px currentColor',
      },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        wobble: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
        blink: { '0%,90%,100%': { opacity: '1' }, '95%': { opacity: '0.35' } },
        evolve: { '0%': { filter: 'brightness(1)' }, '50%': { filter: 'brightness(3)', transform: 'scale(1.4)' }, '100%': { filter: 'brightness(1)' } },
      },
      animation: {
        bob: 'bob 2.2s ease-in-out infinite',
        wobble: 'wobble 2.6s ease-in-out infinite',
        pop: 'pop 0.5s ease-out',
        blink: 'blink 4s ease-in-out infinite',
        evolve: 'evolve 1.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
