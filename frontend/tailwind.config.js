/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#e10600',
          'red-dark': '#b30500',
          black: '#15151e',
          gray: '#38383f',
          'gray-dark': '#1f1f27',
          'gray-light': '#505058',
        },
        // Tyre compound colors
        tyre: {
          soft: '#e10600',
          medium: '#fcd34d',
          hard: '#ffffff',
          intermediate: '#4ade80',
          wet: '#3b82f6',
        },
        // Position colors
        position: {
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Titillium Web', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(225, 6, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(225, 6, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
}
