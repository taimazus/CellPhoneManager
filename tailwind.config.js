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
        cyber: {
          900: '#090d16',
          850: '#0d1322',
          800: '#11192e',
          700: '#1a2644',
          600: '#263863',
          500: '#3b82f6',
          400: '#60a5fa',
          neon: '#00f0ff',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.6))' },
          '50%': { opacity: 0.7, filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.2))' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
