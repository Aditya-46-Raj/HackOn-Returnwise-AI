/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9900',
          50:  '#FFF8EC',
          100: '#FFEEC5',
          200: '#FFDB85',
          300: '#FFC145',
          400: '#FFAB1A',
          500: '#FF9900',
          600: '#E07800',
          700: '#B85B00',
          800: '#904400',
          900: '#6B3000',
        },
        dark: {
          bg:      '#0F1111',
          surface: '#1A1F2E',
          card:    '#232B3E',
          border:  '#2E3A52',
          hover:   '#2A3348',
        },
        eco: {
          DEFAULT: '#00C851',
          light:   '#33D46F',
          dark:    '#009938',
        },
        ai: {
          DEFAULT: '#7C3AED',
          light:   '#9B62F5',
          dark:    '#5B21B6',
        },
        grade: {
          a: '#10B981',  // green — Like New
          b: '#3B82F6',  // blue  — Good
          c: '#F59E0B',  // amber — Fair
          d: '#EF4444',  // red   — Poor
        },
        action: {
          restock:  '#10B981',
          resell:   '#3B82F6',
          refurbish:'#F59E0B',
          donate:   '#8B5CF6',
          recycle:  '#6B7280',
          exchange: '#FF9900',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'scale-in':   'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up':   'countUp 0.6s ease-out',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 8px rgba(255, 153, 0, 0.3)' },
          '100%': { boxShadow: '0 0 24px rgba(255, 153, 0, 0.7)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0F1111 0%, #1A1F2E 50%, #0F1111 100%)',
        'card-gradient': 'linear-gradient(145deg, #232B3E, #1A1F2E)',
        'primary-gradient': 'linear-gradient(135deg, #FF9900, #E07800)',
        'eco-gradient': 'linear-gradient(135deg, #00C851, #009938)',
        'ai-gradient': 'linear-gradient(135deg, #7C3AED, #5B21B6)',
      },
      boxShadow: {
        'card':    '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'primary': '0 4px 16px rgba(255, 153, 0, 0.3)',
        'eco':     '0 4px 16px rgba(0, 200, 81, 0.3)',
        'ai':      '0 4px 16px rgba(124, 58, 237, 0.3)',
        'glow-sm': '0 0 12px rgba(255, 153, 0, 0.4)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
