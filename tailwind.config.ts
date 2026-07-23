import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark navy arcade cabinet
        navy: { 950: '#070b1f', 900: '#0b1130', 800: '#121a44', 700: '#1b2560', 600: '#28337a' },
        neon: {
          green: '#39ff6a',
          cyan: '#22e0ff',
          pink: '#ff4fd8',
          yellow: '#ffd23f',
          red: '#ff5470',
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
