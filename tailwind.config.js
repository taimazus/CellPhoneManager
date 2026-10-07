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
        studio: {
          950: '#070a11',
          900: '#0a0e17',
          850: '#0f172a',
          800: '#141e33',
          750: '#1a2642',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9'
        },
        brand: {
          900: '#1e3a8a',
          800: '#1e40af',
          700: '#1d4ed8',
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd'
        },
        cyber: {
          900: '#0a0e17',
          850: '#0f172a',
          800: '#141e33',
          700: '#1e293b',
          600: '#334155',
          500: '#3b82f6',
          400: '#60a5fa',
          neon: '#38bdf8',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Outfit', 'Segoe UI', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif'],
        vazir: ['Vazirmatn', 'Outfit', 'Segoe UI', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace']
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      }
    },
  },
  plugins: [],
}
