import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy dark palette (still used by landing/auth pages)
        ink: {
          950: '#07070b',
          900: '#0a0a10',
          800: '#11111a',
          700: '#1a1a26',
          600: '#262633',
          500: '#3a3a48',
        },
        bone: {
          50: '#f8f5ee',
          100: '#f3efe7',
          200: '#e8e1d2',
          300: '#cfc5b0',
          400: '#a89e89',
        },
        magenta: {
          400: '#ec4899',
          500: '#e11d6a',
          600: '#be185d',
        },
      },
      fontFamily: {
        // Dashboard fonts (matches reference JSX)
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Legacy (landing page editorial feel)
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-sm': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['5rem', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        'display-lg': ['7rem', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-xl': ['9rem', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
      },
      backgroundImage: {
        'grain':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        'aurora':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.25), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(34,211,238,0.12), transparent), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(225,29,106,0.10), transparent)',
        'gradient-hero':
          'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-bottom': 'slide-in-bottom 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'streak-pulse': 'streak-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-bottom': {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.4', filter: 'blur(40px)' },
          '50%': { opacity: '0.8', filter: 'blur(60px)' },
        },
        'streak-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(251, 146, 60, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(251, 146, 60, 0)' },
        },
      },
      boxShadow: {
        // Light theme card shadows
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'soft-md': '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'soft-lg': '0 10px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
        'soft-xl': '0 20px 40px -8px rgb(0 0 0 / 0.12)',
        'card-hover': '0 8px 24px -4px rgb(79 70 229 / 0.12), 0 2px 4px -2px rgb(79 70 229 / 0.06)',
        'streak': '0 0 24px -4px rgb(251 146 60 / 0.4)',
        // Legacy dark theme shadows
        'glow-violet': '0 0 60px -10px rgba(124, 58, 237, 0.5)',
        'glow-cyan': '0 0 60px -10px rgba(34, 211, 238, 0.45)',
        'inner-glow':
          'inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
