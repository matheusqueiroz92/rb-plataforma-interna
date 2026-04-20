import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1A2B',
          800: '#11223A',
          700: '#192F4A',
          600: '#243F5E',
        },
        gold: {
          500: '#C9A84C',
          400: '#E0BC6A',
          300: '#F5E6B0',
        },
        cream: '#FAF8F3',
        'off-white': '#F3F1EA',
        gray: {
          100: '#E8E4D8',
          500: '#8A8270',
          900: '#1C1814',
        },
        institucional: {
          red: '#A63228',
          green: '#25714E',
          amber: '#B87820',
          blue: '#1A4F82',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        lapidar: ['Cinzel', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13, 26, 43, 0.08), 0 4px 16px rgba(13, 26, 43, 0.06)',
        elevated: '0 4px 12px rgba(13, 26, 43, 0.12), 0 10px 40px rgba(13, 26, 43, 0.08)',
      },
      borderRadius: {
        card: '14px',
        badge: '10px',
      },
      transitionTimingFunction: {
        institucional: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        rise: 'rise 350ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fade: 'fade 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
